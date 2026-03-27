"use client"

import { useEffect, useState } from "react"
import type { PlanTypeCatalogItem } from "@/lib/types/plan-type.types"
import { getPayersService } from "../services/payers.service"

interface UsePlanTypeCatalogReturn {
  planTypes: PlanTypeCatalogItem[]
  isLoading: boolean
  error: Error | null
}

export function usePlanTypeCatalog(): UsePlanTypeCatalogReturn {
  const [planTypes, setPlanTypes] = useState<PlanTypeCatalogItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await getPayersService().getPlanTypeCatalog()
        if (active) setPlanTypes(data)
      } catch (e) {
        if (active) {
          setError(e instanceof Error ? e : new Error("Failed to load plan types"))
          setPlanTypes([])
        }
      } finally {
        if (active) setIsLoading(false)
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [])

  return { planTypes, isLoading, error }
}
