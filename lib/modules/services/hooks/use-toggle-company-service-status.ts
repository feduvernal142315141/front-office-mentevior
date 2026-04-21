"use client"

import { useState } from "react"
import { toast } from "sonner"
import { toggleCompanyServiceStatus } from "../services/company-services.service"
import type { CompanyService, ToggleCompanyServiceStatusDto } from "@/lib/types/company-service.types"

interface UseToggleCompanyServiceStatusReturn {
  toggleStatus: (data: ToggleCompanyServiceStatusDto) => Promise<CompanyService | null>
  isLoading: boolean
}

export function useToggleCompanyServiceStatus(): UseToggleCompanyServiceStatusReturn {
  const [isLoading, setIsLoading] = useState(false)

  const toggleStatus = async (data: ToggleCompanyServiceStatusDto): Promise<CompanyService | null> => {
    try {
      setIsLoading(true)
      const result = await toggleCompanyServiceStatus(data)
      if (result) {
        toast.success(`Service ${data.active ? "activated" : "deactivated"} successfully`)
      }
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update service status"
      toast.error(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { toggleStatus, isLoading }
}
