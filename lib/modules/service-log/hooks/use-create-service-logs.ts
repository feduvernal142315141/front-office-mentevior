"use client"

import { useCallback, useState } from "react"
import type { CreateServiceLogsDto } from "@/lib/types/service-log.types"
import { createServiceLogs } from "../services/service-log.service"

interface UseCreateServiceLogsReturn {
  /** Encola la generación; lanza con el mensaje del backend en 422/403 */
  create: (dto: CreateServiceLogsDto) => Promise<void>
  isCreating: boolean
}

export function useCreateServiceLogs(): UseCreateServiceLogsReturn {
  const [isCreating, setIsCreating] = useState(false)

  const create = useCallback(async (dto: CreateServiceLogsDto) => {
    setIsCreating(true)
    try {
      await createServiceLogs(dto)
    } finally {
      setIsCreating(false)
    }
  }, [])

  return { create, isCreating }
}
