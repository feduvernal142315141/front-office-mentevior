"use client"

import { useCallback, useEffect, useState } from "react"

import { getClientServicePlanByClientId } from "@/lib/modules/client-service-plan/services/client-service-plan.service"
import type { ClientServicePlan } from "@/lib/types/client-service-plan.types"

interface UseClientServicePlanResult {
  clientServicePlan: ClientServicePlan | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useClientServicePlan(clientId: string): UseClientServicePlanResult {
  const [clientServicePlan, setClientServicePlan] = useState<ClientServicePlan | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!clientId) {
      setClientServicePlan(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const plan = await getClientServicePlanByClientId(clientId)
      setClientServicePlan(plan)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load client service plan")
      setClientServicePlan(null)
    } finally {
      setIsLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    let active = true

    void (async () => {
      if (!clientId) {
        setClientServicePlan(null)
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const plan = await getClientServicePlanByClientId(clientId)
        if (!active) return
        setClientServicePlan(plan)
      } catch (err) {
        if (!active) return
        setError(err instanceof Error ? err.message : "Failed to load client service plan")
        setClientServicePlan(null)
      } finally {
        if (active) setIsLoading(false)
      }
    })()

    return () => {
      active = false
    }
  }, [clientId])

  return { clientServicePlan, isLoading, error, refetch: fetch }
}
