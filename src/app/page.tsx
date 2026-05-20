"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ManaBoxInput } from "@/components/ManaBoxInput";
import { MoxfieldInput } from "@/components/MoxfieldInput";
import { CardPreviewList } from "@/components/CardPreviewList";
import { DevicePresetSelector } from "@/components/DevicePresetSelector";
import { LanguageSelector } from "@/components/LanguageSelector";
import { GenerateButton } from "@/components/GenerateButton";
import { CacheInfo } from "@/components/CacheInfo";
import { DEFAULT_PRESET_ID, DEVICE_PRESETS } from "@/lib/devices";
import type { ParsedCard, CardLanguageCode } from "@/lib/types";
import { BookOpen, History } from "lucide-react";

type SourceType = "manabox_csv" | "manabox_arena" | "moxfield";

export default function HomePage() {
  const [cards, setCards] = useState<ParsedCard[]>([]);
  const [deckName, setDeckName] = useState("Mein Deck");
  const [sourceType, setSourceType] = useState<SourceType>("manabox_csv");
  const [sourceRaw, setSourceRaw] = useState("");

  const defaultPreset = DEVICE_PRESETS.find((p) => p.id === DEFAULT_PRESET_ID)!;
  const [presetId, setPresetId] = useState(DEFAULT_PRESET_ID);
  const [width, setWidth] = useState(defaultPreset.width);
  const [height, setHeight] = useState(defaultPreset.height);
  const [lang, setLang] = useState<CardLanguageCode>("en");
  const [skipFallback, setSkipFallback] = useState(false);

  function handleManaBoxParsed(parsed: ParsedCard[], fmt: string, raw: string) {
    setCards(parsed);
    setDeckName("ManaBox Deck");
    setSourceRaw(raw);
    setSourceType(fmt === "csv" ? "manabox_csv" : "manabox_arena");
  }

  function handleMoxfieldParsed(parsed: ParsedCard[], name: string, url: string) {
    setCards(parsed);
    setDeckName(name);
    setSourceRaw(url);
    setSourceType("moxfield");
  }

  function handleDeviceChange(id: string, w: number, h: number) {
    setPresetId(id);
    setWidth(w);
    setHeight(h);
  }

  function handleError(msg: string) {
    toast.error(msg);
  }

  function handleTabChange() {
    setCards([]);
  }

  const deviceLabel = DEVICE_PRESETS.find((p) => p.id === presetId)?.label ?? `${width}×${height}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h1 className="font-bold text-lg">MTG2epub</h1>
            <span className="text-xs text-muted-foreground hidden sm:block">
              Magic: The Gathering → E-Reader
            </span>
          </div>
          <div className="flex items-center gap-3">
            <CacheInfo />
            <Link
              href="/history"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <History className="h-4 w-4" />
              Verlauf
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        {/* Step 1 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <StepBadge n={1} />
              Karten importieren
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="manabox" onValueChange={handleTabChange}>
              <TabsList className="mb-4">
                <TabsTrigger value="manabox">ManaBox</TabsTrigger>
                <TabsTrigger value="moxfield">Moxfield</TabsTrigger>
              </TabsList>
              <TabsContent value="manabox">
                <ManaBoxInput onParsed={handleManaBoxParsed} onError={handleError} />
              </TabsContent>
              <TabsContent value="moxfield">
                <MoxfieldInput onParsed={handleMoxfieldParsed} onError={handleError} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Step 2 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <StepBadge n={2} />
              E-Reader wählen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DevicePresetSelector
              presetId={presetId}
              customWidth={width}
              customHeight={height}
              onChange={handleDeviceChange}
            />
            <LanguageSelector
              value={lang}
              onChange={(l) => {
                setLang(l);
                if (l === "en") setSkipFallback(false);
              }}
              skipFallback={skipFallback}
              onSkipFallbackChange={setSkipFallback}
            />
          </CardContent>
        </Card>

        {/* Step 3: only shown after cards are loaded */}
        {cards.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <StepBadge n={3} />
                Vorschau &amp; EPUB generieren
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <CardPreviewList cards={cards} lang={lang} />
              <Separator />
              <GenerateButton
                cards={cards}
                deckName={deckName}
                deviceLabel={deviceLabel}
                width={width}
                height={height}
                lang={lang}
                skipFallback={skipFallback}
                sourceType={sourceType}
                sourceRaw={sourceRaw}
                onError={handleError}
              />
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

function StepBadge({ n }: { n: number }) {
  return (
    <span className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shrink-0">
      {n}
    </span>
  );
}
