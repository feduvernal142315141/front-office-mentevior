"use client"

import { useCallback, useRef, useState } from "react"
import { toast } from "sonner"
import type { SaveAssessmentDto } from "@/lib/types/assessment.types"
import { createAssessment, updateAssessment } from "../services/assessments.service"

interface UseSaveAssessmentOptions {
  /** Id del assessment cuando se está editando uno existente */
  assessmentId?: string
}

interface UseSaveAssessmentReturn {
  /** Crea la primera vez y actualiza a partir de ahí. Devuelve el id, o null si falló */
  save: (data: SaveAssessmentDto) => Promise<string | null>
  isSaving: boolean
  error: string | null
}

/**
 * Guardado del Assessment. Recuerda el id del primer create para que "Save &
 * Preview PDF" seguido de "Create" actualice el mismo registro en vez de dejar
 * dos (mismo patrón que `useSaveClinicalMonthly`).
 */
export function useSaveAssessment(options?: UseSaveAssessmentOptions): UseSaveAssessmentReturn {
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // En ref y no en estado: dos guardados seguidos no deben crear dos registros
  // por leer un id todavía sin re-renderizar.
  const idRef = useRef<string | null>(options?.assessmentId ?? null)

  const save = useCallback(async (data: SaveAssessmentDto): Promise<string | null> => {
    setIsSaving(true)
    setError(null)

    try {
      const existingId = idRef.current
      const id = existingId ? await updateAssessment(existingId, data) : await createAssessment(data)
      idRef.current = id
      return id
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save assessment"
      setError(message)
      toast.error("Error saving Assessment", { description: message })
      return null
    } finally {
      setIsSaving(false)
    }
  }, [])

  return { save, isSaving, error }
}
