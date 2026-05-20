import { NextRequest, NextResponse } from "next/server";
import { deleteConversion } from "@/lib/db/queries";

export const runtime = "nodejs";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      return NextResponse.json({ error: "Ungültige ID" }, { status: 400 });
    }
    deleteConversion(numId);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "DB-Fehler";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
