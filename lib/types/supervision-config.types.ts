import type { EventTimeField } from "./appointment-config.types"

/** Respuesta del GET /supervision-config */
export interface SupervisionConfig {
  id: string
  supervisionName: string
  supervisionDescription: string
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

/** PUT /supervision-config — id opcional: sin id = create, con id = update */
export interface UpsertSupervisionConfigDto {
  id?: string
  supervisionName: string
  supervisionDescription: string
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
