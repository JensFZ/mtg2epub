import type { ParsedCard } from "@/lib/types";

function extractSlug(url: string): string | null {
  const match = /moxfield\.com\/decks\/([A-Za-z0-9_-]+)/.exec(url);
  return match ? match[1] : null;
}

interface MoxfieldCard {
  quantity: number;
  card: Record<string, unknown>;
}

interface MoxfieldDeck {
  name?: string;
  mainboard?: Record<string, MoxfieldCard>;
  commanders?: Record<string, MoxfieldCard>;
  sideboard?: Record<string, MoxfieldCard>;
}

function extractScryfallId(card: Record<string, unknown>): string | undefined {
  for (const key of ["scryfall_id", "scryfallId", "id"]) {
    if (typeof card[key] === "string" && (card[key] as string).length === 36) {
      return card[key] as string;
    }
  }
  return undefined;
}

function boardToCards(board: Record<string, MoxfieldCard> | undefined): ParsedCard[] {
  if (!board) return [];
  return Object.values(board).map((entry) => ({
    name: String(entry.card["name"] ?? "Unknown"),
    quantity: entry.quantity,
    scryfallId: extractScryfallId(entry.card),
    setCode: typeof entry.card["set"] === "string" ? entry.card["set"] : undefined,
    collectorNumber: typeof entry.card["cn"] === "string" ? entry.card["cn"] : undefined,
  }));
}

export async function fetchMoxfieldDeck(
  url: string,
  includeSideboard = false
): Promise<{ cards: ParsedCard[]; deckName: string }> {
  const slug = extractSlug(url);
  if (!slug) throw new Error("Ungültige Moxfield-URL. Format: https://www.moxfield.com/decks/...");

  const apiUrl = `https://api.moxfield.com/v2/decks/all/${slug}`;
  const res = await fetch(apiUrl, {
    headers: { "User-Agent": "MTG2epub/1.0" },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    if (res.status === 404) throw new Error("Deck nicht gefunden. Ist das Deck öffentlich?");
    throw new Error(`Moxfield-API Fehler: ${res.status}`);
  }

  const data = (await res.json()) as MoxfieldDeck;
  const deckName = data.name ?? "Unbekanntes Deck";

  const mainCards = boardToCards(data.mainboard);
  const commanderCards = boardToCards(data.commanders);
  const sideCards = includeSideboard ? boardToCards(data.sideboard) : [];

  // Deduplicate by card name
  const map = new Map<string, ParsedCard>();
  for (const card of [...mainCards, ...commanderCards, ...sideCards]) {
    const key = card.name.toLowerCase();
    if (map.has(key)) {
      map.get(key)!.quantity += card.quantity;
    } else {
      map.set(key, card);
    }
  }

  return { cards: Array.from(map.values()), deckName };
}
