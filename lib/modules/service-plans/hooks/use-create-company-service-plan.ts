"use client"

import { useState } from "react"
import { toast } from "@/lib/compat/sonner"
import { createCompanyServicePlan } from "../services/company-service-plans.service"
import type {
  CompanyServicePlan,
  CreateCompanyServicePlanDto,
} from "@/lib/types/company-service-plan.types"

interface UseCreateCompanyServicePlanReturn {
  create: (payload: CreateCompanyServicePlanDto) => Promise<CompanyServicePlan | null>
  isLoading: boolean
}

export function useCreateCompanyServicePlan(): UseCreateCompanyServicePlanReturn {
  const [isLoading, setIsLoading] = useState(false)

  const create = async (payload: CreateCompanyServicePlanDto): Promise<CompanyServicePlan | null> => {
    try {
      setIsLoading(true)
      const createdPlan = await createCompanyServicePlan(payload)
      toast.success("Service plan created successfully")
      return createdPlan
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create service plan"
      toast.error(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { create, isLoading }
}
