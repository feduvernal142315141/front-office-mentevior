"use client"

import { useCallback, useEffect, useState } from "react"
import {
  getApprovedBillingCodesByClient,
  type ApprovedBillingCodeItem,
  type ApprovedBillingCodesResponse,
} from "../services/approved-billing-codes.service"
import { formatBillingCodeDisplay } from "@/lib/utils/billing-code-display"
import type { ConfigBillingCodeItem } from "@/lib/types/appointment.types"

export interface ApprovedBillingCodesResult {
  /** Billing codes normalized for select dropdowns */
  billingCodes: ConfigBillingCodeItem[]
  /** Raw prior authorization data (null if none active) */
  priorAuthorization: ApprovedBillingCodesResponse | null
  /** Prior authorization ID shortcut */
  priorAuthorizationId: string
  /** Auth number for display */
  authNumber: string
  /** True when a PA exists but has no billing codes for the requested type */
  hasPriorAuthWithoutCodes: boolean
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

function mapApprovedToConfigItem(item: ApprovedBillingCodeItem): ConfigBillingCodeItem {
  const type = (item.type ?? "").trim()
  const code = (item.name ?? "").trim()
  const modifier = (item.modifier ?? "").trim() || undefined
  const label = formatBillingCodeDisplay({ type, code, modifier }) || code || item.id
  const availableLabel = item.availableUnit != null ? ` [${item.availableUnit} units]` : ""

  return {
    id: item.id,
    type: type || undefined,
    code: code || undefined,
    modifier,
    label: `${label}${availableLabel}`,
  }
}

export function useApprovedBillingCodes(
  clientId: string | null,
  billingCodeType: string = "Session",
): ApprovedBillingCodesResult {
  const [billingCodes, setBillingCodes] = useState<ConfigBillingCodeItem[]>([])
  const [priorAuthorization, setPriorAuthorization] = useState<ApprovedBillingCodesResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchCodes = useCallback(async () => {
    if (!clientId) {
      setBillingCodes([])
      setPriorAuthorization(null)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const data = await getApprovedBillingCodesByClient(clientId, billingCodeType)

      if (data === null) {
        setBillingCodes([])
        setPriorAuthorization(null)
      } else {
        setPriorAuthorization(data)
        setBillingCodes(data.billingCodes.map(mapApprovedToConfigItem))
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load approved billing codes"))
      setBillingCodes([])
      setPriorAuthorization(null)
    } finally {
      setIsLoading(false)
    }
  }, [clientId, billingCodeType])

  useEffect(() => {
    void fetchCodes()
  }, [fetchCodes])

  return {
    billingCodes,
    priorAuthorization,
    priorAuthorizationId: priorAuthorization?.id ?? "",
    authNumber: priorAuthorization?.authNumber ?? "",
    hasPriorAuthWithoutCodes: priorAuthorization !== null && billingCodes.length === 0 && !isLoading,
    isLoading,
    error,
    refetch: fetchCodes,
  }
}
