"use client";

import { useState, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { ParsedCard } from "@/lib/types";

interface Props {
  onParsed: (cards: ParsedCard[], format: string, raw: string) => void;
  onError: (msg: string) => void;
}

export function ManaBoxInput({ onParsed, onError }: Props) {
  const [text, setText] = useState("");
  const [format, setFormat] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const parse = useCallback(
    async (value: string) => {
      if (!value.trim()) {
        setFormat(null);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch("/api/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: value }),
        });
        const data = await res.json();
        if (!res.ok) {
          onError(data.error ?? "Parse-Fehler");
          setFormat(null);
        } else {
          setFormat(data.format);
          onParsed(data.cards, data.format, value);
        }
      } catch {
        onError("Netzwerkfehler beim Parsen");
      } finally {
        setLoading(false);
      }
    },
    [onParsed, onError]
  );

  function handleBlur() {
    parse(text);
  }

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const pasted = e.clipboardData.getData("text");
    setTimeout(() => parse(pasted), 0);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="manabox-input">ManaBox Export einfügen</Label>
        {loading && <span className="text-xs text-muted-foreground animate-pulse">Analysiere...</span>}
        {!loading && format && (
          <Badge variant="secondary">
            {format === "csv" ? "CSV-Format" : "Arena-Format"}
          </Badge>
        )}
      </div>
      <Textarea
        id="manabox-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleBlur}
        onPaste={handlePaste}
        placeholder={`CSV-Format:\nCount,Name,Edition,...\n1,Lightning Bolt,M10,...\n\nOder Arena-Format:\n4 Lightning Bolt (M10) 149\n2 Island (ZEN) 236`}
        className="font-mono text-sm min-h-48 resize-y"
      />
      <p className="text-xs text-muted-foreground">
        ManaBox → Sammlung/Deck exportieren → CSV oder Arena-Format einfügen
      </p>
    </div>
  );
}
