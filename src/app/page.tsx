import BrokerCard from "@/components/ui/BrokerCard";
import TrackedLink from "@/components/ui/TrackedLink";
import { calculatorConfig } from "@/lib/config";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-white to-tint">
      <header className="mx-auto flex w-full max-w-[1280px] justify-center px-6 pt-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-mt.png" alt={calculatorConfig.brokerName} className="h-16 w-auto" />
      </header>

      <div className="mx-auto flex max-w-[800px] flex-col items-center gap-10 px-6 py-10 text-center lg:py-16">
        <div className="animate-fadeUp">
          <span className="caps-label inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-1.5 text-[11px] font-semibold text-primary shadow-card">
            🔒 Gratuit · Sans engagement · Aucun impact sur ton crédit
          </span>

          <h1 className="mt-6 font-serif text-4xl font-bold leading-[1.1] text-ink sm:text-5xl lg:text-6xl">
            Combien pourrais-tu <span className="brand-word">économiser</span> en consolidant tes
            dettes?
          </h1>

          <p className="mt-6 text-lg text-muted">
            Réponds à quelques questions sur tes dettes et ta propriété, et découvre ton potentiel
            d&apos;économie en regroupant tes dettes dans ton hypothèque — analyse gratuite et
            personnalisée par {calculatorConfig.brokerName}.
          </p>

          <div className="mt-8 flex justify-center">
            <TrackedLink
              href="/calculator"
              event="ViewContent"
              className="inline-flex h-14 w-full items-center justify-center rounded-2xl bg-primary px-8 text-base font-bold text-white shadow-glow transition hover:bg-primary-light sm:w-auto"
            >
              Calculer mon potentiel d&apos;économie
            </TrackedLink>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            <ValueProp icon="🔒" title="Confidentiel" subtitle="Tes réponses restent privées" />
            <ValueProp icon="✓" title="Sans impact" subtitle="Aucun impact sur ton crédit" />
            <ValueProp icon="⚡" title="Réponse rapide" subtitle="Michel te recontacte vite" />
          </div>
        </div>

        <div className="w-full max-w-sm">
          <BrokerCard />
        </div>
      </div>
    </main>
  );
}

function ValueProp({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
      <div className="text-xl">{icon}</div>
      <div className="mt-1.5 text-sm font-bold text-ink">{title}</div>
      <div className="text-xs text-muted">{subtitle}</div>
    </div>
  );
}
