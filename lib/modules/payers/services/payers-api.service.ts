import { serviceGet, servicePost, servicePut, serviceDelete } from "@/lib/services/baseService"
import type {
  CreatePayerDto,
  ListPayersQueryDto,
  Payer,
  PayerCatalogItem,
  PayerPlanTypeItem,
  UpdatePayerDto,
} from "@/lib/types/payer.types"
import type { PaginatedResponse } from "@/lib/types/response.types"
import type { PayersServiceContract } from "../types/payers-service.types"

export class ApiPayersService implements PayersServiceContract {
  async list(query: ListPayersQueryDto): Promise<Payer[]> {
    const params = query.search ? `?search=${encodeURIComponent(query.search)}` : ""
    const response = await serviceGet<PaginatedResponse<Payer>>(`/payers${params}`)

    if (response.status !== 200 || !response.data) {
      throw new Error(response.data?.message || "Failed to fetch payers")
    }

    const paginatedData = response.data as unknown as PaginatedResponse<Payer>
    return Array.isArray(paginatedData.entities) ? paginatedData.entities : []
  }

  async getById(id: string): Promise<Payer> {
    const response = await serviceGet<Payer>(`/payers/${id}`)

    if (response.status !== 200 || !response.data) {
      throw new Error(response.data?.message || "Failed to fetch payer")
    }

    return response.data as unknown as Payer
  }

  async create(data: CreatePayerDto): Promise<Payer> {
    const response = await servicePost<CreatePayerDto, Payer>("/payers", data)

    if (response.status !== 200 && response.status !== 201) {
      throw new Error(response.data?.message || "Failed to create payer")
    }

    return response.data as unknown as Payer
  }

  async delete(id: string): Promise<void> {
    const response = await serviceDelete<never, { message?: string }>(`/payers/${id}`)

    if (response.status !== 200 && response.status !== 204) {
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

  async createFromStateInsurance(ids: string[]): Promise<void> {
    const response = await servicePost<{ ids: string[] }, { message?: string }>(
      "/payers/create-from-state-insurance",
      { ids }
    )

    if (response.status !== 200 && response.status !== 201) {
      throw new Error(response.data?.message || "Failed to create payers from state insurance")
    }
  }

  async update(data: UpdatePayerDto): Promise<Payer> {
    const response = await servicePut<UpdatePayerDto, Payer>("/payers", data)

    if (response.status !== 200 && response.status !== 201) {
      throw new Error(response.data?.message || "Failed to update payer")
    }

    return response.data as unknown as Payer
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

  async getFlMedicaidCatalog(): Promise<PayerCatalogItem[]> {
    const response = await serviceGet<PayerCatalogItem[]>("/state-insurance/catalog")

    if (response.status !== 200 || !response.data) {
      throw new Error(response.data?.message || "Failed to fetch state insurance catalog")
    }

    const data = response.data as unknown
    if (Array.isArray(data)) return data as PayerCatalogItem[]

    const paginated = data as { entities?: PayerCatalogItem[] }
    return Array.isArray(paginated.entities) ? paginated.entities : []
  }

  async getPlanTypeCatalog(): Promise<PayerPlanTypeItem[]> {
    const response = await serviceGet<PayerPlanTypeItem[]>("/plan-type/catalog")

    if (response.status !== 200 || !response.data) {
      throw new Error(response.data?.message || "Failed to fetch plan type catalog")
    }

    const data = response.data as unknown
    if (Array.isArray(data)) return data as PayerPlanTypeItem[]

    const paginated = data as { entities?: PayerPlanTypeItem[] }
    return Array.isArray(paginated.entities) ? paginated.entities : []
  }

  async refresh(): Promise<void> {
    // no-op: the list hook re-fetches via refreshIndex
  }
}
