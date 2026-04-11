"use client"

import { useState } from "react"
import { toast } from "@/lib/compat/sonner"
import type { SupervisionConfig, UpsertSupervisionConfigDto } from "@/lib/types/supervision-config.types"
import { upsertSupervisionConfig } from "../services/supervision-config.service"

interface UseUpsertSupervisionConfigReturn {
  upsert: (data: UpsertSupervisionConfigDto) => Promise<SupervisionConfig | null>
  isLoading: boolean
}

export function useUpsertSupervisionConfig(): UseUpsertSupervisionConfigReturn {
  const [isLoading, setIsLoading] = useState(false)

  const upsert = async (data: UpsertSupervisionConfigDto): Promise<SupervisionConfig | null> => {
    try {
      setIsLoading(true)
      const result = await upsertSupervisionConfig(data)
      toast.success("Supervision configuration saved successfully")
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save supervision configuration"
      toast.error(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { upsert, isLoading }
}
