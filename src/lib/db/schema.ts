import Database from "better-sqlite3";

export function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS conversions (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      source_type  TEXT NOT NULL CHECK(source_type IN ('manabox_csv','manabox_arena','moxfield')),
      source_raw   TEXT NOT NULL,
      deck_name    TEXT NOT NULL DEFAULT '',
      card_count   INTEGER NOT NULL DEFAULT 0,
      device_label TEXT NOT NULL DEFAULT '',
      width_px     INTEGER NOT NULL,
      height_px    INTEGER NOT NULL,
      created_at   INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS conversion_cards (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      conversion_id    INTEGER NOT NULL REFERENCES conversions(id) ON DELETE CASCADE,
      card_name        TEXT NOT NULL,
      scryfall_id      TEXT,
      quantity         INTEGER NOT NULL DEFAULT 1,
      image_url        TEXT,
      set_code         TEXT,
      collector_number TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_cc_conversion ON conversion_cards(conversion_id);

    CREATE TABLE IF NOT EXISTS card_image_cache (
      card_key    TEXT PRIMARY KEY,  -- "{name_lower}:{lang}"
      preview_url TEXT NOT NULL,
      image_url   TEXT NOT NULL,
      image_data  BLOB,              -- NULL until first EPUB generation
      cached_at   INTEGER NOT NULL DEFAULT (unixepoch())
    );
  `);
}
