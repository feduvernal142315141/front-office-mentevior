"use client"

import { useState, useCallback } from "react"
import type { BillingCodeCatalogItem } from "@/lib/types/billing-code.types"

export type DrawerStep = "select-source" | "search-catalog" | "review-customize" | "create-manual"
export type SourceType = "catalog" | "manual" | null

interface UseBillingCodeDrawerReturn {
  isOpen: boolean
  currentStep: DrawerStep
  sourceType: SourceType
  selectedCatalogCode: BillingCodeCatalogItem | null
  
  open: () => void
  close: () => void
  reset: () => void
  
  selectSource: (source: SourceType) => void
  selectCatalogCode: (code: BillingCodeCatalogItem) => void
  goBack: () => void
  goToReview: () => void
}

export function useBillingCodeDrawer(): UseBillingCodeDrawerReturn {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState<DrawerStep>("select-source")
  const [sourceType, setSourceType] = useState<SourceType>(null)
  const [selectedCatalogCode, setSelectedCatalogCode] = useState<BillingCodeCatalogItem | null>(null)

  const open = useCallback(() => {
    setIsOpen(true)
    setCurrentStep("select-source")
    setSourceType(null)
    setSelectedCatalogCode(null)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    reset()
  }, [])

  const reset = useCallback(() => {
    setCurrentStep("select-source")
    setSourceType(null)
    setSelectedCatalogCode(null)
  }, [])

  const selectSource = useCallback((source: SourceType) => {
    setSourceType(source)
    if (source === "catalog") {
      setCurrentStep("search-catalog")
    } else if (source === "manual") {
      setCurrentStep("create-manual")
    }
  }, [])

  const selectCatalogCode = useCallback((code: BillingCodeCatalogItem) => {
    setSelectedCatalogCode(code)
    setCurrentStep("review-customize")
  }, [])

  const goBack = useCallback(() => {
    if (currentStep === "search-catalog" || currentStep === "create-manual") {
      setCurrentStep("select-source")
      setSourceType(null)
    } else if (currentStep === "review-customize") {
      setCurrentStep("search-catalog")
      setSelectedCatalogCode(null)
    }
  }, [currentStep])

  const goToReview = useCallback(() => {
    setCurrentStep("review-customize")
  }, [])

  return {
    isOpen,
    currentStep,
    sourceType,
    selectedCatalogCode,
    open,
    close,
    reset,
    selectSource,
    selectCatalogCode,
    goBack,
    goToReview,
  }
}
