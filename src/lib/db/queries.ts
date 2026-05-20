import { getDb } from "./index";
import type { ConversionRecord } from "@/lib/types";

interface InsertConversionParams {
  source_type: "manabox_csv" | "manabox_arena" | "moxfield";
  source_raw: string;
  deck_name: string;
  card_count: number;
  device_label: string;
  width_px: number;
  height_px: number;
}

interface InsertCardParams {
  conversion_id: number;
  card_name: string;
  scryfall_id?: string;
  quantity: number;
  image_url?: string;
  set_code?: string;
  collector_number?: string;
}

export function insertConversion(params: InsertConversionParams): number {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO conversions (source_type, source_raw, deck_name, card_count, device_label, width_px, height_px)
    VALUES (@source_type, @source_raw, @deck_name, @card_count, @device_label, @width_px, @height_px)
  `);
  const result = stmt.run(params);
  return result.lastInsertRowid as number;
}

export function insertCards(cards: InsertCardParams[]) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO conversion_cards (conversion_id, card_name, scryfall_id, quantity, image_url, set_code, collector_number)
    VALUES (@conversion_id, @card_name, @scryfall_id, @quantity, @image_url, @set_code, @collector_number)
  `);
  const insertMany = db.transaction((rows: InsertCardParams[]) => {
    for (const row of rows) {
      stmt.run(row);
    }
  });
  insertMany(cards);
}

export function listConversions(): ConversionRecord[] {
  const db = getDb();
  return db
    .prepare("SELECT id, source_type, deck_name, card_count, device_label, width_px, height_px, created_at FROM conversions ORDER BY created_at DESC")
    .all() as ConversionRecord[];
}

export function deleteConversion(id: number) {
  const db = getDb();
  db.prepare("DELETE FROM conversions WHERE id = ?").run(id);
}

export function deleteAllConversions() {
  const db = getDb();
  db.prepare("DELETE FROM conversions").run();
}

// ── Image cache ──────────────────────────────────────────────────────────────

export interface CacheEntry {
  preview_url: string;
  image_url: string;
  image_data: Buffer | null;
}

export function getCacheEntry(cardKey: string): CacheEntry | null {
  const db = getDb();
  return db
    .prepare("SELECT preview_url, image_url, image_data FROM card_image_cache WHERE card_key = ?")
    .get(cardKey) as CacheEntry | null;
}

export function setCacheUrls(cardKey: string, previewUrl: string, imageUrl: string) {
  const db = getDb();
  db.prepare(`
    INSERT INTO card_image_cache (card_key, preview_url, image_url)
    VALUES (?, ?, ?)
    ON CONFLICT(card_key) DO UPDATE SET
      preview_url = excluded.preview_url,
      image_url   = excluded.image_url,
      cached_at   = unixepoch()
  `).run(cardKey, previewUrl, imageUrl);
}

export function setCacheImageData(cardKey: string, imageData: Buffer) {
  const db = getDb();
  db.prepare(`
    UPDATE card_image_cache SET image_data = ?, cached_at = unixepoch()
    WHERE card_key = ?
  `).run(imageData, cardKey);
}

export interface CacheStats {
  entry_count: number;
  with_image: number;
  size_bytes: number;
}

export function getCacheStats(): CacheStats {
  const db = getDb();
  return db.prepare(`
    SELECT
      COUNT(*)                         AS entry_count,
      COUNT(image_data)                AS with_image,
      COALESCE(SUM(LENGTH(image_data)), 0) AS size_bytes
    FROM card_image_cache
  `).get() as CacheStats;
}

export function clearImageCache() {
  const db = getDb();
  db.prepare("DELETE FROM card_image_cache").run();
}
