"use client";

import { CARD_LANGUAGES, type CardLanguageCode } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Props {
  value: CardLanguageCode;
  onChange: (lang: CardLanguageCode) => void;
  skipFallback: boolean;
  onSkipFallbackChange: (skip: boolean) => void;
}

export function LanguageSelector({ value, onChange, skipFallback, onSkipFallbackChange }: Props) {
  const isNonEnglish = value !== "en";

  return (
    <div>
      <Label htmlFor="card-language">Kartensprache</Label>
      <Select
        value={value}
        onValueChange={(v) => {
          if (v) onChange(v as CardLanguageCode);
        }}
      >
        <SelectTrigger id="card-language" className="mt-1.5">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CARD_LANGUAGES.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              {lang.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isNonEnglish ? (
        <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={skipFallback}
            onChange={(e) => onSkipFallbackChange(e.target.checked)}
            className="h-3.5 w-3.5 accent-primary"
          />
          <span className="text-xs text-muted-foreground">
            Karten ohne {CARD_LANGUAGES.find((l) => l.code === value)?.label}-Version weglassen
          </span>
        </label>
      ) : (
        <p className="text-xs text-muted-foreground mt-1">
          Falls eine Karte nicht in dieser Sprache verfügbar ist, wird automatisch die englische Version verwendet.
        </p>
      )}
    </div>
  );
}
