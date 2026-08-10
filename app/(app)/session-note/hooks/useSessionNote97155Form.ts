"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import type {
  AppointmentNote97155,
  SessionNote97155FormData,
  UpdateAppointmentNote97155Payload,
} from "@/lib/types/appointment-note-97155.types"
import type { AppointmentNoteParticipantPayload } from "@/lib/types/appointment-note.types"
import { useAppointmentNote97155 } from "@/lib/modules/appointment-notes/hooks/use-appointment-note-97155"
import { useAppointmentNote97155Mutation } from "@/lib/modules/appointment-notes/hooks/use-appointment-note-97155-mutation"
import { useModalityCatalog } from "@/lib/modules/appointment-notes/hooks/use-modality-catalog"
import { useParticipantCatalog } from "@/lib/modules/appointment-notes/hooks/use-participant-catalog"
import { use97155Catalogs } from "@/lib/modules/appointment-notes/hooks/use-97155-catalogs"
import { useCaregiversByClient } from "@/lib/modules/caregivers/hooks/use-caregivers-by-client"
import { getAppointmentById } from "@/lib/modules/schedules/services/appointments.service"
import { validateNarrativeLength } from "@/lib/utils/narrative-length"
import { CLIENT_PARTICIPANT_ID } from "./useSessionNoteForm"

const EMPTY_FORM: SessionNote97155FormData = {
  noteId: "",
  modalityId: "",
  reasonCaregiverNotPresent: "",
  medicalConcerns: "",
  crisisInvolved: false,
  participantIds: [CLIENT_PARTICIPANT_ID],
  faceToFaceProtocolShow: false,
  faceToFaceProtocolId: "",
  faceToFaceProtocolNarrative: "",
  protocolAdjustmentsShow: false,
  protocolAdjustmentIds: [],
  adjustmentsNarrative: "",
  qhpImplementationShow: false,
  qhpImplementationId: "",
  qhpNarrative: "",
  activeDirectionActivitiesShow: false,
  technicianNameAndCredentials: "",
  activeDirectionIds: [],
  activeDirectionNarrative: "",
}

/**
 * "Technician's Name and Credentials" describe al técnico que recibió la dirección
 * activa, que es justamente el provider del sub-event de supervisión. El backend lo
 * resuelve en `supervisionProvider`, así que se usa para precargar el campo.
 */
function formatSupervisionProvider(
  supervisionProvider: AppointmentNote97155["supervisionProvider"],
): string {
  if (!supervisionProvider) return ""
  return [supervisionProvider.name, supervisionProvider.credential]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ")
}

function noteToFormData(note: AppointmentNote97155): SessionNote97155FormData {
  return {
    noteId: note.id,
    modalityId: note.modality?.id ?? "",
    reasonCaregiverNotPresent: note.reasonCaregiverNotPresent,
    medicalConcerns: note.medicalConcerns || "N/A",
    crisisInvolved: note.crisisInvolved,
    participantIds: [CLIENT_PARTICIPANT_ID, ...note.participants.map((p) => p.catalogId)],
    faceToFaceProtocolShow: note.faceToFaceProtocolShow,
    faceToFaceProtocolId: note.faceToFaceProtocol?.id ?? "",
    faceToFaceProtocolNarrative: note.faceToFaceProtocolNarrative,
    protocolAdjustmentsShow: note.protocolAdjustmentsShow,
    protocolAdjustmentIds: note.protocolAdjustments.map((a) => a.id),
    adjustmentsNarrative: note.adjustmentsNarrative,
    qhpImplementationShow: note.qhpImplementationShow,
    qhpImplementationId: note.qhpImplementation?.id ?? "",
    qhpNarrative: note.qhpNarrative,
    activeDirectionActivitiesShow: note.activeDirectionActivitiesShow,
    // Lo ya guardado manda; el provider supervisado sólo rellena el campo vacío
    technicianNameAndCredentials:
      note.technicianNameAndCredentials || formatSupervisionProvider(note.supervisionProvider),
    activeDirectionIds: note.activeDirections.map((d) => d.id),
    activeDirectionNarrative: note.activeDirectionNarrative,
  }
}

interface UseSessionNote97155FormProps {
  appointmentId: string | null
  clientId: string | null
}

export function useSessionNote97155Form({ appointmentId, clientId }: UseSessionNote97155FormProps) {
  const { note, isLoading: noteLoading, error: noteError, refetch } = useAppointmentNote97155(appointmentId)
  const mutation = useAppointmentNote97155Mutation()

  // Signatures
  const [providerSignatureImage, setProviderSignatureImage] = useState<string | null>(null)
  const providerSignatureUrl = providerSignatureImage || note?.provider?.sign || null

  const useCheckmarkSignature = note?.useCheckmarkSignature ?? false
  const [caregiverSignatureChecked, setCaregiverChecked] = useState(false)
  const [caregiverSignatureImage, setCaregiverSignatureImage] = useState<string | null>(null)
  const [clientCaregiverId, setClientCaregiverIdState] = useState("")

  useEffect(() => {
    if (!note) return
    if (note.caregiverSignatureChecked != null) setCaregiverChecked(note.caregiverSignatureChecked)
    if (note.caregiverSignatureImage != null) setCaregiverSignatureImage(note.caregiverSignatureImage)
    if (note.clientCaregiver) setClientCaregiverIdState(note.clientCaregiver.id)
  }, [note])

  // Caregivers of the client, for the "signed by" selector.
  // The note can be opened without `clientId` in the URL (e.g. from the session notes table),
  // so fall back to resolving it from the appointment — otherwise the caregiver list is empty.
  const [resolvedClientId, setResolvedClientId] = useState<string | null>(clientId)

  useEffect(() => {
    if (clientId) {
      setResolvedClientId(clientId)
      return
    }
    if (!appointmentId) {
      setResolvedClientId(null)
      return
    }

    let active = true
    void (async () => {
      try {
        const appointment = await getAppointmentById(appointmentId)
        if (active) setResolvedClientId(appointment?.clientId ?? null)
      } catch {
        if (active) setResolvedClientId(null)
      }
    })()

    return () => { active = false }
  }, [clientId, appointmentId])

  const { caregivers: clientCaregivers, isLoading: caregiversLoading } = useCaregiversByClient(resolvedClientId)

  // Catalogs
  const { selectOptions: modalityOptions, isLoading: modalityLoading } = useModalityCatalog()
  const { items: rawParticipantCatalog, isLoading: participantsLoading } = useParticipantCatalog()
  const participantCatalog = useMemo(
    () => [{ id: CLIENT_PARTICIPANT_ID, name: "Client", type: "Relationship" as const }, ...rawParticipantCatalog],
    [rawParticipantCatalog],
  )

  const {
    protocolObservationItems,
    protocolAdjustmentItems,
    qhpImplementationItems,
    activeDirectionItems,
    isLoading: catalogsLoading,
  } = use97155Catalogs()

  const [formData, setFormData] = useState<SessionNote97155FormData>(EMPTY_FORM)

  useEffect(() => {
    if (note) {
      setFormData(noteToFormData(note))
    } else {
      setFormData(EMPTY_FORM)
    }
  }, [note])

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Active caregivers as select options; keep the persisted signer visible even if deactivated
  const signatureCaregiverOptions = useMemo(() => {
    const options = clientCaregivers
      .filter((c) => c.status)
      .map((c) => {
        const name = c.fullName || `${c.firstName} ${c.lastName}`.trim()
        return { value: c.id, label: c.relationship ? `${name} (${c.relationship})` : name }
      })
    const persisted = note?.clientCaregiver
    if (persisted && !options.some((o) => o.value === persisted.id)) {
      options.push({
        value: persisted.id,
        label: persisted.relationshipName ? `${persisted.fullName} (${persisted.relationshipName})` : persisted.fullName,
      })
    }
    return options
  }, [clientCaregivers, note])

  // Single caregiver → pre-select it; the user only chooses when there are several
  useEffect(() => {
    if (signatureCaregiverOptions.length !== 1) return
    setClientCaregiverIdState((prev) => prev || signatureCaregiverOptions[0].value)
  }, [signatureCaregiverOptions])

  const setClientCaregiverId = useCallback((id: string) => {
    setClientCaregiverIdState(id)
    setErrors((prev) => {
      if (!prev.clientCaregiverId) return prev
      const next = { ...prev }
      delete next.clientCaregiverId
      return next
    })
  }, [])

  const updateField = useCallback(
    <K extends keyof SessionNote97155FormData>(field: K, value: SessionNote97155FormData[K]) => {
      // Encender "Active direction" recupera al técnico supervisado si el campo quedó
      // vacío: es la forma de recuperarlo después de borrarlo a mano.
      const isTurningOnActiveDirection = field === "activeDirectionActivitiesShow" && value === true
      const technicianPrefill = isTurningOnActiveDirection
        ? formatSupervisionProvider(note?.supervisionProvider ?? null)
        : ""

      setFormData((prev) => {
        const next = { ...prev, [field]: value }
        if (technicianPrefill && !next.technicianNameAndCredentials.trim()) {
          next.technicianNameAndCredentials = technicianPrefill
        }
        return next
      })
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field as string]
        // La sección se acaba de mostrar/ocultar: un error viejo del técnico ya no aplica
        if (field === "activeDirectionActivitiesShow") delete next.technicianNameAndCredentials
        return next
      })
    },
    [note],
  )

  const handleSubmit = useCallback(async () => {
    if (!formData.noteId || !note) return null

    const status = note.noteStatus
    if (status === "close" || status === "lock") return null

    // Validate required fields
    const newErrors: Record<string, string> = {}
    if (status !== "read") {
      if (!formData.modalityId) newErrors.modalityId = "Select a modality"
      if (formData.participantIds.length === 0) newErrors.participantIds = "Select at least one participant"
      if (!formData.reasonCaregiverNotPresent.trim()) newErrors.reasonCaregiverNotPresent = "This field is required"
      if (!formData.medicalConcerns.trim()) newErrors.medicalConcerns = "This field is required"

      // Conditional validation for toggle sections.
      // El narrative sólo se exige cuando su sección está encendida.
      if (formData.faceToFaceProtocolShow) {
        if (!formData.faceToFaceProtocolId) newErrors.faceToFaceProtocolId = "Select a protocol observation outcome"
        const narrativeError = validateNarrativeLength(formData.faceToFaceProtocolNarrative)
        if (narrativeError) newErrors.faceToFaceProtocolNarrative = narrativeError
      }
      if (formData.protocolAdjustmentsShow) {
        if (formData.protocolAdjustmentIds.length === 0) newErrors.protocolAdjustmentIds = "Select at least one adjustment"
        const narrativeError = validateNarrativeLength(formData.adjustmentsNarrative)
        if (narrativeError) newErrors.adjustmentsNarrative = narrativeError
      }
      if (formData.qhpImplementationShow) {
        if (!formData.qhpImplementationId) newErrors.qhpImplementationId = "Select a QHP implementation option"
        const narrativeError = validateNarrativeLength(formData.qhpNarrative)
        if (narrativeError) newErrors.qhpNarrative = narrativeError
      }
      if (formData.activeDirectionActivitiesShow) {
        if (!formData.technicianNameAndCredentials.trim()) newErrors.technicianNameAndCredentials = "This field is required"
        if (formData.activeDirectionIds.length === 0) newErrors.activeDirectionIds = "Select at least one activity"
        const narrativeError = validateNarrativeLength(formData.activeDirectionNarrative)
        if (narrativeError) newErrors.activeDirectionNarrative = narrativeError
      }
    }

    // Backend requires the signing caregiver whenever a caregiver signature/check is sent
    const caregiverSignaturePresent = useCheckmarkSignature ? caregiverSignatureChecked : !!caregiverSignatureImage
    if (caregiverSignaturePresent && !clientCaregiverId) {
      newErrors.clientCaregiverId = "Select the caregiver who signed"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setTimeout(() => {
        const firstKey = Object.keys(newErrors)[0]
        const el = document.querySelector<HTMLElement>(`[data-field="${firstKey}"]`)
        if (!el) return
        const scrollContainer = document.getElementById("main-scroll")
        if (scrollContainer) {
          const elRect = el.getBoundingClientRect()
          const containerRect = scrollContainer.getBoundingClientRect()
          const scrollOffset = elRect.top - containerRect.top + scrollContainer.scrollTop - 100
          scrollContainer.scrollTo({ top: scrollOffset, behavior: "smooth" })
        } else {
          el.scrollIntoView({ behavior: "smooth", block: "center" })
        }
        const focusable = el.querySelector<HTMLElement>("input, textarea, select, button") ?? el
        if (focusable instanceof HTMLElement) setTimeout(() => focusable.focus(), 400)
      }, 50)
      return null
    }
    setErrors({})

    const isReadOnly = status === "read"

    const participants: AppointmentNoteParticipantPayload[] = isReadOnly
      ? []
      : formData.participantIds
          .filter((id) => id && id !== CLIENT_PARTICIPANT_ID)
          .map((catalogId) => {
            const item = participantCatalog.find((c) => c.id === catalogId)
            return { catalogId, catalogType: item?.type ?? "Member User Type" }
          })

    const payload: UpdateAppointmentNote97155Payload = {
      id: formData.noteId,
      caregiverSignatureImage: caregiverSignatureImage || null,
      caregiverSignatureChecked: useCheckmarkSignature ? caregiverSignatureChecked : null,
      clientCaregiverId: clientCaregiverId || null,
      providerSignatureImage: providerSignatureImage || null,
      // Show flags always sent
      faceToFaceProtocolShow: formData.faceToFaceProtocolShow,
      protocolAdjustmentsShow: formData.protocolAdjustmentsShow,
      qhpImplementationShow: formData.qhpImplementationShow,
      activeDirectionActivitiesShow: formData.activeDirectionActivitiesShow,
      ...(isReadOnly ? {} : {
        modalityId: formData.modalityId || null,
        reasonCaregiverNotPresent: formData.reasonCaregiverNotPresent,
        medicalConcerns: formData.medicalConcerns,
        crisisInvolved: formData.crisisInvolved,
        participants,
        // Face-to-face
        faceToFaceProtocolId: formData.faceToFaceProtocolId || null,
        faceToFaceProtocolNarrative: formData.faceToFaceProtocolNarrative,
        // Protocol adjustments
        protocolAdjustmentIds: formData.protocolAdjustmentIds,
        adjustmentsNarrative: formData.adjustmentsNarrative,
        // QHP implementation
        qhpImplementationId: formData.qhpImplementationId || null,
        qhpNarrative: formData.qhpNarrative,
        // Active direction
        technicianNameAndCredentials: formData.technicianNameAndCredentials,
        activeDirectionIds: formData.activeDirectionIds,
        activeDirectionNarrative: formData.activeDirectionNarrative,
      }),
    }

    const id = await mutation.update(payload)
    if (id) void refetch()
    return id
  }, [formData, note, mutation, refetch, participantCatalog, caregiverSignatureImage, caregiverSignatureChecked, useCheckmarkSignature, providerSignatureImage, clientCaregiverId])

  const recipient = note?.recipient ?? null
  const provider = note?.provider ?? null
  const serviceDetails = note?.serviceDetails ?? null
  const billingCodes = note?.billingCodes ?? null

  const isLoadingCatalogs = modalityLoading || participantsLoading || catalogsLoading || caregiversLoading

  return {
    formData,
    updateField,
    handleSubmit,
    errors,
    note,
    isLoadingNote: noteLoading,
    noteError,
    isSaving: mutation.isLoading,
    isLoadingCatalogs,
    modalityOptions,
    participantCatalog,
    // 97155-specific catalogs
    protocolObservationItems,
    protocolAdjustmentItems,
    qhpImplementationItems,
    activeDirectionItems,
    // Context
    recipient,
    provider,
    serviceDetails,
    billingCodes,
    // Signatures
    providerSignatureUrl,
    setProviderSignatureImage,
    useCheckmarkSignature,
    caregiverSignatureChecked,
    setCaregiverChecked,
    caregiverSignatureImage,
    setCaregiverSignatureImage,
    signatureCaregiverOptions,
    clientCaregiverId,
    setClientCaregiverId,
    resolvedClientId,
    caregiversLoading,
    // Status
    noteStatus: note?.noteStatus ?? "read",
    noteId: note?.id ?? null,
    refetchNote: refetch,
  }
}
