export interface ServiceBillingCode {
  id: string
  type: string
  code: string
  modifier?: string
  description: string
}

export interface ServiceCredential {
  id: string
  name: string
}

export interface CompanyService {
  id: string
  name: string
  description: string
  active: boolean
  allowedCredentials: ServiceCredential[]
  allowedBillingCodes: ServiceBillingCode[]
}

export interface CompanyServiceListItem {
  id: string
  name: string
  description: string
  active: boolean
  allowedCredentials: ServiceCredential[]
  allowedBillingCodes: ServiceBillingCode[]
}

export interface ToggleCompanyServiceStatusDto {
  id: string
  active: boolean
}
