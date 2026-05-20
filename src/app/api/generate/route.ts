import { NextRequest, NextResponse } from "next/server";
import { resolveCards } from "@/lib/scryfall";
import { buildEpub } from "@/lib/epub/builder";
import { insertConversion, insertCards } from "@/lib/db/queries";
import type { ParsedCard } from "@/lib/types";

export const runtime = "nodejs";
// Allow longer execution for EPUB generation
export const maxDuration = 300;

interface GenerateRequest {
  cards: ParsedCard[];
  deckName: string;
  deviceLabel: string;
  width: number;
  height: number;
  lang: string;
  skipFallback?: boolean;
  sourceType: "manabox_csv" | "manabox_arena" | "moxfield";
  sourceRaw: string;
}

function sanitizeEpubFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s-_äöüÄÖÜß]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 80) || "deck";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as GenerateRequest;
    const { cards, deckName, deviceLabel, width, height, lang, skipFallback, sourceType, sourceRaw } = body;

    if (!cards?.length) {
      return NextResponse.json({ error: "Keine Karten angegeben" }, { status: 400 });
    }
    if (!width || !height) {
      return NextResponse.json({ error: "Gerätedimensionen fehlen" }, { status: 400 });
    }

    // Resolve card images in requested language
    const resolved = await resolveCards(cards, lang ?? "en", skipFallback ?? false);
    const validCards = resolved.filter((c) => c.imageUrl);

    if (validCards.length === 0) {
      return NextResponse.json({ error: "Keine Kartenbilder gefunden." }, { status: 500 });
    }

    // Build EPUB
    const epub = await buildEpub({ deckName, cards: validCards, width, height, lang: lang ?? "en" });

    // Save to DB
    try {
      const conversionId = insertConversion({
        source_type: sourceType,
        source_raw: sourceRaw.slice(0, 5000),
        deck_name: deckName,
        card_count: validCards.length,
        device_label: deviceLabel,
        width_px: width,
        height_px: height,
      });

      insertCards(
        validCards.map((c) => ({
          conversion_id: conversionId,
          card_name: c.name,
          scryfall_id: c.scryfallId,
          quantity: c.quantity,
          image_url: c.imageUrl,
          set_code: c.setCode,
          collector_number: c.collectorNumber,
        }))
      );
    } catch {
      // DB errors are non-fatal — still return the EPUB
    }

    const filename = sanitizeEpubFilename(deckName);
    return new NextResponse(new Uint8Array(epub), {
      status: 200,
      headers: {
        "Content-Type": "application/epub+zip",
        "Content-Disposition": `attachment; filename="${filename}.epub"`,
        "Content-Length": String(epub.length),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "EPUB-Generierung fehlgeschlagen";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
