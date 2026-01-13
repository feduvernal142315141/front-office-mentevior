"use client"

import { useState, useCallback } from "react"
import type { CredentialCatalogItem } from "@/lib/types/credential.types"

export type DrawerStep = "select-source" | "search-catalog"
export type SourceType = "catalog" | "manual" | null

interface UseCredentialDrawerReturn {
  isOpen: boolean
  currentStep: DrawerStep
  sourceType: SourceType
  
  open: () => void
  close: () => void
  reset: () => void
  
  selectSource: (source: SourceType) => void
  goBack: () => void
}

export function useCredentialDrawer(): UseCredentialDrawerReturn {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState<DrawerStep>("select-source")
  const [sourceType, setSourceType] = useState<SourceType>(null)

  const open = useCallback(() => {
    setIsOpen(true)
    setCurrentStep("select-source")
    setSourceType(null)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    reset()
  }, [])

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
    isOpen,
    currentStep,
    sourceType,
    open,
    close,
    reset,
    selectSource,
    goBack,
  }
}
