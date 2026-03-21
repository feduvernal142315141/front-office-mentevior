"use client"

import { useEffect, useState } from "react"
import type { PayerCatalogItem, PayerPlanTypeItem } from "@/lib/types/payer.types"
import { getPayersService } from "../services/payers.service"

interface UsePayerCatalogsReturn {
  privateInsurances: PayerCatalogItem[]
  flMedicaidInsurances: PayerCatalogItem[]
  planTypes: PayerPlanTypeItem[]
  isLoading: boolean
}

export function usePayerCatalogs(): UsePayerCatalogsReturn {
  const [privateInsurances, setPrivateInsurances] = useState<PayerCatalogItem[]>([])
  const [flMedicaidInsurances, setFlMedicaidInsurances] = useState<PayerCatalogItem[]>([])
  const [planTypes, setPlanTypes] = useState<PayerPlanTypeItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isActive = true

    const loadCatalogs = async () => {
      try {
        setIsLoading(true)
        const [privateResponse, medicaidResponse, planTypeResponse] = await Promise.all([
          getPayersService().getPrivateInsurancesCatalog(),
          getPayersService().getFlMedicaidCatalog(),
          getPayersService().getPlanTypeCatalog(),
        ])

        if (!isActive) {
          return
        }

        setPrivateInsurances(privateResponse)
        setFlMedicaidInsurances(medicaidResponse)
        setPlanTypes(planTypeResponse)
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadCatalogs()
    return () => {
      isActive = false
    }
  }, [])

  return {
    privateInsurances,
    flMedicaidInsurances,
    planTypes,
    isLoading,
  }
}
