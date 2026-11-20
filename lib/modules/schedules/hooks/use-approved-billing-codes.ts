"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { format } from "date-fns"
import {
  getApprovedBillingCodesByClient,
  type ApprovedBillingCodeItem,
  type ApprovedBillingCodesResponse,
} from "../services/approved-billing-codes.service"
import { formatBillingCodeDisplay } from "@/lib/utils/billing-code-display"
import type { ConfigBillingCodeItem } from "@/lib/types/appointment.types"
import { getPriorAuthorizationsByClientId } from "@/lib/modules/prior-authorizations/services/prior-authorizations.service"

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
  /** No PA covers the requested date and a non-cancelled PA ended before it */
  hasExpiredPriorAuth: boolean
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

const EMPTY_BILLING_CODES: ConfigBillingCodeItem[] = []

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
  providerId?: string | null,
  date?: string,
): ApprovedBillingCodesResult {
  const [billingCodes, setBillingCodes] = useState<ConfigBillingCodeItem[]>([])
  const [priorAuthorization, setPriorAuthorization] = useState<ApprovedBillingCodesResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [hasExpiredPriorAuth, setHasExpiredPriorAuth] = useState(false)
  const [resolvedKey, setResolvedKey] = useState("")
  const requestIdRef = useRef(0)
  const requestKey = JSON.stringify([clientId, billingCodeType, providerId, date])

  const fetchCodes = useCallback(async () => {
    const requestId = ++requestIdRef.current
    setHasExpiredPriorAuth(false)
    if (!clientId) {
      setBillingCodes([])
      setPriorAuthorization(null)
      setError(null)
      setIsLoading(false)
      setResolvedKey(requestKey)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const data = await getApprovedBillingCodesByClient(clientId, billingCodeType, providerId || undefined, date)
      if (requestId !== requestIdRef.current) return
      let expired = false

      // Check expiry relative to the appointment, rather than today's date.
      if (!data?.id && !data?.billingCodes?.length) {
        const priorAuthorizations = await getPriorAuthorizationsByClientId(clientId)
        const referenceDate = date || format(new Date(), "yyyy-MM-dd")
        expired = priorAuthorizations.some((pa) =>
          pa.active !== false && !!pa.endDate && pa.endDate < referenceDate,
        )
      }

      if (requestId !== requestIdRef.current) return
      setHasExpiredPriorAuth(expired)

      if (data === null) {
        setBillingCodes([])
        setPriorAuthorization(null)
      } else {
        setPriorAuthorization(data)
        setBillingCodes((data.billingCodes ?? []).map(mapApprovedToConfigItem))
      }
    } catch (err) {
      if (requestId !== requestIdRef.current) return
      setError(err instanceof Error ? err : new Error("Failed to load approved billing codes"))
      setBillingCodes([])
      setPriorAuthorization(null)
    } finally {
      if (requestId === requestIdRef.current) {
        setResolvedKey(requestKey)
        setIsLoading(false)
      }
    }
  }, [clientId, billingCodeType, providerId, date, requestKey])

  useEffect(() => {
    void fetchCodes()
    return () => { requestIdRef.current++ }
  }, [fetchCodes])

  const isCurrent = resolvedKey === requestKey
  const loading = !!clientId && (!isCurrent || isLoading)

  return {
    billingCodes: isCurrent ? billingCodes : EMPTY_BILLING_CODES,
    priorAuthorization: isCurrent ? priorAuthorization : null,
    priorAuthorizationId: isCurrent ? priorAuthorization?.id ?? "" : "",
    authNumber: isCurrent ? priorAuthorization?.authNumber ?? "" : "",
    hasPriorAuthWithoutCodes: isCurrent && priorAuthorization !== null && billingCodes.length === 0 && !loading && !error,
    hasExpiredPriorAuth: isCurrent && hasExpiredPriorAuth && !loading && !error,
    isLoading: loading,
    error: isCurrent ? error : null,
    refetch: fetchCodes,
  }
}
