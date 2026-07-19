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
  memberUserTypeId: string | null
  memberUserTypeName: string | null
  relationshipId: string | null
  relationshipName: string | null
}

/** Intervention item (antecedent or consequence) */
export interface AppointmentNoteIntervention {
  id: string
  name: string
}

/** A single item within a category (goal/program) */
export interface AppointmentNoteCategoryItem {
  id: string
  name: string
  dataCollectionId: string | null
  value: number | null
}

/** A category grouping items from the service plan */
export interface AppointmentNoteCategory {
  id: string
  name: string
  items: AppointmentNoteCategoryItem[]
}

/** Full appointment note response from GET /appointment/{id}/note */
export interface AppointmentNote {
  id: string
  appointmentId: string
  teachingMethod: AppointmentNoteTeachingMethod | null
  reasonCaregiverNotPresent: string
  medicalConcerns: string
  crisisInvolved: boolean
  sessionSummary: string
  participants: AppointmentNoteParticipant[]
  antecedentInterventionList: AppointmentNoteIntervention[]
  consequenceInterventionList: AppointmentNoteIntervention[]
  categories: AppointmentNoteCategory[]
}

/** Participant payload for PUT /appointment/note */
export interface AppointmentNoteParticipantPayload {
  memberUserTypeId: string | null
  relationshipId: string | null
}

/** Request body for PUT /appointment/note */
export interface UpdateAppointmentNotePayload {
  id: string
  teachingMethodId?: string | null
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
