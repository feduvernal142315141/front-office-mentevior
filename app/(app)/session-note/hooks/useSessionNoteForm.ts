"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import type {
  AppointmentNote,
  AppointmentNoteCategory,
  AppointmentNoteRecipient,
  AppointmentNoteProvider,
  AppointmentNoteModality,
  AppointmentNoteServiceDetails,
  UpdateAppointmentNotePayload,
  AppointmentNoteParticipantPayload,
} from "@/lib/types/appointment-note.types"
import { useAppointmentNote } from "@/lib/modules/appointment-notes/hooks/use-appointment-note"
import { useAppointmentNoteMutation } from "@/lib/modules/appointment-notes/hooks/use-appointment-note-mutation"
import { useTeachingMethodCatalog } from "@/lib/modules/appointment-notes/hooks/use-teaching-method-catalog"
import { useInterventionCatalogs } from "@/lib/modules/appointment-notes/hooks/use-intervention-catalogs"
import { useParticipantCatalog } from "@/lib/modules/appointment-notes/hooks/use-participant-catalog"
import { useModalityCatalog } from "@/lib/modules/appointment-notes/hooks/use-modality-catalog"
import { useCaregiversByClient } from "@/lib/modules/caregivers/hooks/use-caregivers-by-client"
import { getAppointmentById } from "@/lib/modules/schedules/services/appointments.service"
import { validateNarrativeLength } from "@/lib/utils/narrative-length"

export const CLIENT_PARTICIPANT_ID = "client-fixed"

export interface CategoryItemFormData {
  value: number | null
  environmentalChange: string
}

export interface SessionNoteFormData {
  noteId: string
  teachingMethodId: string
  modalityId: string
  reasonCaregiverNotPresent: string
  medicalConcerns: string
  crisisInvolved: boolean
  sessionSummary: string
  participantIds: string[]
  antecedentInterventionIds: string[]
  consequenceInterventionIds: string[]
  /** Editable category items keyed by item id */
  categoryItems: Record<string, CategoryItemFormData>
}

const EMPTY_FORM: SessionNoteFormData = {
  noteId: "",
  teachingMethodId: "",
  modalityId: "",
  reasonCaregiverNotPresent: "",
  medicalConcerns: "",
  crisisInvolved: false,
  sessionSummary: "",
  participantIds: [CLIENT_PARTICIPANT_ID],
  antecedentInterventionIds: [],
  consequenceInterventionIds: [],
  categoryItems: {},
}

function noteToFormData(note: AppointmentNote): SessionNoteFormData {
  const categoryItems: Record<string, CategoryItemFormData> = {}
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
    sessionSummary: note.sessionSummary,
    participantIds: [CLIENT_PARTICIPANT_ID, ...note.participants.map((p) => p.catalogId)],
    antecedentInterventionIds: note.antecedentInterventionList.map((i) => i.id),
    consequenceInterventionIds: note.consequenceInterventionList.map((i) => i.id),
    categoryItems,
  }
}

interface UseSessionNoteFormProps {
  appointmentId: string | null
  clientId: string | null
}

export function useSessionNoteForm({ appointmentId, clientId }: UseSessionNoteFormProps) {
  const { note, isLoading: noteLoading, error: noteError, refetch } = useAppointmentNote(appointmentId)
  const mutation = useAppointmentNoteMutation()

  // Provider signature — from note response (presigned URL), edits stored locally until save
  const [providerSignatureImage, setProviderSignatureImage] = useState<string | null>(null)
  const providerSignatureUrl = providerSignatureImage || note?.provider?.sign || null

  // Caregiver signature state — initialized from persisted values
  const useCheckmarkSignature = note?.useCheckmarkSignature ?? false
  const [caregiverSignatureChecked, setCaregiverChecked] = useState(false)
  const [caregiverSignatureImage, setCaregiverSignatureImage] = useState<string | null>(null)
  const [clientCaregiverId, setClientCaregiverIdState] = useState("")

  // Sync persisted signature values when note loads
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
  const { selectOptions: teachingMethodOptions, isLoading: teachingMethodsLoading } = useTeachingMethodCatalog()
  const { selectOptions: modalityOptions, isLoading: modalityLoading } = useModalityCatalog()
  const { items: rawParticipantCatalog, isLoading: participantsLoading } = useParticipantCatalog()
  const participantCatalog = useMemo(
    () => [{ id: CLIENT_PARTICIPANT_ID, name: "Client", type: "Relationship" as const }, ...rawParticipantCatalog],
    [rawParticipantCatalog],
  )
  const {
    antecedentInterventions,
    consequenceInterventions,
    isLoading: interventionsLoading,
  } = useInterventionCatalogs()

  const [formData, setFormData] = useState<SessionNoteFormData>(EMPTY_FORM)

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
    <K extends keyof SessionNoteFormData>(field: K, value: SessionNoteFormData[K]) => {
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

  const [itemErrors, setItemErrors] = useState<Set<string>>(new Set())

  const handleSubmit = useCallback(async () => {
    if (!formData.noteId || !note) return null

    const status = note.noteStatus
    // Prevent save on close/lock statuses
    if (status === "close" || status === "lock") return null

    // Validate required fields (only when form is fully editable)
    const newErrors: Record<string, string> = {}
    if (status !== "read") {
      if (!formData.teachingMethodId) newErrors.teachingMethodId = "Select a teaching method"
      if (!formData.modalityId) newErrors.modalityId = "Select a modality"
      if (formData.participantIds.length === 0) newErrors.participantIds = "Select at least one participant"
      if (!formData.reasonCaregiverNotPresent.trim()) newErrors.reasonCaregiverNotPresent = "This field is required"
      if (!formData.medicalConcerns.trim()) newErrors.medicalConcerns = "This field is required"
      if (formData.antecedentInterventionIds.length === 0) newErrors.antecedentInterventionIds = "Select at least one intervention"
      if (formData.consequenceInterventionIds.length === 0) newErrors.consequenceInterventionIds = "Select at least one intervention"
      const summaryError = validateNarrativeLength(formData.sessionSummary)
      if (summaryError) newErrors.sessionSummary = summaryError
    }

    // Backend requires the signing caregiver whenever a caregiver signature/check is sent
    const caregiverSignaturePresent = useCheckmarkSignature ? caregiverSignatureChecked : !!caregiverSignatureImage
    if (caregiverSignaturePresent && !clientCaregiverId) {
      newErrors.clientCaregiverId = "Select the caregiver who signed"
    }

    // Validate that all data collection items have a value
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

      // Scroll to the first error (field errors first, then item errors)
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

    const isReadOnly = status === "read"

    const participants: AppointmentNoteParticipantPayload[] = isReadOnly
      ? []
      : formData.participantIds
          .filter((id) => id && id !== CLIENT_PARTICIPANT_ID)
          .map((catalogId) => {
            const item = participantCatalog.find((c) => c.id === catalogId)
            return { catalogId, catalogType: item?.type ?? "Member User Type" }
          })

    const payload: UpdateAppointmentNotePayload = {
      id: formData.noteId,
      dataCollectionItems,
      caregiverSignatureImage: caregiverSignatureImage || null,
      caregiverSignatureChecked: useCheckmarkSignature ? caregiverSignatureChecked : null,
      clientCaregiverId: clientCaregiverId || null,
      providerSignatureImage: providerSignatureImage || null,
      ...(isReadOnly ? {} : {
        teachingMethodId: formData.teachingMethodId || null,
        modalityId: formData.modalityId || null,
        reasonCaregiverNotPresent: formData.reasonCaregiverNotPresent,
        medicalConcerns: formData.medicalConcerns,
        crisisInvolved: formData.crisisInvolved,
        sessionSummary: formData.sessionSummary,
        participants,
        antecedentInterventionIds: formData.antecedentInterventionIds,
        consequenceInterventionIds: formData.consequenceInterventionIds,
      }),
    }

    const id = await mutation.update(payload)
    if (id) void refetch()
    return id
  }, [formData, note, mutation, refetch, participantCatalog, caregiverSignatureImage, caregiverSignatureChecked, useCheckmarkSignature, providerSignatureImage, clientCaregiverId])

  const antecedentItems = useMemo(
    () => antecedentInterventions.map((i) => ({ id: i.id, name: i.name })),
    [antecedentInterventions],
  )

  const consequenceItems = useMemo(
    () => consequenceInterventions.map((i) => ({ id: i.id, name: i.name })),
    [consequenceInterventions],
  )

  const categories: AppointmentNoteCategory[] = useMemo(() => note?.categories ?? [], [note])
  const recipient: AppointmentNoteRecipient | null = note?.recipient ?? null
  const provider: AppointmentNoteProvider | null = note?.provider ?? null
  const serviceDetails: AppointmentNoteServiceDetails | null = note?.serviceDetails ?? null
  const billingCodes: string | null = note?.billingCodes ?? null
  const noteModality: AppointmentNoteModality | null = note?.modality ?? null

  const isLoadingCatalogs = teachingMethodsLoading || modalityLoading || participantsLoading || interventionsLoading || caregiversLoading

  return {
    formData,
    updateField,
    updateItemValue,
    updateItemEnvironmentalChange,
    handleSubmit,
    errors,
    note,
    isLoadingNote: noteLoading,
    noteError,
    isSaving: mutation.isLoading,
    isLoadingCatalogs,
    teachingMethodOptions,
    modalityOptions,
    participantCatalog,
    antecedentItems,
    consequenceItems,
    categories,
    recipient,
    provider,
    serviceDetails,
    billingCodes,
    noteModality,
    itemErrors,
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
    noteStatus: note?.noteStatus ?? "read",
    noteId: note?.id ?? null,
    refetchNote: refetch,
  }
}
