import type { ParsedCard, ResolvedCard } from "@/lib/types";
import { getCacheEntry, setCacheUrls } from "@/lib/db/queries";

const SCRYFALL_BASE = "https://api.scryfall.com";

interface ScryfallImageUris {
  small?: string;
  normal?: string;
  large?: string;
  png?: string;
}

interface ScryfallCard {
  image_uris?: ScryfallImageUris;
  card_faces?: Array<{ image_uris?: ScryfallImageUris }>;
  name?: string;
  set?: string;
  collector_number?: string;
}

function getImageUris(card: ScryfallCard): ScryfallImageUris | null {
  if (card.image_uris) return card.image_uris;
  if (card.card_faces?.[0]?.image_uris) return card.card_faces[0].image_uris;
  return null;
}

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

// ── Module-level rate limiter ─────────────────────────────────────────────────
// Scryfall allows max 10 req/s. We reserve one slot per 175ms (~5.7 req/s),
// giving a comfortable buffer. All requests go through reserveSlot() so the
// total rate is bounded regardless of concurrency.
let nextSlot = Date.now();
const SLOT_MS = 175;

function reserveSlot(): Promise<void> {
  const now = Date.now();
  if (nextSlot <= now) {
    nextSlot = now + SLOT_MS;
    return Promise.resolve();
  }
  const wait = nextSlot - now;
  nextSlot += SLOT_MS;
  return delay(wait);
}
// ─────────────────────────────────────────────────────────────────────────────

async function fetchWithRetry(url: string, retries = 3): Promise<ScryfallCard | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    await reserveSlot(); // enforce global rate limit before every request

    const res = await fetch(url);

    if (res.ok) return res.json() as Promise<ScryfallCard>;

    // 404 = card not found — don't retry
    if (res.status === 404) return null;

    // 429 = still rate-limited despite throttling — respect Retry-After
    if (res.status === 429) {
      const retryAfter = Math.min(
        parseInt(res.headers.get("Retry-After") ?? "5", 10),
        30 // cap at 30s to avoid indefinite blocking
      );
      // Also push nextSlot forward so subsequent requests wait too
      nextSlot = Math.max(nextSlot, Date.now() + retryAfter * 1000);
      await delay(retryAfter * 1000);
      continue;
    }

    // 5xx or other transient errors — short backoff
    if (attempt < retries) {
      await delay(300 * 2 ** attempt); // 300ms, 600ms, 1.2s
      continue;
    }
  }
  return null;
}

async function fetchCardById(scryfallId: string): Promise<ScryfallCard | null> {
  return fetchWithRetry(`${SCRYFALL_BASE}/cards/${scryfallId}`);
}

async function fetchCardBySetNumber(
  setCode: string,
  number: string,
  lang?: string
): Promise<ScryfallCard | null> {
  const path = lang && lang !== "en"
    ? `${SCRYFALL_BASE}/cards/${setCode.toLowerCase()}/${number}/${lang}`
    : `${SCRYFALL_BASE}/cards/${setCode.toLowerCase()}/${number}`;
  return fetchWithRetry(path);
}

async function fetchCardByName(name: string, lang?: string): Promise<ScryfallCard | null> {
  if (lang && lang !== "en") {
    const q = encodeURIComponent(`!"${name}" lang:${lang}`);
    const card = await fetchWithRetry(
      `${SCRYFALL_BASE}/cards/search?q=${q}&unique=prints&order=released`
    ) as unknown as { data?: ScryfallCard[] } | null;
    if (card && "data" in card && card.data?.[0]) return card.data[0];
    // Fall through to English on failure
  }
  return fetchWithRetry(`${SCRYFALL_BASE}/cards/named?exact=${encodeURIComponent(name)}`);
}

async function resolveCard(
  card: ParsedCard,
  lang: string
): Promise<{ png: string; normal: string } | null> {
  const isEnglish = !lang || lang === "en";
  let data: ScryfallCard | null = null;

  if (isEnglish) {
    // Original English resolution path
    if (card.scryfallId) data = await fetchCardById(card.scryfallId);
    if (!data && card.setCode && card.collectorNumber) {
      data = await fetchCardBySetNumber(card.setCode, card.collectorNumber);
    }
    if (!data) data = await fetchCardByName(card.name);
  } else {
    // Non-English: first get English card to obtain canonical set+number,
    // then fetch the language-specific printing.
    let englishCard: ScryfallCard | null = null;
    if (card.scryfallId) englishCard = await fetchCardById(card.scryfallId);
    if (!englishCard && card.setCode && card.collectorNumber) {
      englishCard = await fetchCardBySetNumber(card.setCode, card.collectorNumber);
    }
    if (!englishCard) englishCard = await fetchCardByName(card.name);

    if (englishCard?.set && englishCard?.collector_number) {
      // Try to get the localized version of the same printing
      data = await fetchCardBySetNumber(englishCard.set, englishCard.collector_number, lang);
    }

    // Fall back: search by name in target language (any printing)
    if (!data) data = await fetchCardByName(card.name, lang);

    // Last resort: English fallback
    if (!data) data = englishCard;
  }

  if (!data) return null;

  const uris = getImageUris(data);
  if (!uris) return null;

  const png = uris.png ?? uris.large ?? uris.normal ?? "";
  const normal = uris.normal ?? uris.large ?? uris.png ?? "";
  return { png, normal };
}

// Simple concurrency limiter
function createLimiter(concurrency: number) {
  let active = 0;
  const queue: Array<() => void> = [];

  function next() {
    if (active < concurrency && queue.length > 0) {
      active++;
      queue.shift()!();
    }
  }

  return function limit<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      queue.push(async () => {
        try {
          resolve(await fn());
        } catch (e) {
          reject(e);
        } finally {
          active--;
          next();
        }
      });
      next();
    });
  };
}

export function cardKey(name: string, lang: string): string {
  return `${name.toLowerCase()}:${lang}`;
}

export async function resolveCards(cards: ParsedCard[], lang = "en"): Promise<ResolvedCard[]> {
  const limit = createLimiter(4);

  const results = await Promise.all(
    cards.map((card) =>
      limit(async () => {
        const key = cardKey(card.name, lang);

        // Cache hit — no Scryfall request needed
        const cached = getCacheEntry(key);
        if (cached) {
          return {
            ...card,
            imageUrl: cached.image_url,
            previewUrl: cached.preview_url,
          } satisfies ResolvedCard;
        }

        // Cache miss — fetch from Scryfall and persist URLs
        const urls = await resolveCard(card, lang);
        if (urls?.png && urls?.normal) {
          setCacheUrls(key, urls.normal, urls.png);
        }

        return {
          ...card,
          imageUrl: urls?.png ?? "",
          previewUrl: urls?.normal ?? "",
        } satisfies ResolvedCard;
      })
    )
  );

  return results;
}
