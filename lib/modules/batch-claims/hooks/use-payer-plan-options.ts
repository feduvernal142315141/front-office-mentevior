"use client"

import { useEffect, useMemo, useState } from "react"
import { getPayersService } from "@/lib/modules/payers/services/payers.service"
import type { Payer, PayerPlanEmbed } from "@/lib/types/payer.types"

interface UsePayerPlanOptionsReturn {
  payerOptions: { value: string; label: string }[]
  planOptions: { value: string; label: string }[]
  isLoadingPayers: boolean
  isLoadingPlans: boolean
}

const PAYERS_PAGE_SIZE = 200

/**
 * Selector Payer → Plan para el batch claim. No existe un catálogo plano de
 * planes en el backend, así que se compone: lista de payers + `GET /payers/{id}`
 * (planes embebidos) al elegir uno. Los planes consultados se cachean por payer.
 */
export function usePayerPlanOptions(selectedPayerId: string): UsePayerPlanOptionsReturn {
  const [payers, setPayers] = useState<Payer[]>([])
  const [isLoadingPayers, setIsLoadingPayers] = useState(true)
  const [plansByPayer, setPlansByPayer] = useState<Record<string, PayerPlanEmbed[]>>({})
  const [isLoadingPlans, setIsLoadingPlans] = useState(false)

  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const { payers: list } = await getPayersService().list({ page: 0, pageSize: PAYERS_PAGE_SIZE })
        if (active) setPayers(list.filter((p) => p.active !== false))
      } catch {
        if (active) setPayers([])
      } finally {
        if (active) setIsLoadingPayers(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!selectedPayerId || selectedPayerId in plansByPayer) return
    let active = true
    setIsLoadingPlans(true)
    void (async () => {
      try {
        const payer = await getPayersService().getById(selectedPayerId)
        const plans = (payer.payerPlans ?? []).filter((p) => p.active !== false)
        if (active) setPlansByPayer((m) => ({ ...m, [selectedPayerId]: plans }))
      } catch {
        if (active) setPlansByPayer((m) => ({ ...m, [selectedPayerId]: [] }))
      } finally {
        if (active) setIsLoadingPlans(false)
      }
    })()
    return () => {
      active = false
    }
  }, [selectedPayerId, plansByPayer])

  const payerOptions = useMemo(
    () => payers.map((p) => ({ value: p.id, label: p.name })),
    [payers],
  )

  const planOptions = useMemo(() => {
    const plans = plansByPayer[selectedPayerId] ?? []
    return plans.map((p) => ({
      value: p.id,
      label: p.planTypeName ? `${p.planName} (${p.planTypeName})` : p.planName,
    }))
  }, [plansByPayer, selectedPayerId])

  return { payerOptions, planOptions, isLoadingPayers, isLoadingPlans }
}
