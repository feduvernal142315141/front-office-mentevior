"use client"

import { useCallback, useState } from "react"
import { toast } from "@/lib/compat/sonner"
import type { ClaimMdEnrollmentStartResult, ClaimMdEnrollType } from "@/lib/types/payer.types"
import { getPayersService } from "../services/payers.service"

interface UseClaimMdEnrollmentReturn {
  start: (
    payerId: string,
    enrollType?: ClaimMdEnrollType,
  ) => Promise<ClaimMdEnrollmentStartResult | null>
  /** Tipo que está en vuelo, o `null` si no hay request activo. */
  startingType: ClaimMdEnrollType | null
  isStarting: boolean
}

/**
 * Inicia el alta del provider en Claim.MD para un payer (1500 o ERA).
 *
 * El resultado trae una `enrollmentUrl` de un solo uso que **sólo llega en este POST**:
 * no vuelve en `GET /payers/{id}`. Quien llame es responsable de enseñársela al usuario
 * antes de descartarla.
 */
export function useClaimMdEnrollment(): UseClaimMdEnrollmentReturn {
  const [startingType, setStartingType] = useState<ClaimMdEnrollType | null>(null)

  const start = useCallback(async (payerId: string, enrollType: ClaimMdEnrollType = "1500") => {
    setStartingType(enrollType)
    try {
      const result = await getPayersService().startClaimMdEnrollment(payerId, enrollType)
      if (!result.enrollmentUrl) {
        toast.error("Claim.MD did not return an enrollment link", {
          description: "The enrollment was created but there is no link to continue. Try again.",
        })
        return null
      }
      return result
    } catch (err) {
      toast.error(
        enrollType === "era"
          ? "Could not start the Claim.MD ERA enrollment"
          : "Could not start the Claim.MD enrollment",
        {
          description: err instanceof Error ? err.message : undefined,
        },
      )
      return null
    } finally {
      setStartingType(null)
    }
  }, [])

  return { start, startingType, isStarting: startingType !== null }
}
