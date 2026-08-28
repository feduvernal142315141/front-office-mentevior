import type { QueryModel } from "@/lib/models/queryModel"
import { serviceGet, serviceGetSilent, servicePost, servicePut, serviceDelete } from "@/lib/services/baseService"
import { getQueryString } from "@/lib/utils/format"
import qsLib from "qs"
import type { PlanTypeCatalogItem } from "@/lib/types/plan-type.types"
import type {
  CreatePayerDto,
  ListPayersQueryDto,
  PayerClearingHouseItem,
  Payer,
  PayerCatalogItem,
  PayerCatalogSearchItem,
  SearchPayerCatalogQuery,
  UpdatePayerDto,
} from "@/lib/types/payer.types"
import type { PaginatedResponse } from "@/lib/types/response.types"
import type { PayersListResult, PayersServiceContract } from "../types/payers-service.types"

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
  ): Promise<{ items: PayerCatalogSearchItem[]; totalCount: number }> {
    const searchText = sanitizeCatalogFilterValue(query.searchText)
    if (!clearingHouseId || !searchText) {
      return { items: [], totalCount: 0 }
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

    if (!response || response.status !== 200 || !response.data) {
      throw new Error(response?.data?.message || "Failed to search payer catalog")
    }

    const data = response.data as unknown
    if (Array.isArray(data)) {
      return { items: data as PayerCatalogSearchItem[], totalCount: data.length }
    }

    const paginated = data as PaginatedResponse<PayerCatalogSearchItem>
    const entities = Array.isArray(paginated.entities) ? paginated.entities : []
    return {
      items: entities,
      totalCount: paginated.pagination?.total ?? entities.length,
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
