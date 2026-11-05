"use client";

import type { PotentialLevel } from "@/types/calculator";
import { LEVEL_DESCRIPTIONS, LEVEL_LABELS } from "@/lib/scoring";

interface PotentialGaugeProps {
  score: number;
  level: PotentialLevel | null;
  hasEnoughInfo: boolean;
  compact?: boolean;
}

const LEVEL_COLORS: Record<PotentialLevel, string> = {
  low: "#9AA3B1",
  moderate: "#C3C9D2",
  good: "#8FA0C7",
  strong: "#14306A",
  very_strong: "#0A1F44",
};

export default function PotentialGauge({
  score,
  level,
  hasEnoughInfo,
  compact = false,
}: PotentialGaugeProps) {
  const pct = hasEnoughInfo ? Math.max(score, 6) : 0;
  const color = level ? LEVEL_COLORS[level] : "#C3C9D2";
  const label = hasEnoughInfo && level ? LEVEL_LABELS[level] : "À découvrir";
  const description =
    hasEnoughInfo && level
      ? LEVEL_DESCRIPTIONS[level]
      : "Réponds à quelques questions et ton potentiel d'économie se précisera ici.";

  return (
    <div className={`rounded-3xl border border-line bg-white p-6 ${compact ? "" : "shadow-card"}`}>
      <div className="caps-label flex items-center gap-2 text-[11px] font-semibold text-primary">
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10">⚡</span>
        Ton potentiel actuel
      </div>

      <div
        className="mt-4 font-serif text-xl font-bold transition-colors"
        style={{ color: hasEnoughInfo ? color : "#0A1F44" }}
      >
        {label}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>

      <div className="relative mt-4 h-2.5 w-full overflow-hidden rounded-full bg-tint">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>

      {hasEnoughInfo && (
        <div className="mt-2 text-right text-xs text-muted">
          Indice de potentiel : {Math.round(score)} / 100
        </div>
      )}
    </div>
  );
}
