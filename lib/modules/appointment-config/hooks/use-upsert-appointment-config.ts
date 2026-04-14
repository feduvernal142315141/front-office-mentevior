"use client"

import { useState } from "react"
import { toast } from "@/lib/compat/sonner"
import type { AppointmentConfig, UpsertAppointmentConfigDto } from "@/lib/types/appointment-config.types"
import { upsertAppointmentConfig } from "../services/appointment-config.service"

interface UseUpsertAppointmentConfigReturn {
  upsert: (data: UpsertAppointmentConfigDto) => Promise<AppointmentConfig | null>
  isLoading: boolean
}

export function useUpsertAppointmentConfig(): UseUpsertAppointmentConfigReturn {
  const [isLoading, setIsLoading] = useState(false)

  const upsert = async (data: UpsertAppointmentConfigDto): Promise<AppointmentConfig | null> => {
    try {
      setIsLoading(true)
      const result = await upsertAppointmentConfig(data)
      toast.success("Appointment configuration saved successfully")
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save appointment configuration"
      toast.error(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { upsert, isLoading }
}
