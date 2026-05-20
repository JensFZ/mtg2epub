"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import type { ConversionRecord } from "@/lib/types";

interface Props {
  records: ConversionRecord[];
  onRefresh: () => void;
}

const SOURCE_LABELS: Record<string, string> = {
  manabox_csv: "ManaBox CSV",
  manabox_arena: "ManaBox Arena",
  moxfield: "Moxfield",
};

export function HistoryTable({ records, onRefresh }: Props) {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [clearingAll, setClearingAll] = useState(false);

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      await fetch(`/api/history/${id}`, { method: "DELETE" });
      onRefresh();
    } finally {
      setDeletingId(null);
    }
  }

  async function handleClearAll() {
    if (!confirm("Wirklich alle Einträge löschen?")) return;
    setClearingAll(true);
    try {
      await fetch("/api/history", { method: "DELETE" });
      onRefresh();
    } finally {
      setClearingAll(false);
    }
  }

  if (records.length === 0) {
    return (
      <p className="text-muted-foreground text-sm text-center py-8">
        Noch keine Konvertierungen vorhanden.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleClearAll}
          disabled={clearingAll}
          className="gap-1.5 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Alle löschen
        </Button>
      </div>

      <div className="rounded-md border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-3 py-2 font-medium">Deck</th>
              <th className="text-left px-3 py-2 font-medium hidden sm:table-cell">Quelle</th>
              <th className="text-left px-3 py-2 font-medium hidden md:table-cell">Karten</th>
              <th className="text-left px-3 py-2 font-medium hidden lg:table-cell">Gerät</th>
              <th className="text-left px-3 py-2 font-medium">Datum</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {records.map((rec) => (
              <tr key={rec.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-3 py-2.5 font-medium max-w-[180px] truncate">
                  {rec.deck_name || "—"}
                </td>
                <td className="px-3 py-2.5 hidden sm:table-cell">
                  <Badge variant="outline" className="text-xs">
                    {SOURCE_LABELS[rec.source_type] ?? rec.source_type}
                  </Badge>
                </td>
                <td className="px-3 py-2.5 hidden md:table-cell text-muted-foreground">
                  {rec.card_count}
                </td>
                <td className="px-3 py-2.5 hidden lg:table-cell text-muted-foreground text-xs">
                  {rec.device_label || `${rec.width_px}×${rec.height_px}`}
                </td>
                <td className="px-3 py-2.5 text-muted-foreground text-xs whitespace-nowrap">
                  {new Date(rec.created_at * 1000).toLocaleDateString("de-DE", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-3 py-2.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(rec.id)}
                    disabled={deletingId === rec.id}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
