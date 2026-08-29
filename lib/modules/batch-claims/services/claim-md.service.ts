import { serviceGetSilent, servicePostSilent } from "@/lib/services/baseService"
import { getApiErrorMessage } from "@/lib/utils/api-error-message"
import { deriveEffectiveStatus } from "../claim-md-status"
import {
  CLAIM_MD_ADJUDICATION_STATUSES,
  CLAIM_MD_EFFECTIVE_STATUSES,
  CLAIM_MD_SUBMISSION_STATUSES,
  CLAIM_MD_TRANSMISSION_STATUSES,
  type ClaimMdAdjudicationStatus,
  type ClaimMdEffectiveStatus,
  type ClaimMdResolveUnknownResult,
  type ClaimMdRetryResult,
  type ClaimMdSubmissionDetail,
  type ClaimMdSubmissionLine,
  type ClaimMdSubmissionResponse,
  type ClaimMdSubmissionStatus,
  type ClaimMdSubmissionSummary,
  type ClaimMdSubmitResult,
  type ClaimMdTransmissionStatus,
} from "@/lib/types/claim-md.types"

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * El OpenAPI de dev declara sólo `200` para los POST de submit y retry, mientras que
 * la documentación del flujo dice `202 Accepted`. Se aceptan ambos: comparar contra
 * uno solo rompería la pantalla el día que el backend normalice el otro.
 */
function isOk(status: number | undefined): boolean {
  return status === 200 || status === 201 || status === 202
}

/**
 * Los errores de este flujo traen la instrucción accionable en `details`
 * ("Retry must use the Batch Claim retry flow to avoid duplicate claims"), y
 * `getApiErrorMessage` lo descarta cuando `message` no es genérico. Aquí se conservan
 * los dos, porque sin el `details` el usuario no sabe qué hacer.
 */
function toError(data: unknown, fallback: string): Error {
  const base = getApiErrorMessage(data, fallback)
  const details =
    data && typeof data === "object"
      ? (data as { details?: unknown }).details
      : undefined
  const detailText = typeof details === "string" ? details.trim() : ""

  if (detailText.length > 0 && !base.includes(detailText)) {
    return new Error(`${base} ${detailText}`)
  }
  return new Error(base)
}

function unwrap(payload: unknown): Record<string, unknown> | null {
  if (!payload || typeof payload !== "object") return null
  const raw = payload as Record<string, unknown>
  const inner = (raw.entity ?? raw.data ?? raw) as unknown
  return inner && typeof inner === "object" ? (inner as Record<string, unknown>) : null
}

function unwrapList(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload as Record<string, unknown>[]
  if (!payload || typeof payload !== "object") return []
  const raw = payload as Record<string, unknown>
  for (const key of ["entities", "data", "entity"]) {
    const value = raw[key]
    if (Array.isArray(value)) return value as Record<string, unknown>[]
  }
  return []
}

function str(value: unknown): string {
  return typeof value === "string" ? value : value == null ? "" : String(value)
}

function strOrNull(value: unknown): string | null {
  const text = str(value).trim()
  return text.length > 0 ? text : null
}

function numOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

/**
 * Un estado desconocido cae a `null` en vez de romper la pantalla: los schemas del
 * backend son `type: object`, así que no hay garantía de contrato.
 */
function asStatus<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  const text = str(value).trim().toUpperCase()
  return (allowed as readonly string[]).includes(text) ? (text as T) : null
}

const asTransmissionStatus = (v: unknown) =>
  asStatus<ClaimMdTransmissionStatus>(v, CLAIM_MD_TRANSMISSION_STATUSES)
const asSubmissionStatus = (v: unknown) =>
  asStatus<ClaimMdSubmissionStatus>(v, CLAIM_MD_SUBMISSION_STATUSES)
const asAdjudicationStatus = (v: unknown) =>
  asStatus<ClaimMdAdjudicationStatus>(v, CLAIM_MD_ADJUDICATION_STATUSES)
const asEffectiveStatus = (v: unknown) =>
  asStatus<ClaimMdEffectiveStatus>(v, CLAIM_MD_EFFECTIVE_STATUSES)

/**
 * El estado único del contrato nuevo, cayendo a derivarlo de los tres estados del
 * contrato anterior mientras la API no lo despliegue.
 */
function readEffectiveStatus(
  e: Record<string, unknown>,
  keys: { effective: string; transmission: string; submission?: string; adjudication?: string },
): ClaimMdEffectiveStatus | null {
  const direct = asEffectiveStatus(e[keys.effective])
  if (direct) return direct

  return deriveEffectiveStatus({
    transmission: asTransmissionStatus(e[keys.transmission]),
    submission: keys.submission ? asSubmissionStatus(e[keys.submission]) : null,
    adjudication: keys.adjudication ? asAdjudicationStatus(e[keys.adjudication]) : null,
  })
}

export { asTransmissionStatus, asSubmissionStatus, asAdjudicationStatus, readEffectiveStatus }

// ── Parsers ───────────────────────────────────────────────────────────────────

function parseSubmissionSummary(e: Record<string, unknown>): ClaimMdSubmissionSummary {
  return {
    submissionId: str(e.submissionId ?? e.id),
    transmissionId: str(e.transmissionId),
    batchClaimServiceLogId: str(e.batchClaimServiceLogId),
    effectiveStatus: readEffectiveStatus(e, {
      effective: "effectiveStatus",
      transmission: "transmissionStatus",
      submission: "submissionStatus",
      adjudication: "adjudicationStatus",
    }),
    fileName: str(e.fileName),
    remoteClaimId: strOrNull(e.remoteClaimId),
    patientControlNumber: strOrNull(e.patientControlNumber),
    claimMdClaimId: strOrNull(e.claimMdClaimId),
    claimMdFileId: strOrNull(e.claimMdFileId),
    totalCharge: numOrNull(e.totalCharge),
    submittedAt: strOrNull(e.submittedAt),
    lastResponseAt: strOrNull(e.lastResponseAt),
  }
}

function parseLine(e: Record<string, unknown>): ClaimMdSubmissionLine {
  return {
    id: str(e.id),
    appointmentId: str(e.appointmentId),
    lineNumber: numOrNull(e.lineNumber) ?? 0,
    remoteChargeId: strOrNull(e.remoteChargeId),
    serviceDate: str(e.serviceDate).slice(0, 10),
    procedureCode: str(e.procedureCode),
    modifiers: str(e.modifiers),
    placeOfService: str(e.placeOfService),
    units: numOrNull(e.units),
    chargeAmount: numOrNull(e.chargeAmount),
    renderingProviderNpiSnapshot: strOrNull(e.renderingProviderNpiSnapshot),
    renderingProviderTaxonomySnapshot: strOrNull(e.renderingProviderTaxonomySnapshot),
  }
}

function parseResponse(e: Record<string, unknown>): ClaimMdSubmissionResponse {
  return {
    id: str(e.id),
    externalResponseId: strOrNull(e.externalResponseId),
    messageId: strOrNull(e.messageId),
    message: str(e.message),
    responseAt: strOrNull(e.responseAt),
  }
}

function parseSubmissionDetail(e: Record<string, unknown>): ClaimMdSubmissionDetail {
  return {
    ...parseSubmissionSummary(e),
    batchClaimId: str(e.batchClaimId),
    payloadChecksum: strOrNull(e.payloadChecksum),
    payerExternalIdSnapshot: strOrNull(e.payerExternalIdSnapshot),
    billingNpiSnapshot: strOrNull(e.billingNpiSnapshot),
    billingTaxIdSnapshot: strOrNull(e.billingTaxIdSnapshot),
    lines: Array.isArray(e.lines)
      ? (e.lines as Record<string, unknown>[]).map(parseLine)
      : [],
    responses: Array.isArray(e.responses)
      ? (e.responses as Record<string, unknown>[]).map(parseResponse)
      : [],
  }
}

function parseResolveResult(e: Record<string, unknown>): ClaimMdResolveUnknownResult {
  return {
    transmissionId: str(e.transmissionId),
    transmissionStatus: asTransmissionStatus(e.transmissionStatus),
    foundInUploadList: e.foundInUploadList === true,
    message: str(e.message),
  }
}

// ── Endpoints ─────────────────────────────────────────────────────────────────

const batchPath = (batchClaimId: string) => `/batch-claims/${encodeURIComponent(batchClaimId)}`

/**
 * Genera el 837P del BatchClaim completo, lo guarda y encola la subida a Claim.MD.
 * No espera a que la subida termine.
 *
 * No es idempotente: un segundo submit sobre el mismo batch responde error indicando
 * que hay que usar el flujo de retry.
 *
 * `POST /batch-claims/{batchClaimId}/submissions`
 */
export async function submitBatchClaim(batchClaimId: string): Promise<ClaimMdSubmitResult> {
  const response = await servicePostSilent<undefined, unknown>(
    `${batchPath(batchClaimId)}/submissions`,
    undefined,
  )

  if (!isOk(response?.status)) {
    throw toError(response?.data, "Failed to submit the batch claim to Claim.MD")
  }

  const data = unwrap(response.data) ?? {}
  return {
    transmissionId: str(data.transmissionId),
    status: asTransmissionStatus(data.status ?? data.transmissionStatus),
    fileName: str(data.fileName),
    externalFileId: strOrNull(data.externalFileId),
    claimCount: numOrNull(data.claimCount) ?? 0,
  }
}

/**
 * Reencola la subida del 837P ya almacenado. No regenera el archivo ni cambia
 * `remoteClaimId`/`remoteChargeId`. Sólo se admite sobre una transmisión `FAILED`.
 *
 * `POST /batch-claims/{batchClaimId}/submissions/retry`
 */
export async function retryBatchClaimSubmission(batchClaimId: string): Promise<ClaimMdRetryResult> {
  const response = await servicePostSilent<undefined, unknown>(
    `${batchPath(batchClaimId)}/submissions/retry`,
    undefined,
  )

  if (!isOk(response?.status)) {
    throw toError(response?.data, "Failed to retry the Claim.MD upload")
  }

  const data = unwrap(response.data) ?? {}
  return {
    transmissionId: str(data.transmissionId),
    transmissionStatus: asTransmissionStatus(data.transmissionStatus ?? data.status),
    attemptCount: numOrNull(data.attemptCount) ?? 0,
    externalFileId: strOrNull(data.externalFileId),
    submissionCount: numOrNull(data.submissionCount) ?? 0,
  }
}

/** `GET /batch-claims/{batchClaimId}/submissions` */
export async function getBatchClaimSubmissions(
  batchClaimId: string,
): Promise<ClaimMdSubmissionSummary[]> {
  const response = await serviceGetSilent<unknown>(`${batchPath(batchClaimId)}/submissions`)

  if (response?.status === 404) return []
  if (response?.status !== 200) {
    throw toError(response?.data, "Failed to fetch the Claim.MD submissions")
  }

  return unwrapList(response.data).map(parseSubmissionSummary)
}

/** `GET /batch-claims/{batchClaimId}/service-logs/{batchClaimServiceLogId}/submission` */
export async function getSubmissionByServiceLog(
  batchClaimId: string,
  batchClaimServiceLogId: string,
): Promise<ClaimMdSubmissionDetail | null> {
  const response = await serviceGetSilent<unknown>(
    `${batchPath(batchClaimId)}/service-logs/${encodeURIComponent(batchClaimServiceLogId)}/submission`,
  )

  if (response?.status === 404) return null
  if (response?.status !== 200) {
    throw toError(response?.data, "Failed to fetch the Claim.MD submission")
  }

  const data = unwrap(response.data)
  return data && str(data.submissionId ?? data.id) ? parseSubmissionDetail(data) : null
}

/** `GET /claim-submissions/{submissionId}` */
export async function getSubmissionById(
  submissionId: string,
): Promise<ClaimMdSubmissionDetail | null> {
  const response = await serviceGetSilent<unknown>(
    `/claim-submissions/${encodeURIComponent(submissionId)}`,
  )

  if (response?.status === 404) return null
  if (response?.status !== 200) {
    throw toError(response?.data, "Failed to fetch the Claim.MD submission")
  }

  const data = unwrap(response.data)
  return data && str(data.submissionId ?? data.id) ? parseSubmissionDetail(data) : null
}

/**
 * Consulta el `uploadlist` de Claim.MD para una transmisión UNKNOWN. No reenvía el
 * 837P: sólo determina si Claim.MD llegó a recibirlo, para decidir si el retry es seguro.
 *
 * `POST /batch-claims/{batchClaimId}/service-logs/{batchClaimServiceLogId}/submission/resolve-unknown`
 */
export async function resolveUnknownByServiceLog(
  batchClaimId: string,
  batchClaimServiceLogId: string,
): Promise<ClaimMdResolveUnknownResult> {
  const response = await servicePostSilent<undefined, unknown>(
    `${batchPath(batchClaimId)}/service-logs/${encodeURIComponent(batchClaimServiceLogId)}/submission/resolve-unknown`,
    undefined,
  )

  if (!isOk(response?.status)) {
    throw toError(response?.data, "Failed to verify the upload in Claim.MD")
  }

  return parseResolveResult(unwrap(response.data) ?? {})
}

/**
 * Variante por `submissionId`, para cuando la UI no tiene el `batchClaimServiceLogId`.
 *
 * `POST /claim-submissions/{submissionId}/resolve-unknown`
 */
export async function resolveUnknownBySubmissionId(
  submissionId: string,
): Promise<ClaimMdResolveUnknownResult> {
  const response = await servicePostSilent<undefined, unknown>(
    `/claim-submissions/${encodeURIComponent(submissionId)}/resolve-unknown`,
    undefined,
  )

  if (!isOk(response?.status)) {
    throw toError(response?.data, "Failed to verify the upload in Claim.MD")
  }

  return parseResolveResult(unwrap(response.data) ?? {})
}
