import { serviceGet, servicePost, servicePut } from "@/lib/services/baseService"
import type { 
  BillingCode, 
  BillingCodeListItem, 
  BillingCodeCatalogItem,
  BillingCodeTypeItem,
  CreateBillingCodeDto, 
  UpdateBillingCodeDto 
} from "@/lib/types/billing-code.types"
import type { PaginatedResponse } from "@/lib/types/response.types"
import { getQueryString } from "@/lib/utils/format"
import type { QueryModel } from "@/lib/models/queryModel"

export async function getBillingCodes(query: QueryModel): Promise<{ billingCodes: BillingCodeListItem[], totalCount: number }> {
  const response = await serviceGet<PaginatedResponse<BillingCodeListItem>>(`/billing-code${
    query ? `?${getQueryString(query)}` : ''
  }`)
  
  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch billing codes")
  }
  
  const paginatedData = response.data as unknown as PaginatedResponse<BillingCodeListItem>
  
  if (!paginatedData.entities || !Array.isArray(paginatedData.entities)) {
    console.error("Invalid backend response:", response.data)
    return { billingCodes: [], totalCount: 0 }
  }
  
  return {
    billingCodes: paginatedData.entities,
    totalCount: paginatedData.pagination?.total || 0
  }
}

export async function getBillingCodeById(id: string): Promise<BillingCode | null> {
  const response = await serviceGet<BillingCode>(`/billing-code/${id}`)
  
  if (response.status === 404) {
    return null
  }

  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch billing code")
  }

  return response.data as unknown as BillingCode
}

export async function getBillingCodesCatalog(query?: QueryModel): Promise<{ catalogCodes: BillingCodeCatalogItem[], totalCount: number }> {
  const response = await serviceGet<PaginatedResponse<BillingCodeCatalogItem>>(`/billing-code/catalog${
    query ? `?${getQueryString(query)}` : ''
  }`)
  
  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch billing codes catalog")
  }
  
  const paginatedData = response.data as unknown as PaginatedResponse<BillingCodeCatalogItem>
  
  if (!paginatedData.entities || !Array.isArray(paginatedData.entities)) {
    console.error("Invalid backend response:", response.data)
    return { catalogCodes: [], totalCount: 0 }
  }
  
  return {
    catalogCodes: paginatedData.entities,
    totalCount: paginatedData.pagination?.total || 0
  }
}


export async function createBillingCode(data: CreateBillingCodeDto): Promise<string> {
  const response = await servicePost<CreateBillingCodeDto, string>("/billing-code", data)

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to create billing code")
  }

  return response.data as unknown as string
}

export async function updateBillingCode(data: UpdateBillingCodeDto): Promise<boolean> {
  const response = await servicePut<UpdateBillingCodeDto, boolean>("/billing-code", data)

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to update billing code")
  }

  return response.data as unknown as boolean
}

export async function getBillingCodeTypes(): Promise<BillingCodeTypeItem[]> {
  const response = await serviceGet<PaginatedResponse<BillingCodeTypeItem>>("/type/catalog")
  
  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch billing code types")
  }

  const paginatedData = response.data as unknown as PaginatedResponse<BillingCodeTypeItem>
  
  if (!paginatedData.entities || !Array.isArray(paginatedData.entities)) {
    console.error("Invalid backend response:", response.data)
    return []
  }

  return paginatedData.entities
}
