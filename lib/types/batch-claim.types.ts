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
  appointments: BatchClaimClientGroup[]
}

/** Row from GET /batch-claims/appointments (eligible appointments) */
export interface EligibleAppointment {
  id: string
  appointmentNoteId: string
  clientId: string
  clientName: string
  providerId: string
  date: string
  timeInit: string
  timeEnd: string
  billingCodeId: string
  priorAuthorizationId: string
  cantUnit: number
  units: number
}

/** Query for GET /batch-claims/appointments */
export interface EligibleAppointmentsQuery {
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
  appointmentIds: string[]
}

/** Response of GET /batch-claims/{id}/837p */
export interface BatchClaim837PFile {
  fileName: string
  fileBase64: string
}
