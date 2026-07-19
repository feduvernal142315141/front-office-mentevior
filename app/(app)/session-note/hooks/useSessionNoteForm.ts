"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import type {
  AppointmentNote,
  AppointmentNoteCategory,
  UpdateAppointmentNotePayload,
  AppointmentNoteParticipantPayload,
} from "@/lib/types/appointment-note.types"
import { useAppointmentNote } from "@/lib/modules/appointment-notes/hooks/use-appointment-note"
import { useAppointmentNoteMutation } from "@/lib/modules/appointment-notes/hooks/use-appointment-note-mutation"
import { useTeachingMethodCatalog } from "@/lib/modules/client-service-plan/hooks/use-teaching-method-catalog"
import { useMemberUserTypeCatalog } from "@/lib/modules/member-user-types/hooks/use-member-user-type-catalog"
import { useRelationshipCatalog } from "@/lib/modules/relationships/hooks/use-relationship-catalog"
import { useInterventionCatalogs } from "@/lib/modules/appointment-notes/hooks/use-intervention-catalogs"

export interface SessionNoteFormData {
  noteId: string
  teachingMethodId: string
  reasonCaregiverNotPresent: string
  medicalConcerns: string
  crisisInvolved: boolean
  sessionSummary: string
  participants: AppointmentNoteParticipantPayload[]
  antecedentInterventionIds: string[]
  consequenceInterventionIds: string[]
}

const EMPTY_FORM: SessionNoteFormData = {
  noteId: "",
  teachingMethodId: "",
  reasonCaregiverNotPresent: "",
  medicalConcerns: "",
  crisisInvolved: false,
  sessionSummary: "",
  participants: [],
  antecedentInterventionIds: [],
  consequenceInterventionIds: [],
}

function noteToFormData(note: AppointmentNote): SessionNoteFormData {
  return {
    noteId: note.id,
    teachingMethodId: note.teachingMethod?.id ?? "",
    reasonCaregiverNotPresent: note.reasonCaregiverNotPresent,
    medicalConcerns: note.medicalConcerns,
    crisisInvolved: note.crisisInvolved,
    sessionSummary: note.sessionSummary,
    participants: note.participants.map((p) => ({
      memberUserTypeId: p.memberUserTypeId,
      relationshipId: p.relationshipId,
    })),
    antecedentInterventionIds: note.antecedentInterventionList.map((i) => i.id),
    consequenceInterventionIds: note.consequenceInterventionList.map((i) => i.id),
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
  const { memberUserTypes, isLoading: memberUserTypesLoading } = useMemberUserTypeCatalog()
  const { relationships, isLoading: relationshipsLoading } = useRelationshipCatalog()
  const {
    antecedentInterventions,
    consequenceInterventions,
    isLoading: interventionsLoading,
  } = useInterventionCatalogs()

  const [formData, setFormData] = useState<SessionNoteFormData>(EMPTY_FORM)

  // Populate form when note loads
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

  const addParticipant = useCallback((type: "memberUserType" | "relationship") => {
    setFormData((prev) => ({
      ...prev,
      participants: [
        ...prev.participants,
        type === "memberUserType"
          ? { memberUserTypeId: "", relationshipId: null }
          : { memberUserTypeId: null, relationshipId: "" },
      ],
    }))
  }, [])

  const removeParticipant = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      participants: prev.participants.filter((_, i) => i !== index),
    }))
  }, [])

  const updateParticipantValue = useCallback((index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      participants: prev.participants.map((p, i) => {
        if (i !== index) return p
        if (p.memberUserTypeId !== null) {
          return { ...p, memberUserTypeId: value }
        }
        return { ...p, relationshipId: value }
      }),
    }))
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!formData.noteId) return null

    const payload: UpdateAppointmentNotePayload = {
      id: formData.noteId,
      teachingMethodId: formData.teachingMethodId || null,
      reasonCaregiverNotPresent: formData.reasonCaregiverNotPresent,
      medicalConcerns: formData.medicalConcerns,
      crisisInvolved: formData.crisisInvolved,
      sessionSummary: formData.sessionSummary,
      participants: formData.participants,
      antecedentInterventionIds: formData.antecedentInterventionIds,
      consequenceInterventionIds: formData.consequenceInterventionIds,
    }

    const id = await mutation.update(payload)
    if (id) void refetch()
    return id
  }, [formData, mutation, refetch])

  // Select options for catalogs
  const memberUserTypeOptions = useMemo(
    () => memberUserTypes.map((t) => ({ value: t.id, label: t.name })),
    [memberUserTypes],
  )

  const relationshipOptions = useMemo(
    () => relationships.map((r) => ({ value: r.id, label: r.name })),
    [relationships],
  )

  const antecedentItems = useMemo(
    () => antecedentInterventions.map((i) => ({ id: i.id, name: i.name })),
    [antecedentInterventions],
  )

  const consequenceItems = useMemo(
    () => consequenceInterventions.map((i) => ({ id: i.id, name: i.name })),
    [consequenceInterventions],
  )

  const categories: AppointmentNoteCategory[] = useMemo(
    () => note?.categories ?? [],
    [note],
  )

  const isLoadingCatalogs =
    teachingMethodsLoading || memberUserTypesLoading || relationshipsLoading || interventionsLoading

  return {
    formData,
    updateField,
    addParticipant,
    removeParticipant,
    updateParticipantValue,
    handleSubmit,
    note,
    isLoadingNote: noteLoading,
    noteError,
    isSaving: mutation.isLoading,
    isLoadingCatalogs,
    // Catalog options
    teachingMethodOptions,
    memberUserTypeOptions,
    relationshipOptions,
    antecedentItems,
    consequenceItems,
    // Read-only data
    categories,
  }
}
