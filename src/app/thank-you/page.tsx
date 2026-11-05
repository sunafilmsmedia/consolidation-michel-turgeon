import Link from "next/link";

export default function ThankYouPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white via-white to-tint px-6 text-center">
      <div className="max-w-md animate-fadeUp">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-positive/15 text-3xl">
          ✓
        </div>
        <h1 className="font-serif text-3xl font-bold text-ink">C&apos;est noté!</h1>
        <p className="mt-4 text-muted">
          Ton analyse a bien été enregistrée. Michel Turgeon pourra communiquer avec toi pour
          valider tes options réelles, sans engagement de ta part.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex h-12 items-center rounded-2xl border border-line px-6 font-semibold text-ink transition hover:bg-tint"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </main>
  );
}
