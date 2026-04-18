export interface EventTimeField {
  code: "AM" | "PM"
  value: string
}

/** Respuesta del GET /appointment-config */
export interface AppointmentConfig {
  id: string
  appointmentName: string
  appointmentDescription: string
  allowChangeUser: boolean
  allowCreateByUser: boolean
  allowEditByUser: boolean
  allowNewLocation: boolean
  allowSignature: boolean
  allowedCredentials: boolean
  allowedSubEvents: string | null
  color: string
  maxNumberLocations: number
  requiredBillingCode: boolean
  requiredSignature: boolean
  requiredPriorAuthorization: boolean
  requiredDataCollection: boolean
  requiredLocation: boolean
  requiredUser: boolean
  leadTimeId: string
  lagTimeId: string
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
  active: boolean
  billingCodes: string[]
}

/** PUT /appointment-config — id opcional: sin id = create, con id = update */
export interface UpsertAppointmentConfigDto {
  id?: string
  appointmentName: string
  appointmentDescription: string
  allowChangeUser: boolean
  allowCreateByUser: boolean
  allowEditByUser: boolean
  allowNewLocation: boolean
  allowSignature: boolean
  allowedCredentials: boolean
  allowedSubEvents: string | null
  color: string
  maxNumberLocations: number
  requiredBillingCode: boolean
  requiredSignature: boolean
  requiredPriorAuthorization: boolean
  requiredDataCollection: boolean
  requiredLocation: boolean
  requiredUser: boolean
  leadTimeId: string
  lagTimeId: string
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
  active: boolean
  billingCodes: string[]
}
