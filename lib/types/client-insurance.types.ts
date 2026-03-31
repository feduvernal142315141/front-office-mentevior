export type InsuranceRelationship = "Self" | "Spouse" | "Child" | "Other"

export interface ClientInsurance {
  id: string
  clientId: string
  payerId: string
  payerName: string
  payerLogoUrl?: string | null
  memberNumber: string
  groupNumber?: string
  relationship: InsuranceRelationship
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
  isActive: boolean
  isPrimary: boolean
  effectiveDate: string
  terminationDate?: string
  comments?: string
}
