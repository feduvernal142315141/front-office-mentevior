"use client"

import { useEffect, useState } from "react"
import { usePriorAuthorizationsByClient } from "@/lib/modules/prior-authorizations/hooks/use-prior-authorizations-by-client"
import { getPriorAuthorizationById } from "@/lib/modules/prior-authorizations/services/prior-authorizations-api.service"
import { formatPriorAuthorizationLabel } from "@/lib/utils/prior-auth-display"

export function usePriorAuthorizationLabel(
  priorAuthorizationId: string | undefined,
  clientId: string | undefined,
) {
  const { pas } = usePriorAuthorizationsByClient(clientId ?? null)
  const [label, setLabel] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!priorAuthorizationId) {
      setLabel("")
      setIsLoading(false)
      return
    }

    const fromList = pas.find((pa) => pa.id === priorAuthorizationId)
    if (fromList) {
      setLabel(formatPriorAuthorizationLabel(fromList))
      setIsLoading(false)
      return
    }

    let cancelled = false
    setIsLoading(true)

    void getPriorAuthorizationById(priorAuthorizationId)
      .then((pa) => {
        if (!cancelled) setLabel(formatPriorAuthorizationLabel(pa))
      })
      .catch(() => {
        if (!cancelled) setLabel("")
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [priorAuthorizationId, pas])

  return { label, isLoading }
}
