// ============================================
// APPOINTMENT NOTE TYPES
// Types for the Session Note module
// ============================================

/** Teaching method item in the appointment note response */
export interface AppointmentNoteTeachingMethod {
  id: string
  name: string
}

/** Participant catalog type */
export type AppointmentNoteParticipantCatalogType = "Relationship" | "Member User Type"

/** Participant in the appointment note GET response */
export interface AppointmentNoteParticipant {
  id: string
  catalogId: string
  catalogType: AppointmentNoteParticipantCatalogType
  catalogName: string
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
  environmentalChange: string | null
  type: string | null
}

/** Summary item from GET /appointment/note (paginated list) */
export interface AppointmentNoteSummary {
  id: string
  appointmentId: string
  clientName: string
  providerName: string
  date: string
  billingCodeId: string
  billingCode: string
}

/** A category grouping items from the service plan */
export interface AppointmentNoteCategory {
  id: string
  name: string
  items: AppointmentNoteCategoryItem[]
}

/** Recipient details (client info) from GET note response */
export interface AppointmentNoteRecipient {
  name: string
  dateOfBirth: string
  insuranceNumber: string
  diagnosis: string
}

/** Provider details from GET note response */
export interface AppointmentNoteProvider {
  name: string
  credential: string
  npi: string
  mpi: string
}

/** Service details resolved from the appointment */
export interface AppointmentNoteServiceDetails {
  date: string | null
  placeOfService: string | null
  timeInOut: string | null
  hours: string | null
}

/** Modality from GET note response */
export interface AppointmentNoteModality {
  id: string
  name: string
}

/** Full appointment note response from GET /appointment/{id}/note */
export interface AppointmentNote {
  id: string
  appointmentId: string
  recipient: AppointmentNoteRecipient | null
  provider: AppointmentNoteProvider | null
  serviceDetails: AppointmentNoteServiceDetails | null
  billingCodes: string | null
  modality: AppointmentNoteModality | null
  teachingMethod: AppointmentNoteTeachingMethod | null
  reasonCaregiverNotPresent: string
  medicalConcerns: string
  crisisInvolved: boolean
  sessionSummary: string
  participants: AppointmentNoteParticipant[]
  antecedentInterventionList: AppointmentNoteIntervention[]
  consequenceInterventionList: AppointmentNoteIntervention[]
  categories: AppointmentNoteCategory[]
  useCheckmarkSignature: boolean
  caregiverSignatureImage: string | null
  caregiverSignatureChecked: boolean | null
}

/** Participant payload for PUT /appointment/note */
export interface AppointmentNoteParticipantPayload {
  catalogId: string
  catalogType: AppointmentNoteParticipantCatalogType
}

/** Data collection item payload for PUT /appointment/note */
export interface UpdateAppointmentNoteDataCollectionItem {
  dataCollectionId: string | null
  clientServicePlanCategoryItemId: string
  value: number | null
  environmentalChange: string | null
}

/** Request body for PUT /appointment/note */
export interface UpdateAppointmentNotePayload {
  id: string
  teachingMethodId?: string | null
  modalityId?: string | null
  reasonCaregiverNotPresent?: string
  medicalConcerns?: string
  crisisInvolved?: boolean
  sessionSummary?: string
  participants?: AppointmentNoteParticipantPayload[]
  antecedentInterventionIds?: string[]
  consequenceInterventionIds?: string[]
  dataCollectionItems?: UpdateAppointmentNoteDataCollectionItem[]
  caregiverSignatureImage?: string | null
  caregiverSignatureChecked?: boolean | null
}

/** Catalog item for antecedent/consequence interventions */
export interface InterventionCatalogItem {
  id: string
  name: string
}

/** Participant catalog item from GET /appointment-note-participant/catalogs */
export interface ParticipantCatalogItem {
  id: string
  name: string
  type: AppointmentNoteParticipantCatalogType
}

/** Modality catalog item from GET /modality/catalog */
export interface ModalityCatalogItem {
  id: string
  name: string
}
