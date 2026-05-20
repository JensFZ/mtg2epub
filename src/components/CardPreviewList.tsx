"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { ParsedCard, ResolvedCard } from "@/lib/types";

const CHUNK_SIZE = 8;

interface Props {
  cards: ParsedCard[];
  lang: string;
}

export function CardPreviewList({ cards, lang }: Props) {
  const [resolved, setResolved] = useState<ResolvedCard[]>([]);
  const [loaded, setLoaded] = useState(0);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  // Monotonic run counter — lets each invocation detect if it was superseded
  const runIdRef = useRef(0);

  const resolve = useCallback(async (toResolve: ParsedCard[], language: string) => {
    const myRunId = ++runIdRef.current;

    if (!toResolve.length) {
      setResolved([]);
      setLoaded(0);
      setTotal(0);
      return;
    }

    setResolved([]);
    setLoaded(0);
    setTotal(toResolve.length);
    setError(null);

    const chunks: ParsedCard[][] = [];
    for (let i = 0; i < toResolve.length; i += CHUNK_SIZE) {
      chunks.push(toResolve.slice(i, i + CHUNK_SIZE));
    }

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (runIdRef.current !== myRunId) return; // superseded by newer call

      // Small pause between chunks so the server isn't immediately hit again
      if (i > 0) await new Promise((r) => setTimeout(r, 100));

      try {
        const res = await fetch("/api/scryfall", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cards: chunk, lang: language }),
        });
        const data = await res.json();
        if (runIdRef.current !== myRunId) return;
        if (!res.ok) {
          setError(data.error ?? "Vorschau-Fehler");
          return;
        }
        setResolved((prev) => [...prev, ...data.cards]);
        setLoaded((prev) => prev + chunk.length);
      } catch {
        if (runIdRef.current !== myRunId) return;
        setError("Netzwerkfehler beim Laden der Vorschau");
        return;
      }
    } // end for chunks
  }, []);

  useEffect(() => {
    resolve(cards, lang);
  }, [cards, lang, resolve]);

  if (!cards.length) return null;

  const isLoading = total > 0 && loaded < total;
  const progress = total > 0 ? Math.round((loaded / total) * 100) : 0;

  // Show placeholder cards for unresolved entries
  const displayCards: Array<ParsedCard & Partial<ResolvedCard>> = [
    ...resolved,
    ...cards.slice(resolved.length).map((c) => ({ ...c, imageUrl: "", previewUrl: "" })),
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm">
          Vorschau
          <Badge variant="outline" className="ml-2">
            {cards.length} einzigartige Karten
          </Badge>
        </h3>
        {isLoading && (
          <span className="text-xs text-muted-foreground tabular-nums">
            {loaded} / {total}
          </span>
        )}
      </div>

      {isLoading && (
        <Progress value={progress} className="h-1.5" />
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
        {displayCards.map((card) => (
          <div key={card.name} className="relative">
            <div className="aspect-[5/7] rounded-sm overflow-hidden bg-muted">
              {card.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={card.previewUrl}
                  alt={card.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-1 animate-pulse bg-muted" />
              )}
            </div>
            {card.quantity && card.quantity > 1 && (
              <Badge
                variant="secondary"
                className="absolute top-0.5 right-0.5 text-[9px] px-1 py-0 h-4"
              >
                {card.quantity}×
              </Badge>
            )}
            <p className="text-[9px] text-center text-muted-foreground mt-0.5 truncate px-0.5">
              {card.name}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
