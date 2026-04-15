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
  allowedDays: string
  allowedSubEvents: string
  billable: boolean
  color: string
  maxNumberLocations: number
  requiredBillingCode: boolean
  requiredSignature: boolean
  requiredPriorAuthorization: boolean
  requiredDataCollection: boolean
  requiredLocation: boolean
  requiredUser: boolean
  invoiceable: boolean
  leadTimeId: string
  lagTimeId: string
  startTime: string
  endTime: string
  allowOverlapping: boolean
  maxDurationConsecutiveDaysClient: number
  maxDurationConsecutiveDaysProvider: number
  maxDurationEvent: number
  maxDurationPerDayProvider: number
  maxDurationPerDayClient: number
  maxDurationPerWeekClient: number
  maxDurationPerWeekProvider: number
  minDuration: number
  showEventInfo: boolean
  showPreview: boolean
  active: boolean
  roundingFunction: "Round" | "Floor" | "Ceil"
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
  allowedDays: string
  allowedSubEvents: string
  billable: boolean
  color: string
  maxNumberLocations: number
  requiredBillingCode: boolean
  requiredSignature: boolean
  requiredPriorAuthorization: boolean
  requiredDataCollection: boolean
  requiredLocation: boolean
  requiredUser: boolean
  invoiceable: boolean
  leadTimeId: string
  lagTimeId: string
  startTime: string
  endTime: string
  allowOverlapping: boolean
  maxDurationConsecutiveDaysClient: number
  maxDurationConsecutiveDaysProvider: number
  maxDurationEvent: number
  maxDurationPerDayProvider: number
  maxDurationPerDayClient: number
  maxDurationPerWeekClient: number
  maxDurationPerWeekProvider: number
  minDuration: number
  showEventInfo: boolean
  showPreview: boolean
  active: boolean
  roundingFunction: "Round" | "Floor" | "Ceil"
  billingCodes: string[]
}
