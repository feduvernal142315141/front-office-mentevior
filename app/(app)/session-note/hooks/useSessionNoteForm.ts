"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import type {
  AppointmentNote,
  AppointmentNoteCategory,
  AppointmentNoteRecipient,
  AppointmentNoteProvider,
  AppointmentNoteModality,
  UpdateAppointmentNotePayload,
  AppointmentNoteParticipantPayload,
} from "@/lib/types/appointment-note.types"
import { useAppointmentNote } from "@/lib/modules/appointment-notes/hooks/use-appointment-note"
import { useAppointmentNoteMutation } from "@/lib/modules/appointment-notes/hooks/use-appointment-note-mutation"
import { useTeachingMethodCatalog } from "@/lib/modules/client-service-plan/hooks/use-teaching-method-catalog"
import { useInterventionCatalogs } from "@/lib/modules/appointment-notes/hooks/use-intervention-catalogs"
import { useParticipantCatalog } from "@/lib/modules/appointment-notes/hooks/use-participant-catalog"
import { useModalityCatalog } from "@/lib/modules/appointment-notes/hooks/use-modality-catalog"

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
  participantIds: [],
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
    medicalConcerns: note.medicalConcerns,
    crisisInvolved: note.crisisInvolved,
    sessionSummary: note.sessionSummary,
    participantIds: note.participants.map((p) => p.catalogId),
    antecedentInterventionIds: note.antecedentInterventionList.map((i) => i.id),
    consequenceInterventionIds: note.consequenceInterventionList.map((i) => i.id),
    categoryItems,
  }
}

interface UseSessionNoteFormProps {
  appointmentId: string | null
  clientId: string | null
}

export function useSessionNoteForm({ appointmentId }: UseSessionNoteFormProps) {
  const { note, isLoading: noteLoading, error: noteError, refetch } = useAppointmentNote(appointmentId)
  const mutation = useAppointmentNoteMutation()

  // Catalogs
  const { selectOptions: teachingMethodOptions, isLoading: teachingMethodsLoading } = useTeachingMethodCatalog()
  const { selectOptions: modalityOptions, isLoading: modalityLoading } = useModalityCatalog()
  const { items: participantCatalog, isLoading: participantsLoading } = useParticipantCatalog()
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

  const updateField = useCallback(
    <K extends keyof SessionNoteFormData>(field: K, value: SessionNoteFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
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

    const participants: AppointmentNoteParticipantPayload[] = formData.participantIds
      .filter(Boolean)
      .map((catalogId) => {
        const item = participantCatalog.find((c) => c.id === catalogId)
        return { catalogId, catalogType: item?.type ?? "Member User Type" }
      })

    // Build categories payload from note structure + edited form values
    const categories = note.categories.map((cat) => ({
      id: cat.id,
      items: cat.items.map((item) => {
        const edited = formData.categoryItems[item.id]
        return {
          id: item.id,
          dataCollectionId: item.dataCollectionId ?? undefined,
          value: edited?.value ?? item.value,
          environmentalChange: edited?.environmentalChange?.trim() || null,
        }
      }),
    }))

    const payload: UpdateAppointmentNotePayload = {
      id: formData.noteId,
      teachingMethodId: formData.teachingMethodId || null,
      modalityId: formData.modalityId || null,
      reasonCaregiverNotPresent: formData.reasonCaregiverNotPresent,
      medicalConcerns: formData.medicalConcerns,
      crisisInvolved: formData.crisisInvolved,
      sessionSummary: formData.sessionSummary,
      participants,
      antecedentInterventionIds: formData.antecedentInterventionIds,
      consequenceInterventionIds: formData.consequenceInterventionIds,
      categories,
    }

    const id = await mutation.update(payload)
    if (id) void refetch()
    return id
  }, [formData, note, mutation, refetch, participantCatalog])

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
  const billingCodes: string | null = note?.billingCodes ?? null
  const noteModality: AppointmentNoteModality | null = note?.modality ?? null

  const isLoadingCatalogs = teachingMethodsLoading || modalityLoading || participantsLoading || interventionsLoading

  return {
    formData,
    updateField,
    updateItemValue,
    updateItemEnvironmentalChange,
    handleSubmit,
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
    billingCodes,
    noteModality,
  }
}
