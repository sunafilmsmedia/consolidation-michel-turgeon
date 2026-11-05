# Consolidation IA — Michel Turgeon

Formulaire intelligent multi-étapes pour Michel Turgeon, courtier hypothécaire. Le visiteur
répond à quelques questions sur ses dettes et sa propriété, l'app estime son potentiel
d'économie par consolidation/refinancement, génère une explication (IA) et prépare un
**lead qualifié prêt à envoyer au CRM**.

C'est le même moteur de calcul que `consolidation-elie` (même logique financière, même
courtier-type), rebrandé avec l'identité déjà en production de Michel sur
`refinancement-michel-turgeon.vercel.app` et `taux120jours-michel-turgeon` : palette navy
`#0A1F44` / argent `#C3C9D2`, polices Cinzel (`caps-label`) + Playfair Display (`font-serif`) +
Montserrat (`font-sans`), logo `public/logo-mt.png`, téléphone, pixel Meta et Clarity de Michel
(même compte pub, mêmes IDs — voir `src/app/layout.tsx` et `src/lib/config.ts`). Michel n'a pas
de lien d'agenda en ligne : le CTA principal est « Appeler » / « Texter » (voir
`src/components/ui/BrokerCard.tsx`).

## Démarrage

```bash
npm install
npm run dev        # http://localhost:3000
```

## Statut des intégrations

| Service | État | Où le brancher |
|---|---|---|
| Calculs financiers | ✅ réels, en local | `src/lib/calculations.ts`, `scoring.ts`, `recommendation.ts` |
| Réponse IA | 🟡 **stub** (texte local) sans clé | `src/lib/ai.ts` → `ANTHROPIC_API_KEY` (défaut: `claude-opus-5-5`) |
| Envoi CRM | 🟡 **stub** (log serveur) sans URL | `src/lib/crm.ts` → `CRM_WEBHOOK_URL` (voir `.env.example` pour l'URL déjà utilisée par les deux autres outils de Michel) |
| Base de données | ⛔ non branché | Supabase (table `leads`) |

Copie `.env.example` vers `.env.local` et remplis les clés au besoin. Sans clés, tout
fonctionne en mode stub : le payload CRM est imprimé dans la console serveur.

## Flux

`/` (landing + jauge de potentiel) → `/calculator` (formulaire multi-étapes) →
`POST /api/submit-lead` (validation Zod → calculs → score → recommandation → IA → CRM) →
`/results/[id]` (résultat) → `/thank-you`.

## Données du lead (ce que Michel récupère)

Le payload CRM est construit dans `src/lib/crm.ts` (`buildCrmPayload`) : coordonnées, objectif,
types de dettes, montants, équité, économie estimée, score, niveau de potentiel,
recommandation et réponse IA, avec tags automatiques (dont la segmentation jour/nuit et
semaine/fin de semaine, comme sur `taux120jours-michel-turgeon`). Un dossier dont l'économie
estimée est inférieure à 300 $/mois n'est volontairement **pas** poussé au CRM (voir
`src/lib/savingsTier.ts`) — ce n'est pas un lead qualifié.

## Configuration métier

Taux par défaut, taux hypothécaire estimé, amortissement, LTV max, coordonnées de Michel :
`src/lib/config.ts`.
