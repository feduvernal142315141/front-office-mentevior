/** Respuesta del GET /appointment_config */
export interface AppointmentConfig {
  id: string
  appointmentName: string
  appointmentDescription: string
  maxNumberLocations: number
  requiredBillingCode: boolean
  requiredSignature: boolean
  allowSubEvents: string
  requiredPriorAuthorization: boolean
  leadTimeId: string
  lagTimeId: string
  startTime: string
  endTime: string
  allowOverlapping: boolean
  maxDurationPerProvider: number
  maxDurationPerClient: number
  maxDurationRBTAndAnalyst: number
  maxConsecutiveDaysOfWork: number
  color: string
  billingCodes: string[]
}

/** PUT /appointment_config — id opcional: sin id = create, con id = update */
export interface UpsertAppointmentConfigDto {
  id?: string
  appointmentName: string
  appointmentDescription: string
  maxNumberLocations: number
  requiredBillingCode: boolean
  requiredSignature: boolean
  allowSubEvents: string
  requiredPriorAuthorization: boolean
  leadTimeId: string
  lagTimeId: string
  startTime: string
  endTime: string
  allowOverlapping: boolean
  maxDurationPerProvider: number
  maxDurationPerClient: number
  maxDurationRBTAndAnalyst: number
  maxConsecutiveDaysOfWork: number
  color: string
  billingCodes: string[]
}
