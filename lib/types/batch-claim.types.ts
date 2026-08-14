// ============================================
// BATCH CLAIM TYPES
// Types for the Billed Claims (BatchClaim) module
// ============================================

/** Row from GET /batch-claims (paginated list) */
export interface BatchClaimSummary {
  id: string
  payerPlanId: string
  payerPlanName: string
  payerId: string
  payerName: string
  reference: string
  comments: string
  createAt: string
  active: boolean
}

/** Service line inside a client group — GET /batch-claims/{id} */
export interface BatchClaimAppointmentDetail {
  appointmentId: string
  date: string
  placeOfService: string
  billingCode: string
  primaryDiagnosis: string
  units: number
  /** null when no applicable PayerRate exists for the appointment date */
  rate: number | null
  /** null when rate is null */
  submitAmount: number | null
}

/** Appointments grouped by clientId + priorAuthorizationId + insuranceId */
export interface BatchClaimClientGroup {
  clientId: string
  clientName: string
  payerName: string
  priorAuthorizationNumber: string
  memberNumber: string
  appointmentDetails: BatchClaimAppointmentDetail[]
}

/** Full batch from GET /batch-claims/{batchClaimId} */
export interface BatchClaim {
  id: string
  payerPlanId: string
  payerPlanName: string
  payerId: string
  payerName: string
  reference: string
  comments: string
  createAt: string
  active: boolean
  /** Selección vigente del batch; los appointments de abajo se derivan de estos */
  serviceLogIds: string[]
  appointments: BatchClaimClientGroup[]
}

/** Appointment nested inside an eligible service log */
export interface EligibleServiceLogAppointment {
  appointmentId: string
  appointmentNoteId: string
  date: string
  timeInit: string
  timeEnd: string
  billingCodeId: string
  priorAuthorizationId: string
  cantUnit: number
  units: number
}

/** Row from GET /batch-claims/service-logs (eligible service logs) */
export interface EligibleServiceLog {
  id: string
  clientId: string
  clientName: string
  providerId: string
  providerName: string
  /** `yyyy-MM-dd` (recortado del timestamp ISO del backend) */
  initDate: string
  /** `yyyy-MM-dd` */
  endDate: string
  appointments: EligibleServiceLogAppointment[]
}

/** Query for GET /batch-claims/service-logs */
export interface EligibleServiceLogsQuery {
  payerPlanId: string
  initDate: string
  endDate: string
  clientId?: string
}

/** Body for POST /batch-claims and PUT /batch-claims/{id} */
export interface BatchClaimPayload {
  payerPlanId: string
  reference: string
  comments: string
  /** En PUT reemplaza completamente la selección anterior */
  serviceLogIds: string[]
}

/** Response of GET /batch-claims/{id}/837p */
export interface BatchClaim837PFile {
  fileName: string
  fileBase64: string
}
