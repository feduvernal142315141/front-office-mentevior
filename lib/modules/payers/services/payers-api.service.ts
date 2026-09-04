import type { QueryModel } from "@/lib/models/queryModel"
import {
  serviceGet,
  serviceGetSilent,
  servicePost,
  servicePostSilent,
  servicePut,
  serviceDelete,
} from "@/lib/services/baseService"
import { getQueryString } from "@/lib/utils/format"
import { getApiErrorMessage } from "@/lib/utils/api-error-message"
import qsLib from "qs"
import type { PlanTypeCatalogItem } from "@/lib/types/plan-type.types"
import {
  CLAIM_MD_ENROLLMENT_PROCESSING_STATUSES,
  CLAIM_MD_ENROLLMENT_STATUSES,
  type ClaimMdEnrollment,
  type ClaimMdEnrollmentProcessingStatus,
  type ClaimMdEnrollmentStartResult,
  type ClaimMdEnrollmentStatus,
  type ClaimMdEnrollType,
  type CreatePayerDto,
  type ListPayersQueryDto,
  type PayerClearingHouseItem,
  type Payer,
  type PayerCatalogItem,
  type PayerCatalogSearchItem,
  type SearchPayerCatalogQuery,
  type UpdatePayerDto,
} from "@/lib/types/payer.types"
import type { PaginatedResponse } from "@/lib/types/response.types"
import type {
  PayerCatalogSearchResult,
  PayersListResult,
  PayersServiceContract,
} from "../types/payers-service.types"

/** Mensaje del backend cuando el clearing house no ofrece catálogo de payers. */
const CATALOG_UNSUPPORTED = /does not have a payer catalog provider/i

// ── Enrollments de Claim.MD ───────────────────────────────────────────────────

const enrollStr = (v: unknown): string => (typeof v === "string" ? v : v == null ? "" : String(v))

const enrollStrOrNull = (v: unknown): string | null => {
  const text = enrollStr(v).trim()
  return text.length > 0 ? text : null
}

/** Un valor desconocido cae a `null` en vez de romper la pantalla. */
function asEnrollmentEnum<T extends string>(v: unknown, allowed: readonly T[]): T | null {
  const text = enrollStr(v).trim().toUpperCase()
  return (allowed as readonly string[]).includes(text) ? (text as T) : null
}

const asEnrollmentStatus = (v: unknown) =>
  asEnrollmentEnum<ClaimMdEnrollmentStatus>(v, CLAIM_MD_ENROLLMENT_STATUSES)

const asEnrollmentProcessingStatus = (v: unknown) =>
  asEnrollmentEnum<ClaimMdEnrollmentProcessingStatus>(v, CLAIM_MD_ENROLLMENT_PROCESSING_STATUSES)

function parseClaimMdEnrollment(e: Record<string, unknown>): ClaimMdEnrollment {
  return {
    id: enrollStr(e.id),
    payerExternalId: enrollStr(e.payerExternalId),
    enrollId: enrollStrOrNull(e.enrollId),
    enrollType: enrollStr(e.enrollType),
    status: asEnrollmentStatus(e.status),
    externalStatus: enrollStrOrNull(e.externalStatus),
    processingStatus: asEnrollmentProcessingStatus(e.processingStatus),
    providerNpi: enrollStrOrNull(e.providerNpi),
    providerId: enrollStrOrNull(e.providerId),
    eventDetail: enrollStrOrNull(e.eventDetail),
    requestedAt: enrollStrOrNull(e.requestedAt),
    lastEventAt: enrollStrOrNull(e.lastEventAt),
    completedAt: enrollStrOrNull(e.completedAt),
    rejectedAt: enrollStrOrNull(e.rejectedAt),
  }
}

export class ApiPayersService implements PayersServiceContract {
  private normalizePayer(raw: Payer): Payer {
    const payerPlans = raw.payerPlans?.length
      ? raw.payerPlans
      : raw.payerPlan
        ? [{ ...raw.payerPlan, payerRates: raw.payerRates ?? [] }]
        : []

    return {
      ...raw,
      payerPlans,
      claimMdEnrollments: Array.isArray(raw.claimMdEnrollments)
        ? raw.claimMdEnrollments.map((entry) =>
            parseClaimMdEnrollment(entry as unknown as Record<string, unknown>),
          )
        : [],
    }
  }

  /**
   * Inicia el alta del provider en Claim.MD para este payer. Sin body: el backend toma
   * el `payerid` del payer y el NPI/EIN de la Company autenticada.
   *
   * - `1500` → `POST .../claim-md-enrollments` (professional claims, default)
   * - `era`  → `POST .../claim-md-enrollments/era` (Electronic Remittance Advice)
   *
   * Devuelve una URL de un solo uso que hay que enseñarle al usuario; no vuelve a
   * aparecer en `GET /payers/{id}`.
   */
  async startClaimMdEnrollment(
    payerId: string,
    enrollType: ClaimMdEnrollType = "1500",
  ): Promise<ClaimMdEnrollmentStartResult> {
    const path =
      enrollType === "era"
        ? `/payers/${encodeURIComponent(payerId)}/claim-md-enrollments/era`
        : `/payers/${encodeURIComponent(payerId)}/claim-md-enrollments`

    const response = await servicePostSilent<undefined, unknown>(path, undefined)

    const status = response?.status
    if (status !== 200 && status !== 201 && status !== 202) {
      throw new Error(
        getApiErrorMessage(
          response?.data,
          enrollType === "era"
            ? "Failed to start the Claim.MD ERA enrollment"
            : "Failed to start the Claim.MD enrollment",
        ),
      )
    }

    const raw = (response.data ?? {}) as Record<string, unknown>
    const data = ((raw.entity ?? raw.data ?? raw) ?? {}) as Record<string, unknown>

    return {
      id: enrollStr(data.id),
      payerId: enrollStr(data.payerId),
      payerExternalId: enrollStr(data.payerExternalId),
      enrollType: enrollStr(data.enrollType) || enrollType,
      status: asEnrollmentStatus(data.status),
      processingStatus: asEnrollmentProcessingStatus(data.processingStatus),
      providerNpi: enrollStrOrNull(data.providerNpi),
      enrollmentUrl: enrollStr(data.enrollmentUrl),
      requestedAt: enrollStrOrNull(data.requestedAt),
    }
  }

  async list(query: ListPayersQueryDto): Promise<PayersListResult> {
    const model: QueryModel = {
      page: query.page ?? 0,
      pageSize: query.pageSize ?? 10,
      filters: query.filters?.length ? query.filters : undefined,
    }
    const qs = getQueryString(model)
    const response = await serviceGet<PaginatedResponse<Payer>>(`/payers?${qs}`)

    if (response.status !== 200 || !response.data) {
      throw new Error(response.data?.message || "Failed to fetch payers")
    }

    const paginatedData = response.data as unknown as PaginatedResponse<Payer>
    const entities = Array.isArray(paginatedData.entities) ? paginatedData.entities : []
    const totalCount = paginatedData.pagination?.total ?? entities.length

    return { payers: entities.map((payer) => this.normalizePayer(payer)), totalCount }
  }

  async getById(id: string): Promise<Payer> {
    const response = await serviceGet<Payer>(`/payers/${id}`)

    if (response.status !== 200 || !response.data) {
      throw new Error(response.data?.message || "Failed to fetch payer")
    }

    return this.normalizePayer(response.data as unknown as Payer)
  }

  async create(data: CreatePayerDto): Promise<Payer> {
    const response = await servicePost<CreatePayerDto, Payer>("/payers", data)

    if (response.status !== 200 && response.status !== 201) {
      throw new Error(response.data?.message || "Failed to create payer")
    }

    return this.normalizePayer(response.data as unknown as Payer)
  }

  async delete(id: string): Promise<void> {
    const response = await serviceDelete<never, { message?: string }>(`/payers/${id}`)

    if (response.status !== 200 && response.status !== 201) {
      throw new Error(response.data?.message || "Failed to delete payer")
    }
  }

  async createFromPrivateInsurance(ids: string[]): Promise<void> {
    const response = await servicePost<{ ids: string[] }, { message?: string }>(
      "/payers/create-from-private-insurance",
      { ids }
    )

    if (response.status !== 200 && response.status !== 201) {
      throw new Error(response.data?.message || "Failed to create payers from catalog")
    }
  }

  async update(data: UpdatePayerDto): Promise<Payer> {
    const response = await servicePut<UpdatePayerDto, Payer>("/payers", data)

    if (response.status !== 200 && response.status !== 201) {
      throw new Error(response.data?.message || "Failed to update payer")
    }

    return this.normalizePayer(response.data as unknown as Payer)
  }

  async getPrivateInsurancesCatalog(): Promise<PayerCatalogItem[]> {
    const response = await serviceGet<PayerCatalogItem[]>("/private-insurance/catalog")

    if (response.status !== 200 || !response.data) {
      throw new Error(response.data?.message || "Failed to fetch private insurance catalog")
    }

    const data = response.data as unknown
    if (Array.isArray(data)) return data as PayerCatalogItem[]

    const paginated = data as { entities?: PayerCatalogItem[] }
    return Array.isArray(paginated.entities) ? paginated.entities : []
  }

  async getClearingHouseCatalog(): Promise<PayerClearingHouseItem[]> {
    const response = await serviceGet<PayerClearingHouseItem[]>("/clearing-house/catalog")

    if (response.status !== 200 || !response.data) {
      throw new Error(response.data?.message || "Failed to fetch clearing house catalog")
    }

    const data = response.data as unknown
    if (Array.isArray(data)) return data as PayerClearingHouseItem[]

    const paginated = data as { entities?: PayerClearingHouseItem[] }
    return Array.isArray(paginated.entities) ? paginated.entities : []
  }

  async searchPayerCatalog(
    clearingHouseId: string,
    query: SearchPayerCatalogQuery,
  ): Promise<PayerCatalogSearchResult> {
    const searchText = sanitizeCatalogFilterValue(query.searchText)
    if (!clearingHouseId || !searchText) {
      return { items: [], totalCount: 0, unsupported: false }
    }

    const filters = [`searchText__CONTAINS_IGNORE_CASE__${searchText}__AND`]
    const payerState = sanitizeCatalogFilterValue(query.payerState ?? "")
    if (payerState) {
      filters.push(`payerState__CONTAINS_IGNORE_CASE__${payerState}__AND`)
    }

    const qsString = qsLib.stringify(
      {
        filters,
        page: query.page ?? 0,
        pageSize: query.pageSize ?? 20,
      },
      { arrayFormat: "repeat", encode: true },
    )

    const response = await serviceGetSilent<PaginatedResponse<PayerCatalogSearchItem>>(
      `/clearing-houses/${clearingHouseId}/payer-catalog/search?${qsString}`,
    )

    // 422 "does not have a payer catalog provider": es una característica que ese
    // clearing house no tiene, no un fallo. Se devuelve como estado para que el
    // llamador deje de reintentar en cada tecla.
    if (response?.status === 422 && CATALOG_UNSUPPORTED.test(response?.data?.message ?? "")) {
      return { items: [], totalCount: 0, unsupported: true }
    }

    if (!response || response.status !== 200 || !response.data) {
      throw new Error(response?.data?.message || "Failed to search payer catalog")
    }

    const data = response.data as unknown
    if (Array.isArray(data)) {
      return { items: data as PayerCatalogSearchItem[], totalCount: data.length, unsupported: false }
    }

    const paginated = data as PaginatedResponse<PayerCatalogSearchItem>
    const entities = Array.isArray(paginated.entities) ? paginated.entities : []
    return {
      items: entities,
      totalCount: paginated.pagination?.total ?? entities.length,
      unsupported: false,
    }
  }

  async getPlanTypeCatalog(): Promise<PlanTypeCatalogItem[]> {
    const response = await serviceGet<PlanTypeCatalogItem[]>("/plan-type/catalog")

    if (response.status !== 200 || !response.data) {
      throw new Error(response.data?.message || "Failed to fetch plan type catalog")
    }

    const data = response.data as unknown
    if (Array.isArray(data)) return data as PlanTypeCatalogItem[]

    const paginated = data as { entities?: PlanTypeCatalogItem[] }
    return Array.isArray(paginated.entities) ? paginated.entities : []
  }

  async refresh(): Promise<void> {
    // no-op: the list hook re-fetches via refreshIndex
  }
}

function sanitizeCatalogFilterValue(value: string): string {
  return value.trim().replace(/__/g, " ")
}
