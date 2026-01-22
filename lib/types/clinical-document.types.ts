// Clinical Documents use the same types as HR Documents, just with different category
export type {
  HRDocument as ClinicalDocument,
  HRDocumentListItem as ClinicalDocumentListItem,
  HRDocumentCatalogItem as ClinicalDocumentCatalogItem,
  CreateHRDocumentDto as CreateClinicalDocumentDto,
  UpdateHRDocumentDto as UpdateClinicalDocumentDto,
  BulkCreateHRDocumentsDto as BulkCreateClinicalDocumentsDto,
  DocumentCategory,
} from "./hr-document.types"
