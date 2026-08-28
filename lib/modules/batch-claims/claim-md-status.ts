import type {
  ClaimMdAdjudicationStatus,
  ClaimMdSubmissionStatus,
  ClaimMdTransmissionStatus,
} from "@/lib/types/claim-md.types"

/**
 * Traducción de las tablas de decisión del contrato de Claim.MD (2026-08-28).
 *
 * Módulo puro a propósito: sin React y sin fetch. Ningún componente decide por su
 * cuenta qué acción ofrecer — todos preguntan aquí. Si estas reglas se reparten por
 * el JSX se desincronizan en el primer cambio, y una de ellas duplica claims
 * facturados si se rompe (ver `canRetry`).
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
   * SÓLO cuando la transmisión es FAILED. Un claim rechazado (`submissionStatus`
   * REJECTED) NO habilita retry: significa que Claim.MD sí respondió, y reenviar
   * duplicaría el claim en el clearing house.
   */
  canRetry: boolean
  /** UNKNOWN: hay que consultar el uploadlist antes de permitir nada más. */
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

const BY_STATUS: Record<ClaimMdTransmissionStatus, ClaimMdBatchDecision> = {
  CREATED: {
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
  UPLOADING: {
    label: "Uploading",
    tone: "info",
    description: "The 837P file is being uploaded to Claim.MD.",
    shouldPoll: true,
    canSubmit: false,
    canRetry: false,
    canResolveUnknown: false,
    showsClaimLevelDetail: false,
    isLocked: true,
  },
  RECEIVED: {
    label: "Received",
    tone: "success",
    description: "Claim.MD received the file. Check the status of each claim below.",
    shouldPoll: false,
    canSubmit: false,
    canRetry: false,
    canResolveUnknown: false,
    showsClaimLevelDetail: true,
    isLocked: true,
  },
  PARTIAL: {
    label: "Partial",
    tone: "warning",
    description: "Claim.MD accepted some claims and rejected others. Review each claim below.",
    shouldPoll: false,
    canSubmit: false,
    canRetry: false,
    canResolveUnknown: false,
    showsClaimLevelDetail: true,
    isLocked: true,
  },
  REJECTED: {
    label: "Rejected",
    tone: "danger",
    description:
      "Claim.MD rejected every claim in this file. Read the response messages, fix the data and create a corrected batch.",
    shouldPoll: false,
    canSubmit: false,
    canRetry: false,
    canResolveUnknown: false,
    showsClaimLevelDetail: true,
    isLocked: true,
  },
  UNKNOWN: {
    label: "Needs verification",
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
  FAILED: {
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
}

export function getBatchDecision(
  status: ClaimMdTransmissionStatus | null | undefined,
): ClaimMdBatchDecision {
  if (!status) return NOT_SUBMITTED
  return BY_STATUS[status] ?? NOT_SUBMITTED
}

export interface StatusBadge {
  label: string
  tone: StatusTone
}

const SUBMISSION_BADGES: Record<ClaimMdSubmissionStatus, StatusBadge> = {
  CREATED: { label: "Pending", tone: "neutral" },
  UPLOADING: { label: "Uploading", tone: "info" },
  ACKNOWLEDGED: { label: "Acknowledged", tone: "info" },
  ACCEPTED: { label: "Accepted", tone: "success" },
  REJECTED: { label: "Rejected", tone: "danger" },
  UNKNOWN: { label: "Unknown", tone: "warning" },
}

export function getSubmissionBadge(
  status: ClaimMdSubmissionStatus | null | undefined,
): StatusBadge | null {
  if (!status) return null
  return SUBMISSION_BADGES[status] ?? null
}

const ADJUDICATION_BADGES: Record<ClaimMdAdjudicationStatus, StatusBadge> = {
  NOT_ADJUDICATED: { label: "Awaiting payment", tone: "neutral" },
  PAID: { label: "Paid", tone: "success" },
  PARTIAL: { label: "Partially paid", tone: "warning" },
  DENIED: { label: "Denied", tone: "danger" },
}

export function getAdjudicationBadge(
  status: ClaimMdAdjudicationStatus | null | undefined,
): StatusBadge | null {
  if (!status) return null
  return ADJUDICATION_BADGES[status] ?? null
}

/**
 * Fila de la tabla combinada del contrato. Una vez la transmisión deja de estar en
 * curso, la adjudicación es lo que mejor describe dónde está el dinero, así que gana
 * al estado de claim cuando ya hay remesa.
 */
export function describeCombined(
  transmission: ClaimMdTransmissionStatus | null | undefined,
  submission: ClaimMdSubmissionStatus | null | undefined,
  adjudication: ClaimMdAdjudicationStatus | null | undefined,
): string {
  if (!transmission) return NOT_SUBMITTED.description

  if (transmission === "CREATED" || transmission === "UPLOADING") {
    return BY_STATUS[transmission].description
  }

  if (transmission === "UNKNOWN" || transmission === "FAILED") {
    return BY_STATUS[transmission].description
  }

  // Transmisión resuelta: manda la adjudicación si ya llegó.
  if (adjudication === "PAID") return "The payer paid this claim."
  if (adjudication === "PARTIAL") return "The payer paid this claim partially."
  if (adjudication === "DENIED") return "The payer denied this claim."

  if (submission === "REJECTED") {
    return "Claim.MD rejected at least one claim. Read the response messages to fix the data."
  }
  if (submission === "ACCEPTED") {
    return "Claim.MD accepted the claims. Waiting for the payer to adjudicate."
  }
  if (submission === "ACKNOWLEDGED") {
    return "Claim.MD acknowledged the claims. Final acceptance may still be pending."
  }

  return BY_STATUS[transmission].description
}

/** Clases del badge por tono, para no repetir el mapa en cada componente. */
export const TONE_CLASSES: Record<StatusTone, string> = {
  neutral: "border-slate-200 bg-slate-100 text-slate-600",
  info: "border-blue-200 bg-blue-50 text-[#037ECC]",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-red-200 bg-red-50 text-red-700",
}
