// ============================================
// CLAIM.MD TYPES
// Envío del 837P de un BatchClaim al clearing house (contrato 2026-08-28)
// ============================================

/**
 * Estado único del contrato 2026-08-28. Es el que gobierna todo lo que muestra y
 * ofrece la UI, tanto a nivel de BatchClaim (`claimMdEffectiveStatus`) como de claim
 * individual (`effectiveStatus`).
 *
 * `PARTIAL` sólo aplica al BatchClaim: un claim individual nunca es parcial.
 */
export type ClaimMdEffectiveStatus =
  | "NOT_SUBMITTED"
  | "PREPARING"
  | "PROCESSING"
  | "UPLOAD_FAILED"
  | "VERIFY_REQUIRED"
  | "RECEIVED"
  | "ACKNOWLEDGED"
  | "ACCEPTED"
  | "REJECTED"
  | "PARTIAL"
  | "DENIED"
  | "PARTIALLY_PAID"
  | "PAID"

export const CLAIM_MD_EFFECTIVE_STATUSES: readonly ClaimMdEffectiveStatus[] = [
  "NOT_SUBMITTED",
  "PREPARING",
  "PROCESSING",
  "UPLOAD_FAILED",
  "VERIFY_REQUIRED",
  "RECEIVED",
  "ACKNOWLEDGED",
  "ACCEPTED",
  "REJECTED",
  "PARTIAL",
  "DENIED",
  "PARTIALLY_PAID",
  "PAID",
]

// ── Contrato anterior ─────────────────────────────────────────────────────────
// Retirado del contrato público el 2026-08-28, pero todavía es lo que devuelve dev.
// Se sigue parseando para derivar el estado único mientras la API no despliegue el
// cambio; en cuanto dev y producción manden `effectiveStatus`, todo esto se borra.

/** @deprecated Estado del archivo 837P. Sustituido por `ClaimMdEffectiveStatus`. */
export type ClaimMdTransmissionStatus =
  | "CREATED"
  | "UPLOADING"
  | "RECEIVED"
  | "PARTIAL"
  | "REJECTED"
  | "UNKNOWN"
  | "FAILED"

/** @deprecated Estado por claim. Sustituido por `ClaimMdEffectiveStatus`. */
export type ClaimMdSubmissionStatus =
  | "CREATED"
  | "UPLOADING"
  | "ACKNOWLEDGED"
  | "ACCEPTED"
  | "REJECTED"
  | "UNKNOWN"

/** @deprecated Resultado del pagador. Sustituido por `ClaimMdEffectiveStatus`. */
export type ClaimMdAdjudicationStatus = "NOT_ADJUDICATED" | "PAID" | "PARTIAL" | "DENIED"

export const CLAIM_MD_TRANSMISSION_STATUSES: readonly ClaimMdTransmissionStatus[] = [
  "CREATED",
  "UPLOADING",
  "RECEIVED",
  "PARTIAL",
  "REJECTED",
  "UNKNOWN",
  "FAILED",
]

export const CLAIM_MD_SUBMISSION_STATUSES: readonly ClaimMdSubmissionStatus[] = [
  "CREATED",
  "UPLOADING",
  "ACKNOWLEDGED",
  "ACCEPTED",
  "REJECTED",
  "UNKNOWN",
]

export const CLAIM_MD_ADJUDICATION_STATUSES: readonly ClaimMdAdjudicationStatus[] = [
  "NOT_ADJUDICATED",
  "PAID",
  "PARTIAL",
  "DENIED",
]

/** Respuesta de `POST /batch-claims/{batchClaimId}/submissions` */
export interface ClaimMdSubmitResult {
  transmissionId: string
  /** Los POST de submit/retry no entran en el cambio de contrato de los GET. */
  status: ClaimMdTransmissionStatus | null
  fileName: string
  externalFileId: string | null
  claimCount: number
}

/** Respuesta de `POST /batch-claims/{batchClaimId}/submissions/retry` */
export interface ClaimMdRetryResult {
  transmissionId: string
  transmissionStatus: ClaimMdTransmissionStatus | null
  attemptCount: number
  externalFileId: string | null
  submissionCount: number
}

/** Fila de `GET /batch-claims/{batchClaimId}/submissions` */
export interface ClaimMdSubmissionSummary {
  submissionId: string
  transmissionId: string
  batchClaimServiceLogId: string
  /** Estado único del claim. Derivado del contrato anterior mientras la API no lo mande. */
  effectiveStatus: ClaimMdEffectiveStatus | null
  fileName: string
  remoteClaimId: string | null
  patientControlNumber: string | null
  claimMdClaimId: string | null
  claimMdFileId: string | null
  totalCharge: number | null
  submittedAt: string | null
  lastResponseAt: string | null
}

export interface ClaimMdSubmissionLine {
  id: string
  appointmentId: string
  lineNumber: number
  remoteChargeId: string | null
  serviceDate: string
  procedureCode: string
  modifiers: string
  placeOfService: string
  units: number | null
  chargeAmount: number | null
  renderingProviderNpiSnapshot: string | null
  renderingProviderTaxonomySnapshot: string | null
}

/** Mensaje devuelto por Claim.MD para un claim. Es lo que el usuario lee para corregir un rechazo. */
export interface ClaimMdSubmissionResponse {
  id: string
  externalResponseId: string | null
  messageId: string | null
  message: string
  responseAt: string | null
}

/**
 * `GET /claim-submissions/{submissionId}` y
 * `GET /batch-claims/{batchClaimId}/service-logs/{batchClaimServiceLogId}/submission`
 */
export interface ClaimMdSubmissionDetail extends ClaimMdSubmissionSummary {
  batchClaimId: string
  payloadChecksum: string | null
  payerExternalIdSnapshot: string | null
  billingNpiSnapshot: string | null
  billingTaxIdSnapshot: string | null
  lines: ClaimMdSubmissionLine[]
  responses: ClaimMdSubmissionResponse[]
}

/** Respuesta de los dos `POST .../resolve-unknown`. No reenvía nada: solo consulta el uploadlist. */
export interface ClaimMdResolveUnknownResult {
  transmissionId: string
  transmissionStatus: ClaimMdTransmissionStatus | null
  foundInUploadList: boolean
  message: string
}
