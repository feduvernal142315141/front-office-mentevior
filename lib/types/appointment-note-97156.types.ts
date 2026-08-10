import type {
  AppointmentNoteCategory,
  AppointmentNoteParticipant,
  AppointmentNoteParticipantPayload,
  AppointmentNoteTeachingMethod,
  NoteStatus,
  UpdateAppointmentNoteDataCollectionItem,
} from "./appointment-note.types"

/** Caregiver as returned in the GET 97156 response */
export interface AppointmentNote97156Caregiver {
  id: string
  fullName: string
  relationshipId: string
  relationshipName: string
}

/** Intervention item in the GET 97156 response */
export interface AppointmentNote97156Intervention {
  id: string
  name: string
}

/** GET /appointment/{appointmentId}/note/97156 response */
export interface AppointmentNote97156 {
  id: string
  appointmentId: string
  teachingMethod: AppointmentNoteTeachingMethod | null
  modality: { id: string; name: string } | null
  reasonCaregiverNotPresent: string
  medicalConcerns: string
  crisisInvolved: boolean
  // Session participants
  caregivers: AppointmentNote97156Caregiver[]
  clientPresent: boolean
  // Interventions
  interventions: AppointmentNote97156Intervention[]
  // Session summary
  goals: string
  sessionSummary: string
  // Data collection (categories)
  categories: AppointmentNoteCategory[]
  // Signatures
  caregiverSignatureImage: string | null
  caregiverSignatureChecked: boolean | null
  clientCaregiver: AppointmentNote97156Caregiver | null
  useCheckmarkSignature: boolean
  // Status
  noteStatus: NoteStatus
  blocked: boolean
  notCanEdit: boolean
  // Participants
  participants: AppointmentNoteParticipant[]
  // Context
  provider: {
    name: string
    credential: string
    npi: string
    mpi: string
    sign: string
  } | null
  recipient: {
    name: string
    dateOfBirth: string
    insuranceNumber: string
    diagnosis: string
  } | null
  serviceDetails: {
    date: string | null
    placeOfService: string | null
    timeInOut: string | null
    hours: string | null
  } | null
  billingCodes: string | null
}

/** PUT /appointment/note/97156 request body */
export interface UpdateAppointmentNote97156Payload {
  id: string
  teachingMethodId?: string | null
  modalityId?: string | null
  reasonCaregiverNotPresent?: string
  medicalConcerns?: string
  crisisInvolved?: boolean
  caregiverIds?: string[]
  clientPresent?: boolean
  interventionIds?: string[]
  goals?: string
  sessionSummary?: string
  dataCollectionItems?: UpdateAppointmentNoteDataCollectionItem[]
  participants?: AppointmentNoteParticipantPayload[]
  caregiverSignatureImage?: string | null
  providerSignatureImage?: string | null
  caregiverSignatureChecked?: boolean | null
  clientCaregiverId?: string | null
}

/** Client-side form state for 97156 */
export interface SessionNote97156FormData {
  noteId: string
  teachingMethodId: string
  modalityId: string
  reasonCaregiverNotPresent: string
  medicalConcerns: string
  crisisInvolved: boolean
  participantIds: string[]
  // Session participants
  caregiverIds: string[]
  clientPresent: boolean
  // Interventions
  interventionIds: string[]
  // Session summary
  goals: string
  sessionSummary: string
  // Data collection
  categoryItems: Record<string, { value: number | null; environmentalChange: string }>
}
