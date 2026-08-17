"use client"

import { useCallback, useEffect, useState } from "react"
import type { AssessmentDetail } from "@/lib/types/assessment.types"
import { getAssessmentById } from "../services/assessments.service"

interface UseAssessmentByIdReturn {
  assessment: AssessmentDetail | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useAssessmentById(id?: string | null): UseAssessmentByIdReturn {
  const [assessment, setAssessment] = useState<AssessmentDetail | null>(null)
  const [isLoading, setIsLoading] = useState(!!id)
  const [error, setError] = useState<Error | null>(null)

  const fetchAssessment = useCallback(async () => {
    if (!id) {
      setAssessment(null)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      setAssessment(await getAssessmentById(id))
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch assessment"))
      setAssessment(null)
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchAssessment()
  }, [fetchAssessment])

  return { assessment, isLoading, error, refetch: fetchAssessment }
}
