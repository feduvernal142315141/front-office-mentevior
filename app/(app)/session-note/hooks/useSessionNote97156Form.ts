"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import type {
  AppointmentNote97156,
  SessionNote97156FormData,
  UpdateAppointmentNote97156Payload,
} from "@/lib/types/appointment-note-97156.types"
import type {
  AppointmentNoteCategory,
  AppointmentNoteParticipantPayload,
} from "@/lib/types/appointment-note.types"
import { useAppointmentNote97156 } from "@/lib/modules/appointment-notes/hooks/use-appointment-note-97156"
import { useAppointmentNote97156Mutation } from "@/lib/modules/appointment-notes/hooks/use-appointment-note-97156-mutation"
import { useTeachingMethodCatalog } from "@/lib/modules/appointment-notes/hooks/use-teaching-method-catalog"
import { useModalityCatalog } from "@/lib/modules/appointment-notes/hooks/use-modality-catalog"
import { useParticipantCatalog } from "@/lib/modules/appointment-notes/hooks/use-participant-catalog"
import { use97156InterventionCatalog } from "@/lib/modules/appointment-notes/hooks/use-97156-intervention-catalog"
import { useCaregiversByClient } from "@/lib/modules/caregivers/hooks/use-caregivers-by-client"
import { getAppointmentById } from "@/lib/modules/schedules/services/appointments.service"
import { validateNarrativeLength } from "@/lib/utils/narrative-length"
import { CLIENT_PARTICIPANT_ID } from "./useSessionNoteForm"

const EMPTY_FORM: SessionNote97156FormData = {
  noteId: "",
  teachingMethodId: "",
  modalityId: "",
  reasonCaregiverNotPresent: "",
  medicalConcerns: "",
  crisisInvolved: false,
  participantIds: [CLIENT_PARTICIPANT_ID],
  caregiverIds: [],
  clientPresent: true,
  interventionIds: [],
  goals: "",
  sessionSummary: "",
  categoryItems: {},
}

function noteToFormData(note: AppointmentNote97156): SessionNote97156FormData {
  const categoryItems: Record<string, { value: number | null; environmentalChange: string }> = {}
  for (const cat of note.categories) {
    for (const item of cat.items) {
      categoryItems[item.id] = {
        value: item.value,
        environmentalChange: item.environmentalChange ?? "",
      }
    }
  }

  return {
    noteId: note.id,
    teachingMethodId: note.teachingMethod?.id ?? "",
    modalityId: note.modality?.id ?? "",
    reasonCaregiverNotPresent: note.reasonCaregiverNotPresent,
    medicalConcerns: note.medicalConcerns || "N/A",
    crisisInvolved: note.crisisInvolved,
    participantIds: [CLIENT_PARTICIPANT_ID, ...note.participants.map((p) => p.catalogId)],
    caregiverIds: note.caregivers.map((c) => c.id),
    clientPresent: note.clientPresent,
    interventionIds: note.interventions.map((i) => i.id),
    goals: note.goals,
    sessionSummary: note.sessionSummary,
    categoryItems,
  }
}

interface UseSessionNote97156FormProps {
  appointmentId: string | null
  clientId: string | null
}

export function useSessionNote97156Form({ appointmentId, clientId }: UseSessionNote97156FormProps) {
  const { note, isLoading: noteLoading, error: noteError, refetch } = useAppointmentNote97156(appointmentId)
  const mutation = useAppointmentNote97156Mutation()

  // Signatures
  const [providerSignatureImage, setProviderSignatureImage] = useState<string | null>(null)
  const providerSignatureUrl = providerSignatureImage || note?.provider?.sign || null

  const useCheckmarkSignature = note?.useCheckmarkSignature ?? false
  const [caregiverSignatureChecked, setCaregiverChecked] = useState(false)
  const [caregiverSignatureImage, setCaregiverSignatureImage] = useState<string | null>(null)

  useEffect(() => {
    if (!note) return
    if (note.caregiverSignatureChecked != null) setCaregiverChecked(note.caregiverSignatureChecked)
    if (note.caregiverSignatureImage != null) setCaregiverSignatureImage(note.caregiverSignatureImage)
  }, [note])

  // Catalogs
  const { selectOptions: teachingMethodOptions, isLoading: teachingMethodsLoading } = useTeachingMethodCatalog()
  const { selectOptions: modalityOptions, isLoading: modalityLoading } = useModalityCatalog()
  const { items: rawParticipantCatalog, isLoading: participantsLoading } = useParticipantCatalog()
  const participantCatalog = useMemo(
    () => [{ id: CLIENT_PARTICIPANT_ID, name: "Client", type: "Relationship" as const }, ...rawParticipantCatalog],
    [rawParticipantCatalog],
  )

  const { items: interventionCatalog, isLoading: interventionsLoading } = use97156InterventionCatalog()

  // Caregivers for the client.
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
  const caregiverOptions = useMemo(
    () => clientCaregivers
      .filter((c) => c.status)
      .map((c) => ({
        id: c.id,
        name: c.fullName || `${c.firstName} ${c.lastName}`.trim(),
        relationship: c.relationship ?? "",
      })),
    [clientCaregivers],
  )

  const [formData, setFormData] = useState<SessionNote97156FormData>(EMPTY_FORM)

  useEffect(() => {
    if (note) {
      setFormData(noteToFormData(note))
    } else {
      setFormData(EMPTY_FORM)
    }
  }, [note])

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [itemErrors, setItemErrors] = useState<Set<string>>(new Set())

  const updateField = useCallback(
    <K extends keyof SessionNote97156FormData>(field: K, value: SessionNote97156FormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field as string]
        return next
      })
    },
    [],
  )

  const updateItemValue = useCallback((itemId: string, value: number | null) => {
    setFormData((prev) => ({
      ...prev,
      categoryItems: {
        ...prev.categoryItems,
        [itemId]: { ...prev.categoryItems[itemId], value },
      },
    }))
    if (value != null) {
      setItemErrors((prev) => {
        if (!prev.has(itemId)) return prev
        const next = new Set(prev)
        next.delete(itemId)
        return next
      })
    }
  }, [])

  const updateItemEnvironmentalChange = useCallback((itemId: string, text: string) => {
    setFormData((prev) => ({
      ...prev,
      categoryItems: {
        ...prev.categoryItems,
        [itemId]: { ...prev.categoryItems[itemId], environmentalChange: text },
      },
    }))
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!formData.noteId || !note) return null

    const status = note.noteStatus
    if (status === "close" || status === "lock") return null

    // Validate required fields
    const newErrors: Record<string, string> = {}
    if (status !== "read") {
      if (!formData.teachingMethodId) newErrors.teachingMethodId = "Select a teaching method"
      if (!formData.modalityId) newErrors.modalityId = "Select a modality"
      if (formData.participantIds.length === 0) newErrors.participantIds = "Select at least one participant"
      if (!formData.reasonCaregiverNotPresent.trim()) newErrors.reasonCaregiverNotPresent = "This field is required"
      if (!formData.medicalConcerns.trim()) newErrors.medicalConcerns = "This field is required"
      if (formData.caregiverIds.length === 0) newErrors.caregiverIds = "Select at least one caregiver"
      if (formData.interventionIds.length === 0) newErrors.interventionIds = "Select at least one intervention"
      if (!formData.goals.trim()) newErrors.goals = "This field is required"
      const summaryError = validateNarrativeLength(formData.sessionSummary)
      if (summaryError) newErrors.sessionSummary = summaryError
    }

    // Validate data collection items
    const missing = new Set<string>()
    for (const cat of note.categories) {
      for (const item of cat.items) {
        const edited = formData.categoryItems[item.id]
        const value = edited?.value ?? item.value
        if (value == null) missing.add(item.id)
      }
    }

    const hasFieldErrors = Object.keys(newErrors).length > 0
    const hasItemErrors = missing.size > 0

    if (hasFieldErrors || hasItemErrors) {
      setErrors(newErrors)
      setItemErrors(missing)

      setTimeout(() => {
        let el: HTMLElement | null = null
        if (hasFieldErrors) {
          const firstKey = Object.keys(newErrors)[0]
          el = document.querySelector<HTMLElement>(`[data-field="${firstKey}"]`)
        } else {
          const firstId = [...missing][0]
          el = document.querySelector<HTMLElement>(`[data-item-value="${firstId}"]`)
        }
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
    setItemErrors(new Set())

    const isReadOnly = status === "read"

    const participants: AppointmentNoteParticipantPayload[] = isReadOnly
      ? []
      : formData.participantIds
          .filter((id) => id && id !== CLIENT_PARTICIPANT_ID)
          .map((catalogId) => {
            const item = participantCatalog.find((c) => c.id === catalogId)
            return { catalogId, catalogType: item?.type ?? "Member User Type" }
          })

    // Build flat dataCollectionItems from all categories
    const dataCollectionItems = note.categories.flatMap((cat) =>
      cat.items.map((item) => {
        const edited = formData.categoryItems[item.id]
        return {
          dataCollectionId: item.dataCollectionId ?? null,
          clientServicePlanCategoryItemId: item.id,
          value: edited?.value ?? item.value,
          environmentalChange: edited?.environmentalChange?.trim() || null,
        }
      })
    )

    const payload: UpdateAppointmentNote97156Payload = {
      id: formData.noteId,
      dataCollectionItems,
      caregiverSignatureImage: caregiverSignatureImage || null,
      caregiverSignatureChecked: useCheckmarkSignature ? caregiverSignatureChecked : null,
      providerSignatureImage: providerSignatureImage || null,
      ...(isReadOnly ? {} : {
        teachingMethodId: formData.teachingMethodId || null,
        modalityId: formData.modalityId || null,
        reasonCaregiverNotPresent: formData.reasonCaregiverNotPresent,
        medicalConcerns: formData.medicalConcerns,
        crisisInvolved: formData.crisisInvolved,
        participants,
        caregiverIds: formData.caregiverIds,
        clientPresent: formData.clientPresent,
        interventionIds: formData.interventionIds,
        goals: formData.goals,
        sessionSummary: formData.sessionSummary,
      }),
    }

    const id = await mutation.update(payload)
    if (id) void refetch()
    return id
  }, [formData, note, mutation, refetch, participantCatalog, caregiverSignatureImage, caregiverSignatureChecked, useCheckmarkSignature, providerSignatureImage])

  const categories: AppointmentNoteCategory[] = useMemo(() => note?.categories ?? [], [note])
  const recipient = note?.recipient ?? null
  const provider = note?.provider ?? null
  const serviceDetails = note?.serviceDetails ?? null
  const billingCodes = note?.billingCodes ?? null

  const isLoadingCatalogs = teachingMethodsLoading || modalityLoading || participantsLoading || interventionsLoading || caregiversLoading

  return {
    formData,
    updateField,
    updateItemValue,
    updateItemEnvironmentalChange,
    handleSubmit,
    errors,
    itemErrors,
    note,
    isLoadingNote: noteLoading,
    noteError,
    isSaving: mutation.isLoading,
    isLoadingCatalogs,
    teachingMethodOptions,
    modalityOptions,
    participantCatalog,
    interventionCatalog,
    caregiverOptions,
    categories,
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
    // Status
    noteStatus: note?.noteStatus ?? "read",
    noteId: note?.id ?? null,
    refetchNote: refetch,
  }
}
