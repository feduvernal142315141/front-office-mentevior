export interface ServicePlanConfig {
  id: string
  servicePlanName: string
  servicePlanDescription: string
  requiredBillingCode: boolean
  requiredPriorAuthorization: boolean
  billable: boolean
  maxBillingCode: number
  color: string
  billingCodes: string[]
  credentials: string[]
}

export interface UpsertServicePlanConfigDto {
  id?: string
  servicePlanName: string
  servicePlanDescription: string
  requiredBillingCode: boolean
  requiredPriorAuthorization: boolean
  billable: boolean
  maxBillingCode: number
  color: string
  billingCodes: string[]
  credentials: string[]
}
