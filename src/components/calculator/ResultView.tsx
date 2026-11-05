"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CalculatorResult } from "@/types/calculator";
import { LEVEL_LABELS } from "@/lib/scoring";
import { formatCurrency } from "@/lib/format";
import { calculatorConfig } from "@/lib/config";
import { classifySavings } from "@/lib/savingsTier";
import { trackPixel } from "@/lib/pixel";
import BrokerCard from "@/components/ui/BrokerCard";

interface StoredResult {
  result: CalculatorResult;
  firstName: string;
}

const STRATEGY_LABELS: Record<CalculatorResult["recommendationType"], string> = {
  refinance_full: "Consolidation par refinancement",
  refinance_partial: "Consolidation partielle",
  not_enough_equity: "Analyse personnalisée requise",
};

export default function ResultView({ leadId }: { leadId: string }) {
  const [data, setData] = useState<StoredResult | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem(`result:${leadId}`);
    if (raw) {
      setData(JSON.parse(raw) as StoredResult);
      // La personne a complété le formulaire → événement Prospect (Lead).
      // Garde anti-doublon : une seule fois par lead, même si la page est rafraîchie.
      const firedKey = `lead-fired:${leadId}`;
      if (!sessionStorage.getItem(firedKey)) {
        trackPixel("Lead");
        sessionStorage.setItem(firedKey, "1");
      }
    }
    setLoaded(true);
  }, [leadId]);

  if (loaded && !data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white via-white to-tint px-6 text-center">
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink">Résultat introuvable</h1>
          <p className="mt-3 text-muted">
            Ton résultat n&apos;est plus disponible. Tu peux refaire l&apos;analyse en quelques
            minutes.
          </p>
          <Link
            href="/calculator"
            className="mt-6 inline-flex h-12 items-center rounded-2xl bg-primary px-6 font-bold text-white"
          >
            Recommencer
          </Link>
        </div>
      </main>
    );
  }

  if (!data) {
    return <main className="min-h-screen bg-white" />;
  }

  const { result, firstName } = data;
  const tier = classifySavings(result.estimatedMonthlySavings);
  const showFigures = result.estimatedMonthlySavings > 0;
  const level = LEVEL_LABELS[result.potentialLevel];

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-white to-tint">
      <header className="mx-auto flex w-full max-w-[1280px] justify-center px-6 pt-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-mt.png" alt={calculatorConfig.brokerName} className="h-16 w-auto" />
      </header>

      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="animate-fadeUp">
          <span className="caps-label text-xs font-semibold text-primary">Ton analyse</span>
          <h1 className="mt-3 font-serif text-3xl font-bold leading-tight text-ink sm:text-4xl">
            {firstName} — {tier.headline}.
          </h1>
          <p className="mt-4 text-lg text-muted">
            {showFigures
              ? `Selon les informations fournies, tu pourrais potentiellement économiser environ ${formatCurrency(
                  result.estimatedMonthlySavings
                )} par mois en regroupant tes dettes dans ton hypothèque.`
              : "Selon les informations fournies, la consolidation ne semble pas réduire tes paiements pour l'instant."}
          </p>
        </div>

        {/* Prochaine étape — confirmation seulement pour un dossier qui vaut la peine */}
        {tier.isWorthwhile ? (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-positive/30 bg-positive/5 p-5">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-positive/15 text-positive">
              ✓
            </span>
            <p className="text-sm leading-relaxed text-ink sm:text-base">
              Tu recevras une réponse précise lors de ton appel avec {calculatorConfig.brokerName}.
              Il va analyser ton dossier en détail et te rappeler dans les prochaines heures.
            </p>
          </div>
        ) : (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-line bg-tint p-5">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-ink">
              i
            </span>
            <p className="text-sm leading-relaxed text-ink sm:text-base">{tier.message}</p>
          </div>
        )}

        {/* Montant disponible via l'équité — cœur de la logique de consolidation */}
        {result.potentialCashAvailable !== undefined && result.potentialCashAvailable > 0 && (
          <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-5">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted">
              Montant potentiellement disponible via ton équité
            </div>
            <div className="mt-1 font-serif text-3xl font-bold text-primary">
              {formatCurrency(result.potentialCashAvailable)}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Estimé à partir de 80 % de la valeur de ta propriété, moins ton solde hypothécaire.
              C&apos;est le montant qui pourrait servir à rembourser tes autres dettes et à les
              regrouper dans un seul paiement.
            </p>
          </div>
        )}

        {/* Cartes */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <ResultCard
            label="Économie mensuelle estimée"
            value={showFigures ? `${formatCurrency(result.estimatedMonthlySavings)} / mois` : "À valider"}
            accent="positive"
          />
          <ResultCard
            label="Économie annuelle estimée"
            value={showFigures ? `${formatCurrency(result.estimatedAnnualSavings)} / année` : "À valider"}
            accent="positive"
          />
          <ResultCard label="Niveau de potentiel" value={level} accent="primary" />
          <ResultCard
            label="Type de stratégie suggérée"
            value={STRATEGY_LABELS[result.recommendationType]}
            accent="ink"
          />
        </div>

        {/* Réponse IA */}
        <div className="mt-8 rounded-3xl border border-line bg-white p-6 shadow-card">
          <h2 className="mb-3 flex items-center gap-2 font-serif text-lg font-bold text-ink">
            <span>⚡</span> Ton analyse personnalisée
          </h2>
          <div className="space-y-3 text-sm leading-relaxed text-ink/90">
            {result.aiResponse.split("\n").map((line, i) =>
              line.trim() === "" ? (
                <div key={i} className="h-1" />
              ) : (
                <p key={i}>{line}</p>
              )
            )}
          </div>
        </div>

        {/* Disclaimer */}
        <p className="mt-6 rounded-2xl border border-line bg-tint p-4 text-xs leading-relaxed text-muted">
          Cette estimation est fournie à titre informatif seulement. Elle ne constitue pas une
          approbation hypothécaire, une offre de financement ou un conseil financier personnalisé.
          Les résultats réels peuvent varier selon votre dossier, votre crédit, vos revenus, la
          valeur de votre propriété, les taux disponibles et les critères des prêteurs.
        </p>

        {/* Carte courtier */}
        <div className="mt-8">
          <BrokerCard />
        </div>

        <Link
          href="/thank-you"
          className="mt-6 block w-full rounded-2xl border border-line px-6 py-3 text-center text-sm font-semibold text-muted transition hover:bg-tint"
        >
          Recevoir mon analyse par courriel plutôt
        </Link>
      </div>
    </main>
  );
}

function ResultCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "positive" | "primary" | "ink";
}) {
  const accentClass =
    accent === "positive" ? "text-positive" : accent === "primary" ? "text-primary" : "text-ink";
  return (
    <div className="rounded-3xl border border-line bg-white p-6 shadow-card">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</div>
      <div className={`mt-2 font-serif text-2xl font-bold ${accentClass}`}>{value}</div>
    </div>
  );
}
