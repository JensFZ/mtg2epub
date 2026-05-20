import JSZip from "jszip";
import { randomUUID } from "crypto";
import type { ResolvedCard } from "@/lib/types";
import { containerXml, contentOpf, tocNcx, navXhtml, cardXhtml } from "./templates";
import { getCardCss } from "./css";
import { getCacheEntry, setCacheImageData } from "@/lib/db/queries";
import { cardKey } from "@/lib/scryfall";

function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase()
    .slice(0, 50);
}

async function downloadImage(url: string): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return res.arrayBuffer();
  } catch {
    return null;
  }
}

async function getImageData(card: ResolvedCard, lang: string): Promise<ArrayBuffer | null> {
  const key = cardKey(card.name, lang);
  const cached = getCacheEntry(key);

  if (cached?.image_data) {
    // Return cached binary directly — no download needed
    return cached.image_data.buffer as ArrayBuffer;
  }

  if (!card.imageUrl) return null;

  const data = await downloadImage(card.imageUrl);
  if (data) {
    // Persist binary for future EPUB generations
    setCacheImageData(key, Buffer.from(data));
  }
  return data;
}

// Download images with concurrency limit
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

export async function buildEpub(params: {
  deckName: string;
  cards: ResolvedCard[];
  width: number;
  height: number;
  lang: string;
}): Promise<Buffer> {
  const { deckName, cards, width, height, lang } = params;
  const uid = randomUUID();
  const limit = createLimiter(4);

  // Fetch images from cache or download (and cache)
  const imageBuffers = await Promise.all(
    cards.map((card) =>
      limit(() => getImageData(card, lang))
    )
  );

  const zip = new JSZip();

  // mimetype MUST be first and uncompressed
  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });

  // META-INF
  zip.folder("META-INF")!.file("container.xml", containerXml());

  const oebps = zip.folder("OEBPS")!;
  oebps.folder("styles")!.file("card.css", getCardCss());

  const imagesFolder = oebps.folder("images")!;
  const pagesFolder = oebps.folder("pages")!;

  const manifestItems: Array<{ id: string; href: string; mediaType: string }> = [];
  const pageIds: string[] = [];
  let firstPageHref = "";

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const index = String(i + 1).padStart(4, "0");
    const slug = sanitizeFilename(card.name);
    const imgFilename = `card-${index}-${slug}.png`;
    const pageFilename = `card-${index}-${slug}.xhtml`;
    const imgHref = `images/${imgFilename}`;
    const pageHref = `pages/${pageFilename}`;
    const pageId = `card-${index}`;
    const imgId = `img-${index}`;

    if (i === 0) firstPageHref = pageHref;

    // Embed image
    const imgBuffer = imageBuffers[i];
    if (imgBuffer) {
      imagesFolder.file(imgFilename, imgBuffer);
    } else {
      imagesFolder.file(imgFilename, Buffer.from(""));
    }

    // XHTML page
    const xhtml = cardXhtml({
      title: card.name,
      width,
      height,
      imageSrc: `../${imgHref}`,
    });
    pagesFolder.file(pageFilename, xhtml);

    manifestItems.push({ id: imgId, href: imgHref, mediaType: "image/png" });
    manifestItems.push({ id: pageId, href: pageHref, mediaType: "application/xhtml+xml" });
    pageIds.push(pageId);
  }

  // Single nav entry for the whole deck — prevents e-readers from showing per-card chapters
  const singleNavPoint = firstPageHref
    ? [{ id: "nav-1", label: deckName, href: firstPageHref, order: 1 }]
    : [];

  oebps.file(
    "content.opf",
    contentOpf({ uid, title: deckName, width, height, items: manifestItems, pageIds })
  );
  oebps.file("toc.ncx", tocNcx({ uid, title: deckName, navPoints: singleNavPoint }));
  oebps.file("nav.xhtml", navXhtml({ title: deckName, navItems: firstPageHref ? [{ label: deckName, href: firstPageHref }] : [] }));

  const buffer = await zip.generateAsync({ type: "nodebuffer", mimeType: "application/epub+zip" });
  return buffer;
}
