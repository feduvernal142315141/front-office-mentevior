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

/** Embedded plan returned by GET /payers/{id} */
export interface PayerPlanEmbed {
  id: string
  planName: string
  planTypeId: string
  planTypeName?: string
  comments?: string
  active?: boolean
}

/** Embedded rate returned by GET /payers/{id} */
export interface PayerRateEmbed {
  id: string
  payerId: string
  amount: number
  submitAmount?: number | null
  intervalType: string
  currencyId: string
  currencyCode?: string
  currencyName?: string
  alias?: string
  startDate?: string | null
  endDate?: string | null
  billingCodeId: string
  billingCode?: string
  billingModifier?: string
  billingCodeType?: string
  billingCodeTypeName?: string
  billingCodeTypeCode?: string
  active?: boolean
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
  /** Embedded plan — present only on GET /payers/{id} */
  payerPlan?: PayerPlanEmbed | null
  /** Embedded rates — present only on GET /payers/{id} */
  payerRates?: PayerRateEmbed[]
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

export interface PayerPlanPayload {
  id?: string
  planName: string
  planTypeId: string
  comments: string
}

export interface PayerRatePayload {
  id?: string
  billingCodeId: string
  amount: number
  submitAmount?: number
  intervalType: string
  currencyId: string
  alias?: string
  startDate?: string
  endDate?: string
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
  payerPlan?: PayerPlanPayload
  payerRates?: PayerRatePayload[]
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
  payerPlan?: PayerPlanPayload
  payerRates?: PayerRatePayload[]
}

export interface ListPayersQueryDto {
  filters?: string[]
  page?: number
  pageSize?: number
}

/** In-memory rate entry for local state management on create/edit pages */
export interface LocalInsurancePlanRate {
  _tempId: string
  /** Present only for existing rates from backend */
  id?: string
  billingCodeId: string
  billingCodeLabel: string
  billingModifier?: string
  amount: number
  submitAmount?: number
  intervalType: string
  currencyId: string
  currencyLabel: string
  alias?: string
  startDate?: string
  endDate?: string
}
