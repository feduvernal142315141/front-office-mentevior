export const PAYER_SOURCE = {
  CATALOG: "catalog",
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
  /** Embedded rates for this specific plan */
  payerRates?: PayerRateEmbed[]
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
  /** Embedded plans — present only on GET /payers/{id} */
  payerPlans?: PayerPlanEmbed[]
  /** Enrollments de Claim.MD — presentes sólo en GET /payers/{id} (contrato 2026-08-29) */
  claimMdEnrollments?: ClaimMdEnrollment[]
  /** Legacy embedded plan fallback */
  payerPlan?: PayerPlanEmbed | null
  /** Legacy embedded rates fallback */
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

export interface PayerCatalogSearchItem {
  clearingHouseId: string
  externalPayerId: string
  catalogName: string
  alternateNames?: string[]
  professionalClaims?: boolean
  institutionalClaims?: boolean
  dentalClaims?: boolean
  eligibilityStatus?: string
  eraStatus?: string
  attachmentsStatus?: string
  payerType?: string
  payerState?: string
}

export interface SearchPayerCatalogQuery {
  searchText: string
  payerState?: string
  page?: number
  pageSize?: number
}

export interface PayerPlanPayload {
  id?: string
  planName: string
  planTypeId: string
  comments: string
  payerRates?: PayerRatePayload[]
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
  payerPlans?: PayerPlanPayload[]
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
  payerPlans?: PayerPlanPayload[]
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

// ============================================
// CLAIM.MD PROVIDER ENROLLMENT (contrato 2026-08-29)
// ============================================

/** Estado normalizado local del enrollment. */
export type ClaimMdEnrollmentStatus =
  | "REQUESTED"
  | "ENROLLED"
  | "RECEIVED"
  | "COMPLETED"
  | "REJECTED"
  | "UNKNOWN"

/** Estado del procesamiento local del webhook de Claim.MD. */
export type ClaimMdEnrollmentProcessingStatus =
  | "REQUESTED"
  | "MATCHED"
  | "UNMATCHED"
  | "IGNORED"
  | "INVALID"

export const CLAIM_MD_ENROLLMENT_STATUSES: readonly ClaimMdEnrollmentStatus[] = [
  "REQUESTED",
  "ENROLLED",
  "RECEIVED",
  "COMPLETED",
  "REJECTED",
  "UNKNOWN",
]

export const CLAIM_MD_ENROLLMENT_PROCESSING_STATUSES: readonly ClaimMdEnrollmentProcessingStatus[] = [
  "REQUESTED",
  "MATCHED",
  "UNMATCHED",
  "IGNORED",
  "INVALID",
]

/** Enrollment embebido en `GET /payers/{id}`. Ya no hay endpoint de listado propio. */
export interface ClaimMdEnrollment {
  id: string
  payerExternalId: string
  /** Lo asigna Claim.MD por webhook: es `null` hasta que llega. */
  enrollId: string | null
  enrollType: string
  status: ClaimMdEnrollmentStatus | null
  /** Estado original de Claim.MD, sin normalizar. */
  externalStatus: string | null
  processingStatus: ClaimMdEnrollmentProcessingStatus | null
  providerNpi: string | null
  providerId: string | null
  eventDetail: string | null
  requestedAt: string | null
  lastEventAt: string | null
  completedAt: string | null
  rejectedAt: string | null
}

/**
 * Respuesta de `POST /payers/{payerId}/claim-md-enrollments`.
 *
 * `enrollmentUrl` es de un solo uso y **sólo llega aquí**: no vuelve en
 * `GET /payers/{id}`. Si se pierde hay que iniciar otro enrollment.
 */
export interface ClaimMdEnrollmentStartResult {
  id: string
  payerId: string
  payerExternalId: string
  enrollType: string
  status: ClaimMdEnrollmentStatus | null
  processingStatus: ClaimMdEnrollmentProcessingStatus | null
  providerNpi: string | null
  enrollmentUrl: string
  requestedAt: string | null
}
