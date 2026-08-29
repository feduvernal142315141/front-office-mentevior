"use client"

import { useCallback, useState } from "react"
import { toast } from "@/lib/compat/sonner"
import type { ClaimMdEnrollmentStartResult } from "@/lib/types/payer.types"
import { getPayersService } from "../services/payers.service"

interface UseClaimMdEnrollmentReturn {
  start: (payerId: string) => Promise<ClaimMdEnrollmentStartResult | null>
  isStarting: boolean
}

/**
 * Inicia el alta del provider en Claim.MD para un payer.
 *
 * El resultado trae una `enrollmentUrl` de un solo uso que **sólo llega en este POST**:
 * no vuelve en `GET /payers/{id}`. Quien llame es responsable de enseñársela al usuario
 * antes de descartarla.
 */
export function useClaimMdEnrollment(): UseClaimMdEnrollmentReturn {
  const [isStarting, setIsStarting] = useState(false)

  const start = useCallback(async (payerId: string) => {
    setIsStarting(true)
    try {
      const result = await getPayersService().startClaimMdEnrollment(payerId)
      if (!result.enrollmentUrl) {
        toast.error("Claim.MD did not return an enrollment link", {
          description: "The enrollment was created but there is no link to continue. Try again.",
        })
        return null
      }
      return result
    } catch (err) {
      toast.error("Could not start the Claim.MD enrollment", {
        description: err instanceof Error ? err.message : undefined,
      })
      return null
    } finally {
      setIsStarting(false)
    }
  }, [])

  return { start, isStarting }
}
