import { NextResponse } from "next/server";
import { getCacheStats, clearImageCache } from "@/lib/db/queries";

export const runtime = "nodejs";

export async function GET() {
  try {
    const stats = getCacheStats();
    return NextResponse.json(stats);
  } catch (err) {
    const message = err instanceof Error ? err.message : "DB-Fehler";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    clearImageCache();
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "DB-Fehler";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
