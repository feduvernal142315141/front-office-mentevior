export type UserHRDocumentStatus =
  | "PENDING"
  | "DELIVERED"
  | "NEAR_EXPIRATION"
  | "EXPIRED"


export interface RequiredHRDocumentConfig {
  id: string
  name: string
  allowIssuedDate: boolean
  allowExpirationDate: boolean
  allowUploadFile: boolean
  allowDownloadFile: boolean
  allowStatus: boolean
}

export interface UserHRDocument {
  id: string
  memberUserId: string
  documentConfigId: string
  documentConfigName: string
  issuedDate: string | null
  expirationDate: string | null
  fileUrl: string | null
  fileName: string | null

  status: UserHRDocumentStatus
  createdAt?: string
  updatedAt?: string

  allowIssuedDate: boolean
  allowExpirationDate: boolean
  allowUploadFile: boolean
  allowDownloadFile: boolean
}


export interface UserHRDocumentRow {

  documentConfigId: string
  documentConfigName: string
 
  userDocumentId: string | null
  issuedDate: string | null
  expirationDate: string | null
  fileUrl: string | null
  fileName: string | null
  comments: string | null
  status: UserHRDocumentStatus
  allowIssuedDate: boolean
  allowExpirationDate: boolean
  allowUploadFile: boolean
  allowDownloadFile: boolean
}

export interface CreateUserHRDocumentDto {
  memberUserId: string
  documentConfigId: string
  issuedDate?: string | null
  expirationDate?: string | null

  fileBase64?: string | null
  fileName?: string | null

  comment?: string | null
}


export interface UpdateUserHRDocumentDto {

  id: string
  issuedDate?: string | null
  expirationDate?: string | null
 
  fileBase64?: string | null
  fileName?: string | null
 
  comment?: string | null
}


export interface SaveUserHRDocumentDto {
  memberUserId: string
  documentConfigId: string
  issuedDate?: string | null
  expirationDate?: string | null

  fileBase64?: string | null
  fileName?: string | null
  comments?: string | null
}


export interface DeleteUserHRDocumentDto {
  memberUserId: string
  documentConfigId: string
}


export interface BackendUserHRDocument {
  id: string
  memberUserId: string
  documentConfigId: string
  issuedDate: string | null
  expirationDate: string | null
  fileUrl: string | null
  fileName: string | null
  comments: string | null
 
  status?: UserHRDocumentStatus
  createdAt?: string
  updatedAt?: string
}
