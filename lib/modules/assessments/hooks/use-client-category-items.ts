"use client"

import { useCallback, useEffect, useState } from "react"
import type { AssessmentDraft, ClientCategoryWithItems } from "@/lib/types/assessment.types"
import { getAssessmentDataByClient } from "../services/client-category-items.service"

interface UseAssessmentDataByClientReturn {
  draft: AssessmentDraft | null
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
): UseAssessmentDataByClientReturn {
  const [draft, setDraft] = useState<AssessmentDraft | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchDraft = useCallback(async () => {
    if (!clientId) {
      setDraft(null)
      setError(null)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      setDraft(await getAssessmentDataByClient(clientId))
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch assessment data"))
      setDraft(null)
    } finally {
      setIsLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    void fetchDraft()
  }, [fetchDraft])

  return {
    draft,
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
