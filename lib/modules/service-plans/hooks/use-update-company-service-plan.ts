"use client"

import { useState } from "react"
import { toast } from "@/lib/compat/sonner"
import { updateCompanyServicePlan } from "../services/company-service-plans.service"
import type {
  CompanyServicePlan,
  UpdateCompanyServicePlanDto,
} from "@/lib/types/company-service-plan.types"

interface UseUpdateCompanyServicePlanReturn {
  update: (planId: string, payload: UpdateCompanyServicePlanDto) => Promise<CompanyServicePlan | null>
  isLoading: boolean
}

export function useUpdateCompanyServicePlan(): UseUpdateCompanyServicePlanReturn {
  const [isLoading, setIsLoading] = useState(false)

  const update = async (
    planId: string,
    payload: UpdateCompanyServicePlanDto
  ): Promise<CompanyServicePlan | null> => {
    try {
      setIsLoading(true)
      const updatedPlan = await updateCompanyServicePlan(planId, payload)
      if (!updatedPlan) {
        toast.error("Service plan not found")
        return null
      }

      toast.success("Service plan updated successfully")
      return updatedPlan
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update service plan"
      toast.error(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { update, isLoading }
}
