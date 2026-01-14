export interface Credential {
  id: string
  name: string
  shortName: string
  organizationName?: string
  website?: string
  taxonomyCode: string
  description?: string
  allowedBillingCodes?: string[]
  billingCodes?: string[]
  active: boolean
  isFromCatalog?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface CredentialListItem {
  id: string
  name: string
  active: boolean
  isFromCatalog?: boolean
}

export interface CredentialCatalogItem {
  id: string
  name: string
  shortName: string
  organizationName?: string
  website?: string
  description?: string
}

export interface CreateCredentialDto {
  name: string
  shortName: string
  organizationName?: string
  website?: string
  taxonomyCode: string
  description?: string
  billingCodes?: string[]
}

export interface UpdateCredentialDto {
  id: string
  name: string
  shortName: string
  organizationName?: string
  website?: string
  taxonomyCode: string
  description?: string
  billingCodes?: string[]
}
