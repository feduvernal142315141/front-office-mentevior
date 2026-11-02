"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { AssessmentDraft, AssessmentType, ClientCategoryWithItems } from "@/lib/types/assessment.types"
import { getAssessmentDataByClient } from "../services/client-category-items.service"

interface UseAssessmentDataByClientReturn {
  draft: AssessmentDraft | null
  loadedAssessmentType: AssessmentType | null
  categories: ClientCategoryWithItems[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

/**
 * Borrador de Assessment del cliente (`GET …/assessment-data`).
 * Sin cliente no pide nada; categories vacías = sin SP activo (200).
 */
export function useAssessmentDataByClient(
  clientId?: string | null,
  assessmentType: AssessmentType = "INITIAL_ASSESSMENT",
): UseAssessmentDataByClientReturn {
  const [draft, setDraft] = useState<AssessmentDraft | null>(null)
  const [loadedAssessmentType, setLoadedAssessmentType] = useState<AssessmentType | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const requestVersionRef = useRef(0)

  const fetchDraft = useCallback(async () => {
    if (!clientId) {
      requestVersionRef.current += 1
      setDraft(null)
      setLoadedAssessmentType(null)
      setError(null)
      return
    }

    const requestVersion = ++requestVersionRef.current
    try {
      setIsLoading(true)
      setError(null)
      setDraft(null)
      setLoadedAssessmentType(null)
      const nextDraft = await getAssessmentDataByClient(clientId, assessmentType)
      if (requestVersion !== requestVersionRef.current) return
      setDraft(nextDraft)
      setLoadedAssessmentType(assessmentType)
    } catch (err) {
      if (requestVersion !== requestVersionRef.current) return
      setError(err instanceof Error ? err : new Error("Failed to fetch assessment data"))
      setDraft(null)
    } finally {
      if (requestVersion !== requestVersionRef.current) return
      setIsLoading(false)
    }
  }, [clientId, assessmentType])

  useEffect(() => {
    void fetchDraft()
  }, [fetchDraft])

  return {
    draft,
    loadedAssessmentType,
    categories: draft?.categories ?? [],
    isLoading,
    error,
    refetch: fetchDraft,
  }
}

/** @deprecated Prefer `useAssessmentDataByClient` — mismo endpoint, sólo categorías. */
export function useClientCategoryItems(clientId?: string | null) {
  const { categories, isLoading, error, refetch } = useAssessmentDataByClient(clientId)
  return { categories, isLoading, error, refetch }
}
