import { NextRequest, NextResponse } from "next/server";
import { parseManabox } from "@/lib/parsers/manabox";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json() as { text: string };
    if (!text?.trim()) {
      return NextResponse.json({ error: "Kein Text angegeben" }, { status: 400 });
    }
    const result = parseManabox(text);
    if (result.cards.length === 0) {
      return NextResponse.json({ error: "Keine Karten gefunden. Bitte Format prüfen." }, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unbekannter Fehler";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
