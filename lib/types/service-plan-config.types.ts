export interface ServicePlanConfig {
  id: string
  name: string
  description: string
  billingCodeIds: string[]
  requireBillingCode: boolean
  credentialIds: string[]
  billable: boolean
  requirePriorAuthorization: boolean
  maxBillingCodes: number
  color: string
}

export interface UpsertServicePlanConfigDto {
  id?: string
  name: string
  description: string
  billingCodeIds: string[]
  requireBillingCode: boolean
  credentialIds: string[]
  billable: boolean
  requirePriorAuthorization: boolean
  maxBillingCodes: number
  color: string
}
