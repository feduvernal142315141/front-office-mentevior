export type ClientDocumentStatus =
  | "PENDING"
  | "DELIVERED"
  | "NEAR_EXPIRATION"
  | "EXPIRED"

export interface RequiredClientDocumentConfig {
  id: string
  name: string
  allowIssuedDate: boolean
  allowExpirationDate: boolean
  allowUploadFile: boolean
  allowDownloadFile: boolean
  allowStatus: boolean
}

export interface ClientDocument {
  id: string
  clientId: string
  documentConfigId: string
  documentConfigName: string
  issuedDate: string | null
  expirationDate: string | null
  fileUrl: string | null
  fileName: string | null
  status: ClientDocumentStatus
  createdAt?: string
  updatedAt?: string
  allowIssuedDate: boolean
  allowExpirationDate: boolean
  allowUploadFile: boolean
  allowDownloadFile: boolean
}

export interface ClientDocumentRow {
  documentConfigId: string
  documentConfigName: string
  clientDocumentId: string | null
  issuedDate: string | null
  expirationDate: string | null
  fileUrl: string | null
  fileName: string | null
  comments: string | null
  status: ClientDocumentStatus
  allowIssuedDate: boolean
  allowExpirationDate: boolean
  allowUploadFile: boolean
  allowDownloadFile: boolean
  allowStatus: boolean
}

export interface CreateClientDocumentDto {
  clientId: string
  documentConfigId: string
  issuedDate?: string | null
  expirationDate?: string | null
  fileBase64?: string | null
  fileName?: string | null
  comment?: string | null
}

export interface UpdateClientDocumentDto {
  id: string
  issuedDate?: string | null
  expirationDate?: string | null
  fileBase64?: string | null
  fileName?: string | null
  comment?: string | null
}

export interface SaveClientDocumentDto {
  clientId: string
  documentConfigId: string
  issuedDate?: string | null
  expirationDate?: string | null
  fileBase64?: string | null
  fileName?: string | null
  comments?: string | null
}

export interface DeleteClientDocumentDto {
  clientId: string
  documentConfigId: string
}

export interface BackendClientDocument {
  id: string | null
  clientId: string
  documentConfigId: string
  documentConfigName: string
  issuedDate: string | null
  expirationDate: string | null
  fileUrl: string | null
  fileName: string | null
  comments: string | null
  status?: ClientDocumentStatus
  allowIssuedDate: boolean
  allowExpirationDate: boolean
  allowUploadFile: boolean
  allowDownloadFile: boolean
  allowStatus: boolean
  createdAt?: string
  updatedAt?: string
}
