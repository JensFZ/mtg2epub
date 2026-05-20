import { NextRequest, NextResponse } from "next/server";
import { fetchMoxfieldDeck } from "@/lib/parsers/moxfield";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { url, includeSideboard } = await req.json() as { url: string; includeSideboard?: boolean };
    if (!url?.trim()) {
      return NextResponse.json({ error: "Keine URL angegeben" }, { status: 400 });
    }
    const result = await fetchMoxfieldDeck(url, includeSideboard ?? false);
    if (result.cards.length === 0) {
      return NextResponse.json({ error: "Keine Karten im Deck gefunden." }, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Fehler beim Laden des Moxfield-Decks";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
