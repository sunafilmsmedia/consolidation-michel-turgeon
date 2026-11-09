import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { calculatorInputSchema } from "@/lib/validation";
import { processLead } from "@/lib/engine";
import { buildCrmPayload, sendToCrm } from "@/lib/crm";
import { sendCapiLead } from "@/lib/metaCapi";
import { classifySavings } from "@/lib/savingsTier";
import type { CalculatorInput } from "@/types/calculator";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Corps de requête invalide." },
      { status: 400 }
    );
  }

  const parsed = calculatorInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Il manque quelques informations avant de pouvoir générer ton résultat.",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 422 }
    );
  }

  const input = parsed.data;
  const leadId = randomUUID();

  try {
    const { result } = await processLead(input);

    // On donne toujours le résultat (valeur) à la personne. Par contre, un
    // dossier dont l'économie estimée est trop faible (< 300 $/mois) n'est PAS
    // poussé au CRM : ce n'est pas un lead qualifié pour le courtier.
    const tier = classifySavings(result.estimatedMonthlySavings);

    // Meta CAPI : Lead serveur pour CHAQUE formulaire complété (comme le pixel
    // navigateur sur la page résultat). event_id = leadId → dédupliqué par Meta.
    const meta = ((body as { meta?: Record<string, unknown> }).meta ?? {}) as {
      fbp?: string;
      fbc?: string;
      sourceUrl?: string;
    };
    const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);
    const capi = sendCapiLead({
      eventId: leadId,
      email: input.email,
      phone: input.phone,
      firstName: input.firstName,
      lastName: input.lastName || undefined,
      fbp: str(meta.fbp),
      fbc: str(meta.fbc),
      clientIp: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
      sourceUrl: str(meta.sourceUrl),
      customData: {
        content_name: "Calculateur consolidation",
        potential_level: result.potentialLevel,
      },
    });

    if (tier.isWorthwhile) {
      const crmPayload = buildCrmPayload(input as CalculatorInput, result);
      const crm = await sendToCrm(crmPayload);
      if (!crm.ok) {
        console.error(crm.error);
      }
    } else {
      console.log(
        `[LEAD IGNORÉ] Économie estimée ${result.estimatedMonthlySavings} $/mois < 300 $ — non envoyé au CRM.`
      );
    }
    await capi;

    // TODO: persister dans Supabase (table `leads`) une fois branché.

    return NextResponse.json({
      success: true,
      leadId,
      resultUrl: `/results/${leadId}`,
      result,
    });
  } catch (e) {
    console.error("LEAD_PROCESSING_FAILED", e);
    return NextResponse.json(
      { success: false, error: "Une erreur est survenue. Réessaie dans un instant." },
      { status: 500 }
    );
  }
}
