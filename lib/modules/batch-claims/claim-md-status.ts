import type {
  ClaimMdAdjudicationStatus,
  ClaimMdEffectiveStatus,
  ClaimMdSubmissionStatus,
  ClaimMdTransmissionStatus,
} from "@/lib/types/claim-md.types"

/**
 * Todo lo que la UI muestra y ofrece sobre Claim.MD se decide aquí, a partir del
 * estado único del contrato 2026-08-28 (`claimMdEffectiveStatus` en el BatchClaim,
 * `effectiveStatus` en cada claim).
 *
 * Módulo puro a propósito: sin React y sin fetch. Ningún componente decide por su
 * cuenta qué acción ofrecer. Si estas reglas se reparten por el JSX se desincronizan
 * en el primer cambio, y una de ellas duplica claims facturados si se rompe
 * (ver `canRetry`).
 */

export type StatusTone = "neutral" | "info" | "success" | "warning" | "danger"

export interface ClaimMdBatchDecision {
  /** Texto corto del badge. */
  label: string
  tone: StatusTone
  /** Frase para el usuario, explica el estado sin jerga. */
  description: string
  /** El ciclo de subida sigue abierto: hay que refrescar solo. */
  shouldPoll: boolean
  /** El batch nunca se envió. */
  canSubmit: boolean
  /**
   * SÓLO con `UPLOAD_FAILED`. Un claim rechazado (`REJECTED`) NO habilita retry:
   * significa que Claim.MD sí respondió, y reenviar duplicaría el claim en el
   * clearing house.
   */
  canRetry: boolean
  /** `VERIFY_REQUIRED`: hay que consultar el uploadlist antes de permitir nada más. */
  canResolveUnknown: boolean
  /** Claim.MD ya respondió: tiene sentido mostrar el detalle por claim. */
  showsClaimLevelDetail: boolean
  /** Existe una transmisión, así que el batch ya no se puede editar. */
  isLocked: boolean
}

const NOT_SUBMITTED: ClaimMdBatchDecision = {
  label: "Not submitted",
  tone: "neutral",
  description: "This batch has not been sent to Claim.MD yet.",
  shouldPoll: false,
  canSubmit: true,
  canRetry: false,
  canResolveUnknown: false,
  showsClaimLevelDetail: false,
  isLocked: false,
}

/** Base de un estado ya resuelto: sin acciones, con detalle por claim y bloqueado. */
function settled(
  label: string,
  tone: StatusTone,
  description: string,
): ClaimMdBatchDecision {
  return {
    label,
    tone,
    description,
    shouldPoll: false,
    canSubmit: false,
    canRetry: false,
    canResolveUnknown: false,
    showsClaimLevelDetail: true,
    isLocked: true,
  }
}

const BY_STATUS: Record<ClaimMdEffectiveStatus, ClaimMdBatchDecision> = {
  NOT_SUBMITTED,
  PREPARING: {
    label: "Preparing",
    tone: "info",
    description: "The submission is being prepared.",
    shouldPoll: true,
    canSubmit: false,
    canRetry: false,
    canResolveUnknown: false,
    showsClaimLevelDetail: false,
    isLocked: true,
  },
  PROCESSING: {
    label: "Processing",
    tone: "info",
    description: "The 837P file is being uploaded to Claim.MD.",
    shouldPoll: true,
    canSubmit: false,
    canRetry: false,
    canResolveUnknown: false,
    showsClaimLevelDetail: false,
    isLocked: true,
  },
  UPLOAD_FAILED: {
    label: "Upload failed",
    tone: "danger",
    description: "The file did not reach Claim.MD. You can retry the upload safely.",
    shouldPoll: false,
    canSubmit: false,
    canRetry: true,
    canResolveUnknown: false,
    showsClaimLevelDetail: false,
    isLocked: true,
  },
  VERIFY_REQUIRED: {
    label: "Verification required",
    tone: "warning",
    description:
      "The upload could not be confirmed. Verify in Claim.MD before doing anything else — resending now could duplicate the claims.",
    shouldPoll: false,
    canSubmit: false,
    canRetry: false,
    canResolveUnknown: true,
    showsClaimLevelDetail: false,
    isLocked: true,
  },
  RECEIVED: settled(
    "Received",
    "success",
    "Claim.MD received the file. Check the status of each claim below.",
  ),
  ACKNOWLEDGED: settled(
    "Acknowledged",
    "info",
    "Claim.MD acknowledged the claims. Final acceptance may still be pending.",
  ),
  ACCEPTED: settled(
    "Accepted",
    "success",
    "Claim.MD accepted the claims. Waiting for the payer to adjudicate.",
  ),
  PARTIAL: settled(
    "Partial",
    "warning",
    "Claim.MD accepted some claims and rejected others. Review each claim below.",
  ),
  REJECTED: settled(
    "Rejected",
    "danger",
    "Claim.MD rejected the claims. Read the response messages, fix the data and create a corrected batch.",
  ),
  DENIED: settled("Denied", "danger", "The payer denied this claim."),
  PARTIALLY_PAID: settled(
    "Partially paid",
    "warning",
    "The payer paid this claim partially.",
  ),
  PAID: settled("Paid", "success", "The payer paid this claim."),
}

export function getBatchDecision(
  status: ClaimMdEffectiveStatus | null | undefined,
): ClaimMdBatchDecision {
  if (!status) return NOT_SUBMITTED
  return BY_STATUS[status] ?? NOT_SUBMITTED
}

export interface StatusBadge {
  label: string
  tone: StatusTone
}

/** Badge de un claim individual. Comparte la tabla del BatchClaim salvo `PARTIAL`. */
export function getEffectiveBadge(
  status: ClaimMdEffectiveStatus | null | undefined,
): StatusBadge | null {
  if (!status) return null
  const decision = BY_STATUS[status]
  return decision ? { label: decision.label, tone: decision.tone } : null
}

// ── Compatibilidad con el contrato anterior ───────────────────────────────────

/**
 * Deriva el estado único a partir de los tres estados del contrato anterior.
 *
 * Existe sólo mientras la API no despliegue `effectiveStatus`: hoy dev sigue
 * devolviendo `transmissionStatus` / `submissionStatus` / `adjudicationStatus`, y
 * migrar en frío dejaría todas las pantallas en "Not submitted". En cuanto la API
 * mande el campo nuevo, esta función y los tipos que consume se borran.
 */
export function deriveEffectiveStatus(legacy: {
  transmission: ClaimMdTransmissionStatus | null | undefined
  submission?: ClaimMdSubmissionStatus | null
  adjudication?: ClaimMdAdjudicationStatus | null
}): ClaimMdEffectiveStatus | null {
  const { transmission, submission, adjudication } = legacy

  if (!transmission) return submission || adjudication ? null : "NOT_SUBMITTED"

  switch (transmission) {
    case "CREATED":
      return "PREPARING"
    case "UPLOADING":
      return "PROCESSING"
    case "FAILED":
      return "UPLOAD_FAILED"
    case "UNKNOWN":
      return "VERIFY_REQUIRED"
    default:
      break
  }

  // Transmisión resuelta: manda el resultado del pagador si ya llegó.
  if (adjudication === "PAID") return "PAID"
  if (adjudication === "PARTIAL") return "PARTIALLY_PAID"
  if (adjudication === "DENIED") return "DENIED"

  if (transmission === "REJECTED") return "REJECTED"
  if (transmission === "PARTIAL") return "PARTIAL"

  if (submission === "REJECTED") return "REJECTED"
  if (submission === "ACCEPTED") return "ACCEPTED"
  if (submission === "ACKNOWLEDGED") return "ACKNOWLEDGED"

  return "RECEIVED"
}

/** Clases del badge por tono, para no repetir el mapa en cada componente. */
export const TONE_CLASSES: Record<StatusTone, string> = {
  neutral: "border-slate-200 bg-slate-100 text-slate-600",
  info: "border-blue-200 bg-blue-50 text-[#037ECC]",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-red-200 bg-red-50 text-red-700",
}
