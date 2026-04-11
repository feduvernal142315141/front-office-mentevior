"use client"

import { useState } from "react"
import { toast } from "@/lib/compat/sonner"
import type { ServicePlanConfig, UpsertServicePlanConfigDto } from "@/lib/types/service-plan-config.types"
import { upsertServicePlanConfig } from "../services/service-plan-config.service"

interface UseUpsertServicePlanConfigReturn {
  upsert: (data: UpsertServicePlanConfigDto) => Promise<ServicePlanConfig | null>
  isLoading: boolean
}

export function useUpsertServicePlanConfig(): UseUpsertServicePlanConfigReturn {
  const [isLoading, setIsLoading] = useState(false)

  const upsert = async (data: UpsertServicePlanConfigDto): Promise<ServicePlanConfig | null> => {
    try {
      setIsLoading(true)
      const result = await upsertServicePlanConfig(data)
      toast.success("Service plan configuration saved successfully")
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save service plan configuration"
      toast.error(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { upsert, isLoading }
}
