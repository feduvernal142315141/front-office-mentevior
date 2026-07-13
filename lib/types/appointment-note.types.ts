// ============================================
// APPOINTMENT NOTE TYPES
// Types for the Session Note module
// ============================================

/** Teaching method item in the appointment note response */
export interface AppointmentNoteTeachingMethod {
  id: string
  name: string
}

/** Participant in the appointment note */
export interface AppointmentNoteParticipant {
  id: string
  catalogId: string
  catalogType: "Member User Type" | "Relationship"
  catalogName: string
}

/** Intervention item (antecedent or consequence) */
export interface AppointmentNoteIntervention {
  id: string
  name: string
}

/** Full appointment note response from GET /appointment/{id}/note */
export interface AppointmentNote {
  id: string
  appointmentId: string
  teachingMethodList: AppointmentNoteTeachingMethod[]
  reasonCaregiverNotPresent: string
  medicalConcerns: string
  crisisInvolved: boolean
  sessionSummary: string
  participants: AppointmentNoteParticipant[]
  antecedentInterventionList: AppointmentNoteIntervention[]
  consequenceInterventionList: AppointmentNoteIntervention[]
}

/** Participant payload for PUT /appointment/note */
export interface AppointmentNoteParticipantPayload {
  catalogId: string
  catalogType: "Member User Type" | "Relationship"
}

/** Request body for PUT /appointment/note */
export interface UpdateAppointmentNotePayload {
  id: string
  teachingMethodIds?: string[]
  reasonCaregiverNotPresent?: string
  medicalConcerns?: string
  crisisInvolved?: boolean
  sessionSummary?: string
  participants?: AppointmentNoteParticipantPayload[]
  antecedentInterventionIds?: string[]
  consequenceInterventionIds?: string[]
}

/** Catalog item for antecedent/consequence interventions */
export interface InterventionCatalogItem {
  id: string
  name: string
}
