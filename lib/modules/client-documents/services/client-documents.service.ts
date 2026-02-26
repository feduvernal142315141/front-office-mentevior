import { serviceGet, servicePut, serviceDelete, servicePost } from "@/lib/services/baseService"
import { parseDateFromBackend, dateToISO } from "@/lib/utils/date"
import type {
  BackendClientDocument,
  SaveClientDocumentDto,
  CreateClientDocumentDto,
  UpdateClientDocumentDto,
  DeleteClientDocumentDto,
} from "@/lib/types/client-document.types"

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

function mapBackendDocument(doc: any): BackendClientDocument {
  const issuedDateParsed = parseDateFromBackend(doc.issuedDate)
  const expirationDateParsed = parseDateFromBackend(doc.expiredDate ?? doc.expireDate ?? doc.expirationDate)
  
  return {
    id: doc.id ?? null,
    clientId: doc.clientId ?? "",
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

export async function getClientDocuments(
  clientId: string
): Promise<BackendClientDocument[]> {
  const response = await serviceGet<{ documents: any[] }>(
    `/client/documents/${clientId}`
  )

  if (!response || response.status !== 200 || !response.data) {
    return []
  }

  const documents = response.data.documents || []

  return documents.map(mapBackendDocument)
}

export async function createClientDocument(
  clientId: string,
  data: SaveClientDocumentDto
): Promise<BackendClientDocument> {
  const createDto: CreateClientDocumentDto = {
    clientId: clientId,
    documentConfigId: data.documentConfigId,
    issuedDate: data.issuedDate,
    expirationDate: data.expirationDate,
    fileBase64: data.fileBase64,
    fileName: data.fileName,
    comment: data.comments, 
  }

  const response = await servicePost<CreateClientDocumentDto, any>(
    "/client/document",
    createDto
  )

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to create client document")
  }

  return mapBackendDocument(response.data)
}

export async function updateClientDocument(
  clientDocumentId: string,
  data: SaveClientDocumentDto
): Promise<BackendClientDocument> {
  const updateDto: UpdateClientDocumentDto = {
    id: clientDocumentId,
    issuedDate: data.issuedDate,
    expirationDate: data.expirationDate,
    fileBase64: data.fileBase64,
    fileName: data.fileName,
    comment: data.comments, 
  }

  const response = await servicePut<UpdateClientDocumentDto, any>(
    "/client/document",
    updateDto
  )

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to update client document")
  }

  return mapBackendDocument(response.data)
}

export async function deleteClientDocument(
  data: DeleteClientDocumentDto
): Promise<boolean> {
  const response = await serviceDelete<DeleteClientDocumentDto, boolean>(
    "/client/document",
    data
  )

  if (response.status !== 200 && response.status !== 201 && response.status !== 204) {
    throw new Error(response.data?.message || "Failed to delete client document")
  }

  return true
}

export async function getClientDocumentUrl(documentId: string): Promise<string> {
  const response = await serviceGet<{ url: string }>(`/client/document/${documentId}`)

  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch document URL")
  }

  const url = (response.data as unknown as { url: string }).url

  if (!url || url.trim() === "") {
    throw new Error("Document URL is empty. The file may not exist or the backend failed to generate a signed URL.")
  }

  return url
}
