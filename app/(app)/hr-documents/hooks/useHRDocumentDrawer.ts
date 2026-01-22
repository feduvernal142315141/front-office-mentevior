"use client"

import { useState, useCallback } from "react"

export type DrawerStep = "select-source" | "search-catalog"
export type SourceType = "catalog" | "manual" | null

interface UseHRDocumentDrawerReturn {
  currentStep: DrawerStep
  sourceType: SourceType
  
  reset: () => void
  selectSource: (source: SourceType) => void
  goBack: () => void
}

export function useHRDocumentDrawer(): UseHRDocumentDrawerReturn {
  const [currentStep, setCurrentStep] = useState<DrawerStep>("select-source")
  const [sourceType, setSourceType] = useState<SourceType>(null)

  const reset = useCallback(() => {
    setCurrentStep("select-source")
    setSourceType(null)
  }, [])

  const selectSource = useCallback((source: SourceType) => {
    setSourceType(source)
    if (source === "catalog") {
      setCurrentStep("search-catalog")
    }
  }, [])

  const goBack = useCallback(() => {
    if (currentStep === "search-catalog") {
      setCurrentStep("select-source")
      setSourceType(null)
    }
  }, [currentStep])

  return {
    currentStep,
    sourceType,
    reset,
    selectSource,
    goBack,
  }
}
