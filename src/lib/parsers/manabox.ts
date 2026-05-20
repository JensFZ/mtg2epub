import type { ParsedCard } from "@/lib/types";

type DetectedFormat = "csv" | "arena";

function detectFormat(text: string): DetectedFormat {
  const firstLine = text.trim().split(/\r?\n/)[0].trim();
  if (firstLine.toLowerCase().startsWith("count,name,")) return "csv";
  if (/^\d+\s+.+\s+\(\w+\)\s+\d+/.test(firstLine)) return "arena";
  // Try arena as fallback
  return "arena";
}

function parseCsv(text: string): ParsedCard[] {
  const lines = text.trim().split(/\r?\n/);
  // Skip header row
  const dataLines = lines.slice(1).filter((l) => l.trim().length > 0);

  const map = new Map<string, ParsedCard>();

  for (const line of dataLines) {
    // Simple CSV split — handle quoted fields
    const cols = splitCsvLine(line);
    if (cols.length < 2) continue;

    const quantity = parseInt(cols[0], 10);
    const name = cols[1]?.trim();
    const setCode = cols[2]?.trim();
    const scryfallId = cols[11]?.trim();
    const collectorNumber = cols[13]?.trim();

    if (!name || isNaN(quantity)) continue;

    const key = name.toLowerCase();
    if (map.has(key)) {
      map.get(key)!.quantity += quantity;
    } else {
      map.set(key, {
        name,
        quantity,
        scryfallId: scryfallId || undefined,
        setCode: setCode || undefined,
        collectorNumber: collectorNumber || undefined,
      });
    }
  }

  return Array.from(map.values());
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// Arena format: "4 Lightning Bolt (M10) 149"
const ARENA_RE = /^(\d+)\s+(.+?)\s+\((\w+)\)\s+(\d+)\s*$/;

function parseArena(text: string): ParsedCard[] {
  const lines = text.trim().split(/\r?\n/);
  const map = new Map<string, ParsedCard>();

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.toLowerCase() === "deck" || trimmed.toLowerCase() === "sideboard") {
      continue;
    }

    // Try full Arena format first
    const match = ARENA_RE.exec(trimmed);
    if (match) {
      const quantity = parseInt(match[1], 10);
      const name = match[2].trim();
      const setCode = match[3];
      const collectorNumber = match[4];
      const key = name.toLowerCase();

      if (map.has(key)) {
        map.get(key)!.quantity += quantity;
      } else {
        map.set(key, { name, quantity, setCode, collectorNumber });
      }
      continue;
    }

    // Simpler format: "4 Lightning Bolt"
    const simpleMatch = /^(\d+)\s+(.+)$/.exec(trimmed);
    if (simpleMatch) {
      const quantity = parseInt(simpleMatch[1], 10);
      const name = simpleMatch[2].trim();
      const key = name.toLowerCase();

      if (map.has(key)) {
        map.get(key)!.quantity += quantity;
      } else {
        map.set(key, { name, quantity });
      }
    }
  }

  return Array.from(map.values());
}

export function parseManabox(text: string): { cards: ParsedCard[]; format: DetectedFormat } {
  const format = detectFormat(text);
  const cards = format === "csv" ? parseCsv(text) : parseArena(text);
  return { cards, format };
}
