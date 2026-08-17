export type InsuranceRelationship = "Self" | "Spouse" | "Child" | "Other"

/**
 * Drives the CMS-1500 Item 1 checkbox: COMERCIAL → Group Health Plan, MEDICAID → Medicaid.
 * Rows created before 2026-08-15 can come back as null (backend falls back to PayerPlan.planType).
 */
export type ClientInsuranceType = "COMERCIAL" | "MEDICAID"

export interface ClientInsurance {
  id: string
  clientId: string
  payerId: string
  payerName: string
  payerLogoUrl?: string | null
  memberNumber: string
  groupNumber?: string
  relationship: InsuranceRelationship
  type: ClientInsuranceType | null
  isActive: boolean
  isPrimary: boolean
  effectiveDate: string
  terminationDate?: string
  comments?: string
  createdAt: string
  updatedAt: string
}

export interface CreateClientInsuranceDto {
  clientId: string
  payerId: string
  memberNumber: string
  groupNumber?: string
  relationship: InsuranceRelationship
  type: ClientInsuranceType
  isActive: boolean
  isPrimary: boolean
  effectiveDate: string
  terminationDate?: string
  comments?: string
}

export interface UpdateClientInsuranceDto {
  id: string
  payerId: string
  memberNumber: string
  groupNumber?: string
  relationship: InsuranceRelationship
  type: ClientInsuranceType
  isActive: boolean
  isPrimary: boolean
  effectiveDate: string
  terminationDate?: string
  comments?: string
}
