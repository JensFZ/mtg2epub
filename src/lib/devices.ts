import type { DevicePreset } from "./types";

export const DEVICE_PRESETS: DevicePreset[] = [
  { id: "xteink_x4", label: "xteink x4", width: 480, height: 800 },
  { id: "kindle_paperwhite", label: "Kindle Paperwhite (2024)", width: 1072, height: 1448 },
  { id: "kindle_scribe", label: "Kindle Scribe", width: 1860, height: 2480 },
  { id: "kobo_clara", label: "Kobo Clara BW/Colour", width: 1072, height: 1448 },
  { id: "kobo_libra", label: "Kobo Libra Colour", width: 1264, height: 1680 },
  { id: "kobo_elipsa", label: "Kobo Elipsa 2E", width: 1404, height: 1872 },
  { id: "kobo_sage", label: "Kobo Sage", width: 1440, height: 1920 },
  { id: "boox_note", label: "Onyx Boox Note Air", width: 1860, height: 2480 },
  { id: "remarkable", label: "reMarkable Paper Pro", width: 1620, height: 2160 },
  { id: "custom", label: "Benutzerdefiniert", width: 0, height: 0 },
];

export const DEFAULT_PRESET_ID = "xteink_x4";
