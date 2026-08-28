// ============================================
// CLAIM.MD TYPES
// Envío del 837P de un BatchClaim al clearing house (contrato 2026-08-28)
// ============================================

/** Estado del archivo 837P completo subido a Claim.MD. Gobierna las acciones de la UI. */
export type ClaimMdTransmissionStatus =
  | "CREATED"
  | "UPLOADING"
  | "RECEIVED"
  | "PARTIAL"
  | "REJECTED"
  | "UNKNOWN"
  | "FAILED"

/** Estado de cada claim individual dentro del 837P, una vez Claim.MD leyó el archivo. */
export type ClaimMdSubmissionStatus =
  | "CREATED"
  | "UPLOADING"
  | "ACKNOWLEDGED"
  | "ACCEPTED"
  | "REJECTED"
  | "UNKNOWN"

/** Resultado del pagador vía ERA/remesa. Llega horas o días después del envío. */
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
  submissionStatus: ClaimMdSubmissionStatus | null
  adjudicationStatus: ClaimMdAdjudicationStatus | null
  transmissionStatus: ClaimMdTransmissionStatus | null
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
  externalStatus: string | null
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
