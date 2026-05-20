import { NextResponse } from "next/server";
import { listConversions, deleteAllConversions } from "@/lib/db/queries";

export const runtime = "nodejs";

export async function GET() {
  try {
    const records = listConversions();
    return NextResponse.json({ records });
  } catch (err) {
    const message = err instanceof Error ? err.message : "DB-Fehler";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    deleteAllConversions();
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "DB-Fehler";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
