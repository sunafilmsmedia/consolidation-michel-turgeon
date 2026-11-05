import type { DebtType } from "@/types/calculator";

/**
 * Configuration globale du calculateur.
 *
 * brokerName / brokerPhone repris tels quels du CONFIG déjà en production sur
 * les deux autres outils de Michel Turgeon (refinancement-michel-turgeon.vercel.app,
 * taux120jours-michel-turgeon) — même courtier, même compte CRM/pub.
 * Michel n'a pas de lien d'agenda en ligne : le CTA principal est
 * "Appeler" / "Texter", voir ui/BrokerCard.tsx.
 */
export const calculatorConfig = {
  estimatedMortgageRate: 0.0549,
  amortizationYears: 25,
  maxRefinanceLTV: 0.8,

  debtRates: {
    credit_card: 0.1999,
    personal_loan: 0.0999,
    line_of_credit: 0.0899,
    car_loan: 0.0799,
    student_loan: 0.0599,
    buy_now_pay_later: 0.15,
    tax_debt: 0.1,
    other: 0.12,
    none: 0,
  } as Record<DebtType, number>,

  // Facteur de paiement mensuel estimé quand l'utilisateur ne connaît pas
  // son paiement (3,5 % du solde total).
  defaultDebtPaymentFactor: 0.035,
  minDebtPaymentFactor: 0.025,
  maxDebtPaymentFactor: 0.05,

  // Économie minimale affichée pour éviter d'afficher des micro-montants.
  minimumDisplayedSavings: 50,

  // Coordonnées du courtier.
  brokerName: "Michel Turgeon",
  brokerTitle: "Courtier hypothécaire",
  brokerPhone: "418 215 2060",
  brokerPhoneTel: "+14182152060",
};

export type CalculatorConfig = typeof calculatorConfig;
