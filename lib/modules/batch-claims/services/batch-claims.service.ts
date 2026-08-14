import { serviceGet, servicePost, servicePut } from "@/lib/services/baseService"
import { getApiErrorMessage } from "@/lib/utils/api-error-message"
import type {
  BatchClaim,
  BatchClaim837PFile,
  BatchClaimAppointmentDetail,
  BatchClaimClientGroup,
  BatchClaimPayload,
  BatchClaimSummary,
  EligibleServiceLog,
  EligibleServiceLogAppointment,
  EligibleServiceLogsQuery,
} from "@/lib/types/batch-claim.types"
import type { PaginatedResponse } from "@/lib/types/response.types"

function toNumberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

function parseSummary(e: Record<string, unknown>): BatchClaimSummary {
  return {
    id: String(e.id ?? ""),
    payerPlanId: String(e.payerPlanId ?? ""),
    payerPlanName: String(e.payerPlanName ?? ""),
    payerId: String(e.payerId ?? ""),
    payerName: String(e.payerName ?? ""),
    reference: String(e.reference ?? ""),
    comments: String(e.comments ?? ""),
    createAt: String(e.createAt ?? ""),
    active: e.active !== false,
  }
}

function parseAppointmentDetail(d: Record<string, unknown>): BatchClaimAppointmentDetail {
  return {
    appointmentId: String(d.appointmentId ?? ""),
    date: String(d.date ?? ""),
    placeOfService: String(d.placeOfService ?? ""),
    billingCode: String(d.billingCode ?? ""),
    primaryDiagnosis: String(d.primaryDiagnosis ?? ""),
    units: typeof d.units === "number" ? d.units : 0,
    rate: toNumberOrNull(d.rate),
    submitAmount: toNumberOrNull(d.submitAmount),
  }
}

function parseClientGroup(g: Record<string, unknown>): BatchClaimClientGroup {
  return {
    clientId: String(g.clientId ?? ""),
    clientName: String(g.clientName ?? ""),
    payerName: String(g.payerName ?? ""),
    priorAuthorizationNumber: String(g.priorAuthorizationNumber ?? ""),
    memberNumber: String(g.memberNumber ?? ""),
    appointmentDetails: Array.isArray(g.appointmentDetails)
      ? g.appointmentDetails.map((d: Record<string, unknown>) => parseAppointmentDetail(d))
      : [],
  }
}

/**
 * Fetch paginated batch claims.
 * GET /batch-claims
 */
export async function getBatchClaims(params?: {
  filters?: string[]
  orders?: string[]
  page?: number
  pageSize?: number
}): Promise<PaginatedResponse<BatchClaimSummary>> {
  const qs = new URLSearchParams()
  if (params?.filters?.length) {
    for (const f of params.filters) qs.append("filters", f)
  }
  if (params?.orders?.length) {
    for (const o of params.orders) qs.append("orders", o)
  }
  if (params?.page !== undefined) qs.set("page", String(params.page))
  if (params?.pageSize !== undefined) qs.set("pageSize", String(params.pageSize))
  const query = qs.toString()

  const response = await serviceGet<PaginatedResponse<BatchClaimSummary>>(
    `/batch-claims${query ? `?${query}` : ""}`,
  )

  if (response.status !== 200 || !response.data) {
    throw new Error(getApiErrorMessage(response?.data, "Failed to fetch batch claims"))
  }

  const raw = response.data as unknown as Record<string, unknown>
  const entities = (Array.isArray(raw.entities) ? raw.entities : []) as Record<string, unknown>[]
  const pagination = (raw.pagination ?? { page: 0, pageSize: 10, total: 0 }) as PaginatedResponse<BatchClaimSummary>["pagination"]

  return { entities: entities.map(parseSummary), pagination }
}

/**
 * Fetch a batch claim with its client groups and amounts.
 * GET /batch-claims/{batchClaimId}
 */
export async function getBatchClaimById(batchClaimId: string): Promise<BatchClaim | null> {
  const response = await serviceGet<unknown>(`/batch-claims/${encodeURIComponent(batchClaimId)}`)

  if (response.status !== 200) {
    throw new Error(getApiErrorMessage(response?.data, "Failed to fetch batch claim"))
  }
  if (!response.data) return null

  const raw = response.data as Record<string, unknown>
  const data = (raw.entity ?? raw.data ?? raw) as Record<string, unknown>
  if (!data || !data.id) return null

  return {
    ...parseSummary(data),
    serviceLogIds: Array.isArray(data.serviceLogIds) ? data.serviceLogIds.map(String) : [],
    appointments: Array.isArray(data.appointments)
      ? data.appointments.map((g: Record<string, unknown>) => parseClientGroup(g))
      : [],
  }
}

/** `"2026-08-01T00:00:00.000+00:00"` → `"2026-08-01"` */
function toDateOnly(value: unknown): string {
  return String(value ?? "").slice(0, 10)
}

function parseEligibleAppointment(a: Record<string, unknown>): EligibleServiceLogAppointment {
  return {
    appointmentId: String(a.appointmentId ?? a.id ?? ""),
    appointmentNoteId: String(a.appointmentNoteId ?? ""),
    date: String(a.date ?? ""),
    timeInit: String(a.timeInit ?? ""),
    timeEnd: String(a.timeEnd ?? ""),
    billingCodeId: String(a.billingCodeId ?? ""),
    priorAuthorizationId: String(a.priorAuthorizationId ?? ""),
    cantUnit: typeof a.cantUnit === "number" ? a.cantUnit : 0,
    units: typeof a.units === "number" ? a.units : 0,
  }
}

/**
 * Fetch service logs eligible for a batch. Each service log groups the billable
 * appointments (LOCK note + caregiver & provider signatures) of one client+provider period.
 * GET /batch-claims/service-logs
 */
export async function getEligibleServiceLogs(
  query: EligibleServiceLogsQuery,
): Promise<EligibleServiceLog[]> {
  const qs = new URLSearchParams({
    payerPlanId: query.payerPlanId,
    initDate: query.initDate,
    endDate: query.endDate,
  })
  if (query.clientId) qs.set("clientId", query.clientId)

  const response = await serviceGet<unknown>(`/batch-claims/service-logs?${qs.toString()}`)

  if (response.status !== 200) {
    throw new Error(getApiErrorMessage(response?.data, "Failed to fetch eligible service logs"))
  }

  const raw = response.data as unknown
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as Record<string, unknown>)?.entities)
      ? ((raw as Record<string, unknown>).entities as unknown[])
      : []

  return (list as Record<string, unknown>[]).map((sl) => ({
    id: String(sl.id ?? ""),
    clientId: String(sl.clientId ?? ""),
    clientName: String(sl.clientName ?? ""),
    providerId: String(sl.providerId ?? ""),
    providerName: String(sl.providerName ?? ""),
    initDate: toDateOnly(sl.initDate),
    endDate: toDateOnly(sl.endDate),
    appointments: Array.isArray(sl.appointments)
      ? sl.appointments.map((a: Record<string, unknown>) => parseEligibleAppointment(a))
      : [],
  }))
}

/**
 * Create a batch claim (header + appointment selection).
 * POST /batch-claims → returns the new batch id
 */
export async function createBatchClaim(payload: BatchClaimPayload): Promise<string> {
  const response = await servicePost<BatchClaimPayload, string>("/batch-claims", payload)

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(getApiErrorMessage(response?.data, "Failed to create batch claim"))
  }

  const data = response.data as unknown
  return typeof data === "string" ? data : String((data as Record<string, unknown>)?.entity ?? "")
}

/**
 * Replace a batch claim's header and appointment selection.
 * PUT /batch-claims/{batchClaimId} — serviceLogIds fully replaces the previous selection
 */
export async function updateBatchClaim(
  batchClaimId: string,
  payload: BatchClaimPayload,
): Promise<string> {
  const response = await servicePut<BatchClaimPayload, string>(
    `/batch-claims/${encodeURIComponent(batchClaimId)}`,
    payload,
  )

  if (response.status !== 200) {
    throw new Error(getApiErrorMessage(response?.data, "Failed to update batch claim"))
  }

  const data = response.data as unknown
  return typeof data === "string" ? data : batchClaimId
}

/**
 * Generate the X12 837P file for the batch. The backend builds the file but does
 * NOT upload it to the clearing house; the caller downloads it locally.
 * GET /batch-claims/{batchClaimId}/837p
 */
export async function getBatchClaim837P(batchClaimId: string): Promise<BatchClaim837PFile> {
  const response = await serviceGet<unknown>(
    `/batch-claims/${encodeURIComponent(batchClaimId)}/837p`,
  )

  if (response.status !== 200 || !response.data) {
    throw new Error(getApiErrorMessage(response?.data, "Failed to generate the 837P file"))
  }

  const raw = response.data as Record<string, unknown>
  const data = (raw.entity ?? raw.data ?? raw) as Record<string, unknown>
  const fileName = String(data.fileName ?? `837P_${batchClaimId}.dat`)
  const fileBase64 = String(data.fileBase64 ?? "")
  if (!fileBase64) {
    throw new Error("The 837P service returned an empty file")
  }
  return { fileName, fileBase64 }
}

const BATCH_CLAIM_PDF_NAME = "Batch Claim CMS-1500.pdf"

/**
 * Same-origin preview URL of the whole batch's CMS-1500 PDF (see lib/server/pdf-proxy.ts).
 */
export function getBatchClaimPdfPreviewUrl(batchClaimId: string): string {
  const safeName = encodeURIComponent(BATCH_CLAIM_PDF_NAME)
  return `/api/reports/batch-claim/preview/${safeName}?batchClaimId=${encodeURIComponent(batchClaimId)}`
}

/**
 * Same-origin preview URL of a single client's CMS-1500 PDF within the batch.
 */
export function getBatchClaimClientPdfPreviewUrl(
  batchClaimId: string,
  clientId: string,
  clientName?: string,
): string {
  const name = clientName ? `CMS-1500 ${clientName}.pdf` : BATCH_CLAIM_PDF_NAME
  const safeName = encodeURIComponent(name)
  const qs = new URLSearchParams({ batchClaimId, clientId })
  return `/api/reports/batch-claim-client/preview/${safeName}?${qs.toString()}`
}
