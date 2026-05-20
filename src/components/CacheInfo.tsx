"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Database, Trash2 } from "lucide-react";

interface CacheStats {
  entry_count: number;
  with_image: number;
  size_bytes: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function CacheInfo() {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [clearing, setClearing] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/cache");
      if (res.ok) setStats(await res.json());
    } catch {
      // non-fatal
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  async function handleClear() {
    if (!confirm("Bild-Cache leeren? Karten werden beim nächsten Export neu geladen.")) return;
    setClearing(true);
    try {
      await fetch("/api/cache", { method: "DELETE" });
      await fetchStats();
    } finally {
      setClearing(false);
    }
  }

  if (!stats || stats.entry_count === 0) return null;

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Database className="h-3 w-3 shrink-0" />
      <span>
        Cache: <strong>{stats.entry_count}</strong> Karten
        {stats.with_image > 0 && (
          <> · <strong>{formatBytes(stats.size_bytes)}</strong> Bilder</>
        )}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-5 text-muted-foreground hover:text-destructive"
        onClick={handleClear}
        disabled={clearing}
        title="Cache leeren"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}
