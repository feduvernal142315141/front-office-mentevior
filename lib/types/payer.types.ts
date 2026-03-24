export const PAYER_SOURCE = {
  CATALOG: "catalog",
  FL_MEDICAID: "fl-medicaid",
  MANUAL: "manual",
} as const

export type PayerSource = (typeof PAYER_SOURCE)[keyof typeof PAYER_SOURCE]

export const PLAN_TYPE_STATUS = {
  VALID: "valid",
  DEPRECATED: "deprecated",
} as const

export type PlanTypeStatus = (typeof PLAN_TYPE_STATUS)[keyof typeof PLAN_TYPE_STATUS]

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
  externalId: string
  groupNumber: string
  addressLine1: string
  addressLine2?: string
  city: string
  stateId: string
  stateName?: string
  zipCode: string
  planTypeId: string
  planNotes: string
  planTypeName?: string
  active?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface PayerCatalogItem {
  id: string
  name: string
  logoUrl: string
}

export interface PayerPlanTypeItem {
  id: string
  name: string
  status: PlanTypeStatus
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
  planTypeId: string
  planNotes: string
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
  planTypeId: string
  planNotes: string
}

export interface ListPayersQueryDto {
  search: string
}
