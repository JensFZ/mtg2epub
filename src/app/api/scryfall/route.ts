import { NextRequest, NextResponse } from "next/server";
import { resolveCards } from "@/lib/scryfall";
import type { ParsedCard } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { cards, lang } = await req.json() as { cards: ParsedCard[]; lang?: string };
    if (!cards?.length) {
      return NextResponse.json({ error: "Keine Karten angegeben" }, { status: 400 });
    }
    const resolved = await resolveCards(cards, lang ?? "en");
    return NextResponse.json({ cards: resolved });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Fehler bei Scryfall-Auflösung";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
