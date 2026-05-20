"use client";

import { DEVICE_PRESETS } from "@/lib/devices";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  presetId: string;
  customWidth: number;
  customHeight: number;
  onChange: (presetId: string, width: number, height: number) => void;
}

export function DevicePresetSelector({ presetId, customWidth, customHeight, onChange }: Props) {
  const isCustom = presetId === "custom";

  function handlePresetChange(value: string | null) {
    if (!value) return;
    const preset = DEVICE_PRESETS.find((p) => p.id === value);
    if (!preset) return;
    onChange(preset.id, preset.width, preset.height);
  }

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="device-preset">E-Reader Gerät</Label>
        <Select value={presetId} onValueChange={handlePresetChange}>
          <SelectTrigger id="device-preset" className="mt-1.5">
            <SelectValue placeholder="Gerät wählen..." />
          </SelectTrigger>
          <SelectContent>
            {DEVICE_PRESETS.map((preset) => (
              <SelectItem key={preset.id} value={preset.id}>
                {preset.label}
                {preset.width > 0 && (
                  <span className="ml-2 text-muted-foreground text-xs">
                    ({preset.width}×{preset.height} px)
                  </span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isCustom && (
        <div className="flex gap-3">
          <div className="flex-1">
            <Label htmlFor="custom-width">Breite (px)</Label>
            <Input
              id="custom-width"
              type="number"
              min={100}
              max={5000}
              value={customWidth || ""}
              onChange={(e) => onChange("custom", parseInt(e.target.value) || 0, customHeight)}
              placeholder="z.B. 480"
              className="mt-1.5"
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="custom-height">Höhe (px)</Label>
            <Input
              id="custom-height"
              type="number"
              min={100}
              max={5000}
              value={customHeight || ""}
              onChange={(e) => onChange("custom", customWidth, parseInt(e.target.value) || 0)}
              placeholder="z.B. 800"
              className="mt-1.5"
            />
          </div>
        </div>
      )}

      {!isCustom && presetId && (
        <p className="text-xs text-muted-foreground">
          Viewport: {DEVICE_PRESETS.find((p) => p.id === presetId)?.width} ×{" "}
          {DEVICE_PRESETS.find((p) => p.id === presetId)?.height} px
        </p>
      )}
    </div>
  );
}
