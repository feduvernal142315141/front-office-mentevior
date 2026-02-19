import { serviceGet, servicePut, serviceDelete, servicePost } from "@/lib/services/baseService"
import { getQueryString } from "@/lib/utils/format"
import type { QueryModel } from "@/lib/models/queryModel"
import type {
  BackendUserHRDocument,
  RequiredHRDocumentConfig,
  SaveUserHRDocumentDto,
  CreateUserHRDocumentDto,
  UpdateUserHRDocumentDto,
  DeleteUserHRDocumentDto,
} from "@/lib/types/user-hr-document.types"
import type { HRDocumentListItem } from "@/lib/types/hr-document.types"
import type { PaginatedResponse } from "@/lib/types/response.types"

function convertToISODate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null
  
  const parts = dateStr.split("/")
  if (parts.length === 3) {
    const [month, day, year] = parts
    if (month && day && year && year.length === 4) {
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
    }
  }
  

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr
  }
  
  return null
}


function normalizeStatus(status: any): "PENDING" | "DELIVERED" | "NEAR_EXPIRATION" | "EXPIRED" | undefined {
  if (!status) return undefined
  
  const normalized = String(status).toUpperCase().replace(/\s+/g, "_")
  
  const validStatuses = ["PENDING", "DELIVERED", "NEAR_EXPIRATION", "EXPIRED"]
  if (validStatuses.includes(normalized)) {
    return normalized as any
  }
  
  console.warn(`[mapBackendDocument] Unknown status received from backend: "${status}" (normalized to: "${normalized}")`)
  return undefined
}

function mapBackendDocument(doc: any): BackendUserHRDocument {
  return {
    id: doc.id,
    memberUserId: doc.memberUserId ?? "",
    documentConfigId: doc.documentConfigId,
    issuedDate: convertToISODate(doc.issuedDate),
    expirationDate: convertToISODate(doc.expiredDate ?? doc.expireDate ?? doc.expirationDate),
    fileUrl: doc.fileUrl ?? null,
    fileName: doc.fileName ?? doc.name ?? null,
    comments: doc.comment ?? doc.comments ?? null,
    status: normalizeStatus(doc.status),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}


export async function getRequiredHRDocumentConfigs(): Promise<RequiredHRDocumentConfig[]> {
  const query: QueryModel = {
    page: 0,
    pageSize: 100,
    filters: ["documentCategory__EQ__HR__AND"],
  }

  const response = await serviceGet<PaginatedResponse<HRDocumentListItem>>(
    `/document-config?${getQueryString(query)}`
  )

  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch required HR document configs")
  }

  const paginatedData = response.data as unknown as PaginatedResponse<HRDocumentListItem>

  if (!paginatedData.entities || !Array.isArray(paginatedData.entities)) {
    return []
  }

  return paginatedData.entities.map((item) => ({
    id: item.id,
    name: item.name,
    allowIssuedDate: item.issuedDate,
    allowExpirationDate: item.expirationDate,
    allowUploadFile: item.uploadFile,
    allowDownloadFile: item.downloadFile,
    allowStatus: item.status,
  }))
}


export async function getUserHRDocuments(
  memberUserId: string
): Promise<BackendUserHRDocument[]> {
  const response = await serviceGet<any>(
    `/member-users/documents/${memberUserId}`
  )

  if (!response || response.status !== 200 || !response.data) {
    return []
  }

  const responseData = response.data as unknown
  let rawDocuments: any[] = []

  if (Array.isArray(responseData)) {
    rawDocuments = responseData
  } else if ((responseData as any)?.documents && Array.isArray((responseData as any).documents)) {

    rawDocuments = (responseData as any).documents
  } else if ((responseData as any)?.entities && Array.isArray((responseData as any).entities)) {

    rawDocuments = (responseData as any).entities
  }

  return rawDocuments
    .filter((doc) => doc.id != null)
    .map(mapBackendDocument)
}


export async function createUserHRDocument(
  data: SaveUserHRDocumentDto
): Promise<BackendUserHRDocument> {

  const createDto: CreateUserHRDocumentDto = {
    memberUserId: data.memberUserId,
    documentConfigId: data.documentConfigId,
    issuedDate: data.issuedDate,
    expirationDate: data.expirationDate,
    fileBase64: data.fileBase64,
    fileName: data.fileName,
    comment: data.comments, 
  }

  const response = await servicePost<CreateUserHRDocumentDto, any>(
    "/member-users/document",
    createDto
  )

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to create user HR document")
  }

  return mapBackendDocument(response.data)
}


export async function updateUserHRDocument(
  userDocumentId: string,
  data: SaveUserHRDocumentDto
): Promise<BackendUserHRDocument> {

  const updateDto: UpdateUserHRDocumentDto = {
    id: userDocumentId,
    issuedDate: data.issuedDate,
    expirationDate: data.expirationDate,
    fileBase64: data.fileBase64,
    fileName: data.fileName,
    comment: data.comments, 
  }

  const response = await servicePut<UpdateUserHRDocumentDto, any>(
    "/member-users/document",
    updateDto
  )

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to update user HR document")
  }

  return mapBackendDocument(response.data)
}


export async function deleteUserHRDocument(
  data: DeleteUserHRDocumentDto
): Promise<boolean> {
  const response = await serviceDelete<DeleteUserHRDocumentDto, boolean>(
    "/member-users/document",
    data
  )

  if (response.status !== 200 && response.status !== 201 && response.status !== 204) {
    throw new Error(response.data?.message || "Failed to delete user HR document")
  }

  return true
}


export async function getUserDocumentUrl(documentId: string): Promise<string> {
  const response = await serviceGet<{ url: string }>(`/member-users/document/${documentId}`)

  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch document URL")
  }

  const url = (response.data as unknown as { url: string }).url

  if (!url || url.trim() === "") {
    throw new Error("Document URL is empty. The file may not exist or the backend failed to generate a signed URL.")
  }

  return url
}
