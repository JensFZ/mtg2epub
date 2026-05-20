"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { ParsedCard } from "@/lib/types";

interface Props {
  onParsed: (cards: ParsedCard[], deckName: string, url: string) => void;
  onError: (msg: string) => void;
}

export function MoxfieldInput({ onParsed, onError }: Props) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [includeSideboard, setIncludeSideboard] = useState(false);

  async function handleLoad() {
    if (!url.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/moxfield", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, includeSideboard }),
      });
      const data = await res.json();
      if (!res.ok) {
        onError(data.error ?? "Moxfield-Fehler");
      } else {
        onParsed(data.cards, data.deckName, url);
      }
    } catch {
      onError("Netzwerkfehler beim Laden des Decks");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="moxfield-url">Moxfield Deck-URL</Label>
        <div className="flex gap-2 mt-1.5">
          <Input
            id="moxfield-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLoad()}
            placeholder="https://www.moxfield.com/decks/..."
            type="url"
          />
          <Button onClick={handleLoad} disabled={loading || !url.trim()}>
            {loading ? "Lädt..." : "Laden"}
          </Button>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={includeSideboard}
          onChange={(e) => setIncludeSideboard(e.target.checked)}
          className="rounded"
        />
        Sideboard einschließen
      </label>
      <p className="text-xs text-muted-foreground">
        Das Deck muss öffentlich zugänglich sein.
      </p>
    </div>
  );
}
