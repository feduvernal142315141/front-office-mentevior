/**
 * ACCOUNT PROFILE TYPES
 * 
 * Types for account profile management.
 * Data comes from BO when company is created and syncs bidirectionally.
 * 
 * NOTE: Property names match backend response from /api/company/by-auth-token
 */

export interface AccountProfile {
  id: string
  legalName: string
  agencyEmail: string
  phoneNumber: string
  fax: string
  webSite: string
  ein: string // Employer Identification Number
  npi: string // National Provider ID
  mpi: string // Medicaid/Medicare Provider ID
  taxonomyCode: string
  logo: string
  active: boolean
  createdAt?: string
  updatedAt?: string
}

export interface UpdateAccountProfileDto {
  legalName: string
  agencyEmail: string
  phoneNumber: string
  fax: string
  webSite: string
  ein: string
  npi: string
  mpi: string
  taxonomyCode: string
  logo: string
}

export interface AccountProfileResponse {
  success: boolean
  data: AccountProfile
  message?: string
}
