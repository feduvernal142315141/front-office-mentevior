export type DocumentCategory = "HR" | "CLINICAL"

export interface HRDocument {
  id: string
  name: string
  documentCategory: DocumentCategory
  issuedDate: boolean
  expirationDate: boolean
  uploadFile: boolean
  downloadFile: boolean
  status: boolean
  isFromCatalog?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface HRDocumentListItem {
  id: string
  name: string
  documentCategory: DocumentCategory
  issuedDate: boolean
  expirationDate: boolean
  uploadFile: boolean
  downloadFile: boolean
  status: boolean
  isFromCatalog?: boolean
}

export interface HRDocumentCatalogItem {
  id: string
  name: string
}

export interface CreateHRDocumentDto {
  name: string
  documentCategory: DocumentCategory
  issuedDate: boolean
  expirationDate: boolean
  uploadFile: boolean
  downloadFile: boolean
  status: boolean
  catalogId?: string
}

export interface UpdateHRDocumentDto {
  id: string
  name: string
  documentCategory: DocumentCategory
  issuedDate: boolean
  expirationDate: boolean
  uploadFile: boolean
  downloadFile: boolean
  status: boolean
}

export interface BulkCreateHRDocumentsDto {
  catalogIds: string[]
}
