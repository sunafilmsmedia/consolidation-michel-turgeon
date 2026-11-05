import type { CalculatorInput, CalculatorResult } from "@/types/calculator";
import { LEVEL_LABELS } from "./scoring";
import {
  DEBT_TYPE_LABELS,
  PRIMARY_GOAL_LABELS,
  USER_STATUS_LABELS,
} from "./format";
import { classifySavings } from "./savingsTier";

/**
 * Payload CRM (format GoHighLevel) construit à partir du lead.
 * C'est l'objet que Michel veut récupérer.
 */
export interface CrmPayload {
  firstName: string;
  lastName?: string;
  email: string;
  phone: string;
  // Segmentation jour/nuit remontée au premier niveau pour être visible
  // directement dans le webhook GHL.
  periode: "jour" | "nuit";
  lead_type: "lead_jour" | "lead_nuit";
  // Segmentation semaine / fin de semaine (même logique que les deux autres
  // outils de Michel), pour adapter le message GHL selon le jour d'entrée.
  type_semaine: "semaine" | "fin_de_semaine";
  tags: string[];
  customFields: Record<string, string | number>;
}

function levelTag(level: CalculatorResult["potentialLevel"]): string {
  const map: Record<CalculatorResult["potentialLevel"], string> = {
    low: "Potentiel - Faible",
    moderate: "Potentiel - Moyen",
    good: "Potentiel - Bon",
    strong: "Potentiel - Fort",
    very_strong: "Potentiel - Très fort",
  };
  return map[level];
}

/**
 * Segmentation jour/nuit selon l'heure du Québec (America/Toronto — gère
 * automatiquement l'heure d'été/hiver). Jour = 8h à 20h, Nuit = 20h à 8h.
 */
export function getLeadPeriod(): { periode: "jour" | "nuit"; lead_type: "lead_jour" | "lead_nuit" } {
  const hourStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    hour: "2-digit",
    hourCycle: "h23",
  }).format(new Date());
  const hour = Number(hourStr) % 24;
  const isDay = hour >= 8 && hour < 20;
  return isDay
    ? { periode: "jour", lead_type: "lead_jour" }
    : { periode: "nuit", lead_type: "lead_nuit" };
}

/**
 * Segmentation semaine / fin de semaine selon le jour au Québec
 * (America/Toronto). Semaine = lundi au samedi, Fin de semaine = dimanche.
 */
export function getLeadWeekPart(): { type_semaine: "semaine" | "fin_de_semaine" } {
  const weekday = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    weekday: "short",
  }).format(new Date());
  return { type_semaine: weekday === "Sun" ? "fin_de_semaine" : "semaine" };
}

export function buildCrmPayload(
  input: CalculatorInput,
  result: CalculatorResult
): CrmPayload {
  const tier = classifySavings(result.estimatedMonthlySavings);
  const { periode, lead_type } = getLeadPeriod();
  const { type_semaine } = getLeadWeekPart();

  const tags = [
    "Lead - Calculateur consolidation",
    levelTag(result.potentialLevel),
    `Économie - ${tier.label}`,
    "Propriétaire",
    lead_type, // "lead_jour" ou "lead_nuit" — pour router le lead dans GHL
    `lead_${type_semaine}`, // "lead_semaine" ou "lead_fin_de_semaine"
  ];

  if (result.recommendationType === "refinance_full") tags.push("Refinancement possible");
  if (result.recommendationType === "refinance_partial") tags.push("Consolidation partielle");

  return {
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    phone: input.phone,
    periode,
    lead_type,
    type_semaine,
    tags,
    customFields: {
      userStatus: USER_STATUS_LABELS[input.userStatus],
      primaryGoal: PRIMARY_GOAL_LABELS[input.primaryGoal],
      debtTypes: input.debtTypes.map((t) => DEBT_TYPE_LABELS[t]).join(", "),
      totalDebtAmount: input.totalDebtAmount,
      monthlyDebtPayment: result.estimatedCurrentDebtPayment,
      estimatedMonthlySavings: result.estimatedMonthlySavings,
      estimatedAnnualSavings: result.estimatedAnnualSavings,
      propertyValue: input.propertyValue ?? 0,
      mortgageBalance: input.mortgageBalance ?? 0,
      potentialCashAvailable: result.potentialCashAvailable ?? 0,
      savingsScore: result.savingsScore,
      potentialLevel: LEVEL_LABELS[result.potentialLevel],
      periode,
      lead_type,
      type_semaine,
      aiResponse: result.aiResponse,
    },
  };
}

export interface CrmSyncResult {
  ok: boolean;
  error?: string;
}

// Webhook GoHighLevel / LeadConnector — PAS hardcodé ici (même raisonnement
// que taux120jours-michel-turgeon) : tant que CRM_WEBHOOK_URL n'est pas
// défini, on logue le lead côté serveur au lieu de l'envoyer, pour ne jamais
// polluer le CRM de production pendant le dev/les tests. Voir .env.example
// pour l'URL déjà utilisée en production par les deux autres outils de
// Michel (même courtier, même CRM) — à coller en prod une fois ce projet
// validé, pour que les trois outils tombent dans le même pipeline de leads.
const CRM_WEBHOOK_URL = process.env.CRM_WEBHOOK_URL;

/**
 * Envoi du lead au CRM (POST JSON vers le webhook GoHighLevel/LeadConnector).
 * Un échec CRM ne doit jamais bloquer l'utilisateur (le lead est quand même
 * retourné à la personne).
 */
export async function sendToCrm(payload: CrmPayload): Promise<CrmSyncResult> {
  if (!CRM_WEBHOOK_URL) {
    console.log("[CRM_STUB] CRM_WEBHOOK_URL non défini — lead loggué localement :", payload);
    return { ok: true };
  }

  try {
    const res = await fetch(CRM_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      return { ok: false, error: `CRM_SYNC_FAILED: HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: `CRM_SYNC_FAILED: ${(e as Error).message}` };
  }
}
