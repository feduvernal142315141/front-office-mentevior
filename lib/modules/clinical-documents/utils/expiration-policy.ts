const NO_EXPIRATION_CLINICAL_DOCUMENT_NAMES = new Set([
  "insurance card",
  "admission form",
  "intake form",
])

export function isNoExpirationClinicalDocument(documentName: string): boolean {
  return NO_EXPIRATION_CLINICAL_DOCUMENT_NAMES.has(documentName.trim().toLowerCase())
}
