"use client"

import { useState, useCallback } from "react"
import type { PayerCatalogItem } from "@/lib/types/payer.types"

export type PayerDrawerStep = "select-source" | "search-catalog"

interface UsePayerDrawerReturn {
  currentStep: PayerDrawerStep
  selectedCatalogItem: PayerCatalogItem | null
  goToCatalog: () => void
  selectCatalogItem: (item: PayerCatalogItem) => void
  goBack: () => void
  reset: () => void
  getStepTitle: () => string
  canGoBack: boolean
}

export function usePayerDrawer(): UsePayerDrawerReturn {
  const [currentStep, setCurrentStep] = useState<PayerDrawerStep>("select-source")
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<PayerCatalogItem | null>(null)

  const reset = useCallback(() => {
    setCurrentStep("select-source")
    setSelectedCatalogItem(null)
  }, [])

  const goToCatalog = useCallback(() => {
    setCurrentStep("search-catalog")
  }, [])

  const selectCatalogItem = useCallback((item: PayerCatalogItem) => {
    setSelectedCatalogItem(item)
  }, [])

  const goBack = useCallback(() => {
    if (currentStep === "search-catalog") {
      setCurrentStep("select-source")
      setSelectedCatalogItem(null)
    }
  }, [currentStep])

  const getStepTitle = useCallback(() => {
    switch (currentStep) {
      case "search-catalog":
        return "Insurances"
      default:
        return "Add payer"
    }
  }, [currentStep])

  return {
    currentStep,
    selectedCatalogItem,
    goToCatalog,
    selectCatalogItem,
    goBack,
    reset,
    getStepTitle,
    canGoBack: currentStep !== "select-source",
  }
}
