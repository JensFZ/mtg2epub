export const CARD_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
  { code: "it", label: "Italiano" },
  { code: "pt", label: "Português" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "ru", label: "Русский" },
  { code: "zhs", label: "简体中文" },
  { code: "zht", label: "繁體中文" },
] as const;

export type CardLanguageCode = (typeof CARD_LANGUAGES)[number]["code"];

export interface ParsedCard {
  name: string;
  quantity: number;
  scryfallId?: string;
  setCode?: string;
  collectorNumber?: string;
}

export interface ResolvedCard extends ParsedCard {
  imageUrl: string;
  previewUrl: string;
}

export interface DevicePreset {
  id: string;
  label: string;
  width: number;
  height: number;
}

export interface ConversionRecord {
  id: number;
  source_type: "manabox_csv" | "manabox_arena" | "moxfield";
  deck_name: string;
  card_count: number;
  device_label: string;
  width_px: number;
  height_px: number;
  created_at: number;
}
