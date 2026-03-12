export interface AccountProfile {
  id: string
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
  chartPrefix: string
  chartStartNumber: number
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
  chartPrefix: string
  chartStartNumber: number
}

export interface AccountProfileResponse {
  success: boolean
  data: AccountProfile
  message?: string
}
