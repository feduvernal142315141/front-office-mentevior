import { serviceGet, servicePost, servicePut, serviceDelete } from "@/lib/services/baseService"
import type { 
  HRDocument, 
  HRDocumentListItem, 
  HRDocumentCatalogItem,
  CreateHRDocumentDto, 
  UpdateHRDocumentDto,
  BulkCreateHRDocumentsDto,
  DocumentCategory
} from "@/lib/types/hr-document.types"
import type { PaginatedResponse } from "@/lib/types/response.types"
import { getQueryString } from "@/lib/utils/format"
import type { QueryModel } from "@/lib/models/queryModel"

export async function getHRDocuments(query: QueryModel): Promise<{ hrDocuments: HRDocumentListItem[], totalCount: number }> {
  const response = await serviceGet<PaginatedResponse<HRDocumentListItem>>(`/document-config${
    query ? `?${getQueryString(query)}` : ''
  }`)
  
  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch HR documents")
  }
  
  const paginatedData = response.data as unknown as PaginatedResponse<HRDocumentListItem>
  
  if (!paginatedData.entities || !Array.isArray(paginatedData.entities)) {
    console.error("Invalid backend response:", response.data)
    return { hrDocuments: [], totalCount: 0 }
  }
  
  return {
    hrDocuments: paginatedData.entities,
    totalCount: paginatedData.pagination?.total || 0
  }
}

export async function getHRDocumentById(id: string): Promise<HRDocument | null> {
  const response = await serviceGet<HRDocument>(`/document-config/${id}`)
  
  if (response.status === 404) {
    return null
  }

  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch HR document")
  }

  return response.data as unknown as HRDocument
}

export async function getHRDocumentsCatalog(documentCategory: DocumentCategory = "HR"): Promise<{ catalogDocuments: HRDocumentCatalogItem[], totalCount: number }> {
  const response = await serviceGet<HRDocumentCatalogItem[]>(`/document-config/catalog?documentCategory=${documentCategory}`)
  
  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch HR documents catalog")
  }
  
  const catalogData = response.data as unknown as HRDocumentCatalogItem[]
  
  if (!Array.isArray(catalogData)) {
    console.error("Invalid backend response:", response.data)
    return { catalogDocuments: [], totalCount: 0 }
  }
  
  return {
    catalogDocuments: catalogData,
    totalCount: catalogData.length
  }
}

export async function createHRDocument(data: CreateHRDocumentDto): Promise<string> {
  const response = await servicePost<CreateHRDocumentDto, string>("/document-config", data)

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to create HR document")
  }

  return response.data as unknown as string
}

export async function updateHRDocument(data: UpdateHRDocumentDto): Promise<boolean> {
  const response = await servicePut<UpdateHRDocumentDto, boolean>("/document-config", data)

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to update HR document")
  }

  return response.data as unknown as boolean
}

export async function bulkCreateHRDocuments(data: BulkCreateHRDocumentsDto): Promise<boolean> {
  const response = await servicePost<BulkCreateHRDocumentsDto, boolean>("/document-config/bulk", data)

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to bulk create HR documents")
  }

  return response.data as unknown as boolean
}

export async function deleteHRDocument(id: string): Promise<boolean> {
  const response = await serviceDelete<boolean>(`/document-config/${id}`)

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to delete HR document")
  }

  return true
}
