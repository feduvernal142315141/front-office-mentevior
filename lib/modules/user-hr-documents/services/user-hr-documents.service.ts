import { serviceGet, servicePut, serviceDelete, servicePost } from "@/lib/services/baseService"
import { parseDateFromBackend, dateToISO } from "@/lib/utils/date"
import type {
  BackendUserHRDocument,
  SaveUserHRDocumentDto,
  CreateUserHRDocumentDto,
  UpdateUserHRDocumentDto,
  DeleteUserHRDocumentDto,
} from "@/lib/types/user-hr-document.types"


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
  const issuedDateParsed = parseDateFromBackend(doc.issuedDate)
  const expirationDateParsed = parseDateFromBackend(doc.expiredDate ?? doc.expireDate ?? doc.expirationDate)
  
  return {
    id: doc.id ?? null,
    memberUserId: doc.memberUserId ?? "",
    documentConfigId: doc.documentConfigId,
    documentConfigName: doc.name,
    issuedDate: dateToISO(issuedDateParsed),
    expirationDate: dateToISO(expirationDateParsed),
    fileUrl: doc.fileUrl ?? null,
    fileName: doc.fileName ?? doc.name ?? null,
    comments: doc.comment ?? doc.comments ?? null,
    status: normalizeStatus(doc.status),
    allowIssuedDate: doc.hasIssuedDate ?? false,
    allowExpirationDate: doc.hasExpirationDate ?? false,
    allowUploadFile: doc.hasUploadFile ?? true,
    allowDownloadFile: doc.hasDownloadFile ?? true,
    allowStatus: doc.hasStatus ?? false,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}





export async function getUserHRDocuments(
  memberUserId: string
): Promise<BackendUserHRDocument[]> {
  const response = await serviceGet<{ documents: any[] }>(
    `/member-users/documents/${memberUserId}`
  )

  if (!response || response.status !== 200 || !response.data) {
    return []
  }

  const documents = response.data.documents || []

  return documents.map(mapBackendDocument)
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
