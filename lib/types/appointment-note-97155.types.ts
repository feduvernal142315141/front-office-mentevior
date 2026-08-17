import type {
  AppointmentNoteClientCaregiver,
  AppointmentNoteParticipant,
  AppointmentNoteParticipantPayload,
  NoteStatus,
} from "./appointment-note.types"

export interface CatalogItem {
  id: string
  name: string
}

/** GET /appointment/{appointmentId}/note/97155 response */
export interface AppointmentNote97155 {
  id: string
  appointmentId: string
  modality: CatalogItem | null
  reasonCaregiverNotPresent: string
  medicalConcerns: string
  crisisInvolved: boolean
  // Face-to-face protocol observation
  faceToFaceProtocol: CatalogItem | null
  faceToFaceProtocolShow: boolean
  faceToFaceProtocolNarrative: string
  // Protocol adjustments
  protocolAdjustments: CatalogItem[]
  protocolAdjustmentsShow: boolean
  adjustmentsNarrative: string
  // QHP implementation
  qhpImplementation: CatalogItem | null
  qhpImplementationShow: boolean
  qhpNarrative: string
  // Supervision / active direction
  technicianNameAndCredentials: string
  activeDirections: CatalogItem[]
  /**
   * Derivado por el backend: true sii el appointment 97155 tiene un
   * AppointmentSubEvent activo. No es editable — el PUT responde 422 si el
   * payload contradice este valor, así que siempre se reenvía tal cual llegó.
   */
  activeDirectionActivitiesShow: boolean
  activeDirectionNarrative: string
  // Signatures
  caregiverSignatureImage: string | null
  caregiverSignatureChecked: boolean | null
  clientCaregiver: AppointmentNoteClientCaregiver | null
  useCheckmarkSignature: boolean
  // Status
  noteStatus: NoteStatus
  blocked: boolean
  notCanEdit: boolean
  // Participants
  participants: AppointmentNoteParticipant[]
  // Provider signature
  provider: {
    name: string
    credential: string
    npi: string
    mpi: string
    sign: string
  } | null
  /**
   * Provider del sub-event de supervisión, es decir el técnico que recibió la
   * dirección activa. `null` cuando el appointment no tiene sub-event activo.
   * Con esto se precarga "Technician's Name and Credentials".
   */
  supervisionProvider: {
    name: string
    credential: string
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

/** PUT /appointment/note/97155 request body */
export interface UpdateAppointmentNote97155Payload {
  id: string
  modalityId?: string | null
  reasonCaregiverNotPresent?: string
  medicalConcerns?: string
  crisisInvolved?: boolean
  participants?: AppointmentNoteParticipantPayload[]
  // Face-to-face protocol
  faceToFaceProtocolId?: string | null
  faceToFaceProtocolShow: boolean
  faceToFaceProtocolNarrative?: string
  // Protocol adjustments
  protocolAdjustmentIds?: string[]
  protocolAdjustmentsShow: boolean
  adjustmentsNarrative?: string
  // QHP implementation
  qhpImplementationId?: string | null
  qhpImplementationShow: boolean
  qhpNarrative?: string
  // Active direction
  technicianNameAndCredentials?: string
  activeDirectionIds?: string[]
  /** Debe coincidir con el valor derivado que devolvió el GET (422 si no). */
  activeDirectionActivitiesShow: boolean
  activeDirectionNarrative?: string
  // Signatures
  caregiverSignatureImage?: string | null
  providerSignatureImage?: string | null
  caregiverSignatureChecked?: boolean | null
  clientCaregiverId?: string | null
}

/** Client-side form state for 97155 */
export interface SessionNote97155FormData {
  noteId: string
  modalityId: string
  reasonCaregiverNotPresent: string
  medicalConcerns: string
  crisisInvolved: boolean
  participantIds: string[]
  // Face-to-face protocol
  faceToFaceProtocolShow: boolean
  faceToFaceProtocolId: string
  faceToFaceProtocolNarrative: string
  // Protocol adjustments
  protocolAdjustmentsShow: boolean
  protocolAdjustmentIds: string[]
  adjustmentsNarrative: string
  // QHP implementation
  qhpImplementationShow: boolean
  qhpImplementationId: string
  qhpNarrative: string
  // Active direction
  activeDirectionActivitiesShow: boolean
  technicianNameAndCredentials: string
  activeDirectionIds: string[]
  activeDirectionNarrative: string
}
