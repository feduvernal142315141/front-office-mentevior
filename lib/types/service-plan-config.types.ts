import type { EventTimeField } from "./appointment-config.types"

/** Respuesta del GET /service-plan-config */
export interface ServicePlanConfig {
  id: string
  servicePlanName: string
  servicePlanDescription: string
  allowChangeUser: boolean
  allowCreateByUser: boolean
  allowEditByUser: boolean
  allowNewLocation: boolean
  allowSignature: boolean
  allowedCredentials: boolean
  color: string
  maxNumberLocations: number
  requiredBillingCode: boolean
  requiredSignature: boolean
  requiredPriorAuthorization: boolean
  requiredLocation: boolean
  requiredUser: boolean
  startTime: EventTimeField
  endTime: EventTimeField
  allowOverlapping: boolean
  maxAllowedDaysClient: number
  maxAllowedDaysProvider: number
  maxDurationEvent: number
  maxDurationPerDayProvider: number
  maxDurationPerDayClient: number
  maxDurationPerWeekClient: number
  maxDurationPerWeekProvider: number
  minDuration: number
  showEventInfo: boolean
  showPreview: boolean
  billingCodes: string[]
  active: boolean
}

/** PUT /service-plan-config — id opcional: sin id = create, con id = update */
export interface UpsertServicePlanConfigDto {
  id?: string
  servicePlanName: string
  servicePlanDescription: string
  allowChangeUser: boolean
  allowCreateByUser: boolean
  allowEditByUser: boolean
  allowNewLocation: boolean
  allowSignature: boolean
  allowedCredentials: boolean
  color: string
  maxNumberLocations: number
  requiredBillingCode: boolean
  requiredSignature: boolean
  requiredPriorAuthorization: boolean
  requiredLocation: boolean
  requiredUser: boolean
  startTime: EventTimeField
  endTime: EventTimeField
  allowOverlapping: boolean
  maxAllowedDaysClient: number
  maxAllowedDaysProvider: number
  maxDurationEvent: number
  maxDurationPerDayProvider: number
  maxDurationPerDayClient: number
  maxDurationPerWeekClient: number
  maxDurationPerWeekProvider: number
  minDuration: number
  showEventInfo: boolean
  showPreview: boolean
  billingCodes: string[]
  active: boolean
}
