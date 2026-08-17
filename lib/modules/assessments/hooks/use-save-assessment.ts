"use client"

import { useCallback, useState } from "react"
import { toast } from "sonner"
import type { SaveAssessmentDto } from "@/lib/types/assessment.types"
import { createAssessment, updateAssessment } from "../services/assessments.service"

interface UseSaveAssessmentOptions {
  /** Id del assessment cuando se está editando uno existente */
  assessmentId?: string
}

interface UseSaveAssessmentReturn {
  /** Devuelve el id guardado, o null si falló (el error ya se mostró en toast) */
  save: (data: SaveAssessmentDto) => Promise<string | null>
  isSaving: boolean
  error: string | null
}

export function useSaveAssessment(options?: UseSaveAssessmentOptions): UseSaveAssessmentReturn {
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const assessmentId = options?.assessmentId

  const save = useCallback(async (data: SaveAssessmentDto): Promise<string | null> => {
    setIsSaving(true)
    setError(null)

    try {
      return assessmentId ? await updateAssessment(assessmentId, data) : await createAssessment(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save assessment"
      setError(message)
      toast.error("Error saving Assessment", { description: message })
      return null
    } finally {
      setIsSaving(false)
    }
  }, [assessmentId])

  return { save, isSaving, error }
}
