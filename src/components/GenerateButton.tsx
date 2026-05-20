"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Download } from "lucide-react";
import type { ParsedCard } from "@/lib/types";

interface Props {
  cards: ParsedCard[];
  deckName: string;
  deviceLabel: string;
  width: number;
  height: number;
  lang: string;
  sourceType: "manabox_csv" | "manabox_arena" | "moxfield";
  sourceRaw: string;
  onError: (msg: string) => void;
}

export function GenerateButton({
  cards,
  deckName,
  deviceLabel,
  width,
  height,
  lang,
  sourceType,
  sourceRaw,
  onError,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const disabled = !cards.length || !width || !height || loading;

  async function handleGenerate() {
    if (disabled) return;
    setLoading(true);
    setProgress(10);

    try {
      const intervalId = setInterval(() => {
        setProgress((p) => Math.min(p + 5, 90));
      }, 1000);

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cards,
          deckName,
          deviceLabel,
          width,
          height,
          lang,
          sourceType,
          sourceRaw,
        }),
      });

      clearInterval(intervalId);

      if (!res.ok) {
        const data = await res.json();
        onError(data.error ?? "EPUB-Generierung fehlgeschlagen");
        return;
      }

      setProgress(100);

      // Trigger download
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const cd = res.headers.get("Content-Disposition");
      const match = cd?.match(/filename="([^"]+)"/);
      a.download = match?.[1] ?? `${deckName}.epub`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      onError("Netzwerkfehler bei der EPUB-Generierung");
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 2000);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleGenerate}
        disabled={disabled}
        size="lg"
        className="w-full gap-2"
      >
        <Download className="h-4 w-4" />
        {loading
          ? "EPUB wird erstellt..."
          : `EPUB generieren (${cards.length} Karten)`}
      </Button>

      {loading && (
        <Progress value={progress} className="h-1.5" />
      )}

      {!width || !height ? (
        <p className="text-xs text-muted-foreground text-center">
          Bitte zuerst ein Gerät auswählen
        </p>
      ) : null}
    </div>
  );
}
