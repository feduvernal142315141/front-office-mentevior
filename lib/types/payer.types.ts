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

export interface PayerAddress {
  line1: string
  city: string
  state: string
  zipCode: string
}

export interface PayerBaseFormFields {
  name: string
  phone: string
  email: string
  memberId: string
  groupNumber: string
  address: PayerAddress
}

export interface Payer {
  id: string
  source: PayerSource
  sourceLabel: string
  logoUrl: string
  createdAt: string
  updatedAt: string
  planTypeId: string
  planTypeName: string
  notes: string
  form: PayerBaseFormFields
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
  source: PayerSource
  sourceReferenceId: string
  form: PayerBaseFormFields
}

export interface UpdatePayerDto {
  payerId: string
  form: PayerBaseFormFields
}

export interface UpdatePayerPlanDto {
  payerId: string
  planTypeId: string
  notes: string
}

export interface ListPayersQueryDto {
  search: string
}
