export const PAYER_SOURCE = {
  CATALOG: "catalog",
  FL_MEDICAID: "fl-medicaid",
  MANUAL: "manual",
} as const

export type PayerSource = (typeof PAYER_SOURCE)[keyof typeof PAYER_SOURCE]

export interface PayerBaseFormFields {
  name: string
  phone: string
  email: string
  externalId: string
  groupNumber: string
  addressLine1: string
  addressLine2: string
  city: string
  stateId: string
  zipCode: string
}

export interface Payer {
  id: string
  name: string
  source: PayerSource
  sourceReferenceId?: string
  logoUrl?: string | null
  phone: string
  email: string
  /** Optional marketing or portal URL; shown on manage overview when present */
  website?: string | null
  externalId: string
  groupNumber: string
  addressLine1: string
  addressLine2?: string
  city: string
  countryId?: string
  stateId: string
  stateName?: string
  zipCode: string
  clearingHouseId?: string
  planTypeId?: string
  description: string
  clearingHouseName?: string
  planTypeName?: string
  /** Insurance plan entity id — updates/rates use /insurance-plans/{planId}/… */
  insurancePlanId?: string | null
  active?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface PayerCatalogItem {
  id: string
  name: string
  logoUrl: string
}

export interface PayerClearingHouseItem {
  id: string
  name: string
}

export interface CreatePayerDto {
  name: string
  source: string
  logo: string
  phone: string
  email: string
  externalId: string
  groupNumber: string
  addressLine1: string
  addressLine2: string
  city: string
  stateId: string
  zipCode: string
  clearingHouseId: string
  description: string
}

export interface UpdatePayerDto {
  id: string
  name: string
  source: string
  sourceReferenceId: string
  logo: string
  phone: string
  email: string
  externalId: string
  groupNumber: string
  addressLine1: string
  addressLine2: string
  city: string
  stateId: string
  zipCode: string
  clearingHouseId: string
  description: string
}

export interface ListPayersQueryDto {
  filters?: string[]
  page?: number
  pageSize?: number
}
