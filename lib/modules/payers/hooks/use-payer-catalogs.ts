"use client"

import { useEffect, useState } from "react"
import type { PayerCatalogItem, PayerClearingHouseItem } from "@/lib/types/payer.types"
import { getPayersService } from "../services/payers.service"

interface UsePayerCatalogsReturn {
  privateInsurances: PayerCatalogItem[]
  flMedicaidInsurances: PayerCatalogItem[]
  clearingHouses: PayerClearingHouseItem[]
  isLoading: boolean
}

export function usePayerCatalogs(): UsePayerCatalogsReturn {
  const [privateInsurances, setPrivateInsurances] = useState<PayerCatalogItem[]>([])
  const [flMedicaidInsurances, setFlMedicaidInsurances] = useState<PayerCatalogItem[]>([])
  const [clearingHouses, setClearingHouses] = useState<PayerClearingHouseItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isActive = true

    const loadCatalogs = async () => {
      try {
        setIsLoading(true)
        const [privateResponse, medicaidResponse, clearingHouseResponse] = await Promise.all([
          getPayersService().getPrivateInsurancesCatalog(),
          getPayersService().getFlMedicaidCatalog(),
          getPayersService().getClearingHouseCatalog(),
        ])

        if (!isActive) {
          return
        }

        setPrivateInsurances(privateResponse)
        setFlMedicaidInsurances(medicaidResponse)
        setClearingHouses(clearingHouseResponse)
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
    clearingHouses,
    isLoading,
  }
}
