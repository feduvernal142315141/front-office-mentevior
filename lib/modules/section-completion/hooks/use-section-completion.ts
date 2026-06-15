"use client"

import { useEffect } from "react"
import { useSectionCompletionStore } from "@/lib/store/section-completion.store"

export function useSectionCompletion() {
  const { completionMap, isLoading, error, fetchCompletion, invalidate, isSectionComplete, getMissingCount } =
    useSectionCompletionStore()

  useEffect(() => {
    fetchCompletion()
  }, [fetchCompletion])

  return {
    completionMap,
    isLoading,
    error,
    refetch: invalidate,
    isSectionComplete,
    getMissingCount,
  }
}
