import { serviceGet, servicePost, servicePut, serviceDelete } from "@/lib/services/baseService"
import type { 
  ClinicalDocument, 
  ClinicalDocumentListItem, 
  ClinicalDocumentCatalogItem,
  CreateClinicalDocumentDto, 
  UpdateClinicalDocumentDto,
  BulkCreateClinicalDocumentsDto,
  DocumentCategory
} from "@/lib/types/clinical-document.types"
import type { PaginatedResponse } from "@/lib/types/response.types"
import { getQueryString } from "@/lib/utils/format"
import type { QueryModel } from "@/lib/models/queryModel"

export async function getClinicalDocuments(query: QueryModel): Promise<{ clinicalDocuments: ClinicalDocumentListItem[], totalCount: number }> {
  const response = await serviceGet<PaginatedResponse<ClinicalDocumentListItem>>(`/document-config${
    query ? `?${getQueryString(query)}` : ''
  }`)
  
  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch clinical documents")
  }
  
  const paginatedData = response.data as unknown as PaginatedResponse<ClinicalDocumentListItem>
  
  if (!paginatedData.entities || !Array.isArray(paginatedData.entities)) {
    console.error("Invalid backend response:", response.data)
    return { clinicalDocuments: [], totalCount: 0 }
  }
  
  return {
    clinicalDocuments: paginatedData.entities,
    totalCount: paginatedData.pagination?.total || 0
  }
}

export async function getClinicalDocumentById(id: string): Promise<ClinicalDocument | null> {
  const response = await serviceGet<ClinicalDocument>(`/document-config/${id}`)
  
  if (response.status === 404) {
    return null
  }

  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch clinical document")
  }

  return response.data as unknown as ClinicalDocument
}

export async function getClinicalDocumentsCatalog(documentCategory: DocumentCategory = "CLINICAL"): Promise<{ catalogDocuments: ClinicalDocumentCatalogItem[], totalCount: number }> {
  const response = await serviceGet<ClinicalDocumentCatalogItem[]>(`/document-config/catalog?documentCategory=${documentCategory}`)
  
  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch clinical documents catalog")
  }
  
  const catalogData = response.data as unknown as ClinicalDocumentCatalogItem[]
  
  if (!Array.isArray(catalogData)) {
    console.error("Invalid backend response:", response.data)
    return { catalogDocuments: [], totalCount: 0 }
  }
  
  return {
    catalogDocuments: catalogData,
    totalCount: catalogData.length
  }
}

export async function createClinicalDocument(data: CreateClinicalDocumentDto): Promise<string> {
  const response = await servicePost<CreateClinicalDocumentDto, string>("/document-config", data)

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to create clinical document")
  }

  return response.data as unknown as string
}

export async function updateClinicalDocument(data: UpdateClinicalDocumentDto): Promise<boolean> {
  const response = await servicePut<UpdateClinicalDocumentDto, boolean>("/document-config", data)

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to update clinical document")
  }

  return response.data as unknown as boolean
}

export async function bulkCreateClinicalDocuments(data: BulkCreateClinicalDocumentsDto): Promise<boolean> {
  const response = await servicePost<BulkCreateClinicalDocumentsDto, boolean>("/document-config/bulk", data)

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to bulk create clinical documents")
  }

  return response.data as unknown as boolean
}

export async function deleteClinicalDocument(id: string): Promise<boolean> {
  const response = await serviceDelete<boolean>(`/document-config/${id}`)

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to delete clinical document")
  }

  return true
}
