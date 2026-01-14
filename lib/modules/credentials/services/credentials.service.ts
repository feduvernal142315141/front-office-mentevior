import { serviceGet, servicePost, servicePut } from "@/lib/services/baseService"
import type { 
  Credential, 
  CredentialListItem, 
  CredentialCatalogItem,
  CreateCredentialDto, 
  UpdateCredentialDto 
} from "@/lib/types/credential.types"
import type { PaginatedResponse } from "@/lib/types/response.types"
import { getQueryString } from "@/lib/utils/format"
import type { QueryModel } from "@/lib/models/queryModel"

export async function getCredentials(query: QueryModel): Promise<{ credentials: CredentialListItem[], totalCount: number }> {
  const response = await serviceGet<PaginatedResponse<CredentialListItem>>(`/credential${
    query ? `?${getQueryString(query)}` : ''
  }`)
  
  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch credentials")
  }
  
  const paginatedData = response.data as unknown as PaginatedResponse<CredentialListItem>
  
  if (!paginatedData.entities || !Array.isArray(paginatedData.entities)) {
    console.error("Invalid backend response:", response.data)
    return { credentials: [], totalCount: 0 }
  }
  
  return {
    credentials: paginatedData.entities,
    totalCount: paginatedData.pagination?.total || 0
  }
}

export async function getCredentialById(id: string): Promise<Credential | null> {
  const response = await serviceGet<Credential>(`/credential/${id}`)
  
  if (response.status === 404) {
    return null
  }

  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch credential")
  }

  return response.data as unknown as Credential
}

export async function getCredentialsCatalog(): Promise<{ catalogCredentials: CredentialCatalogItem[], totalCount: number }> {
  const response = await serviceGet<CredentialCatalogItem[]>("/credential/catalog")
  
  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch credentials catalog")
  }
  
  const catalogData = response.data as unknown as CredentialCatalogItem[]
  
  if (!Array.isArray(catalogData)) {
    console.error("Invalid backend response:", response.data)
    return { catalogCredentials: [], totalCount: 0 }
  }
  
  return {
    catalogCredentials: catalogData,
    totalCount: catalogData.length
  }
}

export async function createCredential(data: CreateCredentialDto): Promise<string> {
  const response = await servicePost<CreateCredentialDto, string>("/credential", data)

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to create credential")
  }

  return response.data as unknown as string
}

export async function updateCredential(data: UpdateCredentialDto): Promise<boolean> {
  const response = await servicePut<UpdateCredentialDto, boolean>("/credential", data)

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to update credential")
  }

  return response.data as unknown as boolean
}

export async function bulkCreateCredentials(catalogIds: string[]): Promise<boolean> {
  const response = await servicePost<{ catalogIds: string[] }, boolean>("/credential/bulk", {
    catalogIds
  })

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to bulk create credentials")
  }

  return response.data as unknown as boolean
}
