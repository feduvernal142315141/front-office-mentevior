import type { AppointmentNoteCategory } from "@/lib/types/appointment-note.types"

export interface CategoryItemFormDataMap {
  [itemId: string]: { value: number | null; environmentalChange: string }
}

/** The backend requires a numeric `value` per item, so items without one yet are left out. */
function buildDataCollectionItems(categories: AppointmentNoteCategory[], categoryItems: CategoryItemFormDataMap) {
  return categories.flatMap((cat) =>
    cat.items
      .map((item) => {
        const edited = categoryItems[item.id]
        const value = edited?.value ?? item.value
        const environmentalChange = (edited?.environmentalChange ?? item.environmentalChange ?? "").trim()
        return { target: item.name, value, environmentalChange: environmentalChange || null }
      })
      .filter((item): item is { target: string; value: number; environmentalChange: string | null } => item.value != null),
  )
}

/** Metadata for CPT 97153 — `summaryType` omitted */
export function buildSessionSummaryMetadata97153(params: {
  teachingMethodName: string
  modalityName: string
  reasonCaregiverNotPresent: string
  medicalConcerns: string
  crisisInvolved: boolean
  participantNames: string[]
  antecedentNames: string[]
  consequenceNames: string[]
  categories: AppointmentNoteCategory[]
  categoryItems: CategoryItemFormDataMap
}) {
  return {
    teachingMethod: params.teachingMethodName,
    modality: params.modalityName,
    reasonCaregiverNotPresent: params.reasonCaregiverNotPresent,
    medicalConcerns: params.medicalConcerns,
    crisisInvolved: params.crisisInvolved,
    participants: params.participantNames,
    antecedentInterventions: params.antecedentNames,
    consequenceInterventions: params.consequenceNames,
    dataCollectionItems: buildDataCollectionItems(params.categories, params.categoryItems),
  }
}

/** Metadata for CPT 97156 — `summaryType` omitted */
export function buildSessionSummaryMetadata97156(params: {
  teachingMethodName: string
  modalityName: string
  reasonCaregiverNotPresent: string
  medicalConcerns: string
  crisisInvolved: boolean
  caregiverNames: string[]
  clientPresent: boolean
  interventionNames: string[]
  goals: string
  participantNames: string[]
  categories: AppointmentNoteCategory[]
  categoryItems: CategoryItemFormDataMap
}) {
  return {
    teachingMethod: params.teachingMethodName,
    modality: params.modalityName,
    reasonCaregiverNotPresent: params.reasonCaregiverNotPresent,
    medicalConcerns: params.medicalConcerns,
    crisisInvolved: params.crisisInvolved,
    caregivers: params.caregiverNames,
    clientPresent: params.clientPresent,
    interventions: params.interventionNames,
    goals: params.goals,
    participants: params.participantNames,
    dataCollectionItems: buildDataCollectionItems(params.categories, params.categoryItems),
  }
}

interface General97155 {
  modalityName: string
  reasonCaregiverNotPresent: string
  medicalConcerns: string
  crisisInvolved: boolean
  participantNames: string[]
}

function buildGeneral97155(g: General97155) {
  return {
    modality: g.modalityName,
    reasonCaregiverNotPresent: g.reasonCaregiverNotPresent,
    medicalConcerns: g.medicalConcerns,
    crisisInvolved: g.crisisInvolved,
    participants: g.participantNames,
  }
}

/**
 * The 97155 example payloads also carry richer per-section fields (affected
 * programs/targets, action taken, documented rationale/implications, technician
 * & client responses, etc.) that the current form doesn't collect — only the
 * fields the UI actually captures are sent below.
 */
export function buildFaceToFaceMetadata(params: General97155 & { faceToFaceProtocolName: string }) {
  return {
    general: buildGeneral97155(params),
    section: {
      faceToFaceProtocol: params.faceToFaceProtocolName,
    },
  }
}

export function buildProtocolAdjustmentsMetadata(params: General97155 & { protocolAdjustmentNames: string[] }) {
  return {
    general: buildGeneral97155(params),
    section: {
      protocolAdjustments: params.protocolAdjustmentNames,
    },
  }
}

export function buildQhpImplementationMetadata(params: General97155 & { qhpImplementationName: string }) {
  return {
    general: buildGeneral97155(params),
    section: {
      qhpImplementation: params.qhpImplementationName,
    },
  }
}

export function buildActiveDirectionMetadata(params: General97155 & {
  technicianNameAndCredentials: string
  activeDirectionActivityNames: string[]
}) {
  return {
    general: buildGeneral97155(params),
    section: {
      technicianNameAndCredentials: params.technicianNameAndCredentials,
      activeDirectionActivities: params.activeDirectionActivityNames,
    },
  }
}
