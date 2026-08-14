"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { buildReportMonth, splitReportMonth } from "@/lib/utils/report-month"
import { getBillingCodes } from "@/lib/modules/billing-codes/services/billing-codes.service"
import { formatBillingCodeDisplay } from "@/lib/utils/billing-code-display"
import { getServiceLogById } from "@/lib/modules/service-log/services/service-log.service"
import { useBatchClaimById } from "@/lib/modules/batch-claims/hooks/use-batch-claim-by-id"
import { useBatchClaimMutation } from "@/lib/modules/batch-claims/hooks/use-batch-claim-mutation"
import { useEligibleServiceLogs } from "@/lib/modules/batch-claims/hooks/use-eligible-service-logs"
import { usePayerPlanOptions } from "@/lib/modules/batch-claims/hooks/use-payer-plan-options"
import type { BatchClaimPayload } from "@/lib/types/batch-claim.types"

/**
 * Fila mínima para listar en el picker un service log que ya pertenece al batch
 * pero que la búsqueda de elegibles no devolvió (período distinto, o quedó sin
 * appointments elegibles). Se resuelve con `GET /reports/service-log/{id}`.
 */
export interface SelectedServiceLogSnapshot {
  serviceLogId: string
  clientName: string
  providerName: string
  /** `yyyy-MM-dd`; vacíos si el fetch del detalle falló */
  initDate: string
  endDate: string
}

interface UseBatchClaimFormProps {
  /** Presente solo en modo edición */
  batchClaimId?: string
}

/** `"2026-08-10"` → `"202608"` */
function dateToReportMonth(date: string): string {
  const [year, month] = date.split("-").map(Number)
  if (!year || !month) return ""
  return buildReportMonth(year, month - 1)
}

/** `"202608"` → `"2026-08-01"` */
function reportMonthToFirstDay(reportMonth: string): string {
  const parts = splitReportMonth(reportMonth)
  if (!parts) return ""
  return `${parts.year}-${String(parts.monthIndex0 + 1).padStart(2, "0")}-01`
}

/** `"202608"` → `"2026-08-31"` */
function reportMonthToLastDay(reportMonth: string): string {
  const parts = splitReportMonth(reportMonth)
  if (!parts) return ""
  const lastDay = new Date(parts.year, parts.monthIndex0 + 1, 0).getDate()
  return `${parts.year}-${String(parts.monthIndex0 + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`
}

export function useBatchClaimForm({ batchClaimId }: UseBatchClaimFormProps = {}) {
  const isEdit = !!batchClaimId
  const { batchClaim, isLoading: isLoadingBatch, error: batchError } = useBatchClaimById(batchClaimId ?? null)
  const mutation = useBatchClaimMutation()

  // ── Cabecera ──
  const [payerId, setPayerId] = useState("")
  const [payerPlanId, setPayerPlanId] = useState("")
  const [reference, setReference] = useState("")
  const [comments, setComments] = useState("")

  const { payerOptions, planOptions, isLoadingPayers, isLoadingPlans } = usePayerPlanOptions(payerId)

  // ── Período + selección (ids de service logs) ──
  const [startMonth, setStartMonth] = useState("")
  const [endMonth, setEndMonth] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const { serviceLogs, isLoading: isLoadingEligible, hasSearched, search, reset } = useEligibleServiceLogs()

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Detalle resuelto de los service logs del batch que la búsqueda no devuelve (solo edit)
  const [orphanSnapshots, setOrphanSnapshots] = useState<Record<string, SelectedServiceLogSnapshot>>({})
  const orphanFetchesRef = useRef<Set<string>>(new Set())

  // ── Etiquetas de billing codes (los appointments anidados solo traen el id) ──
  const [billingCodeLabels, setBillingCodeLabels] = useState<Record<string, string>>({})
  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const { billingCodes } = await getBillingCodes({ page: 0, pageSize: 500, filters: undefined, orders: undefined })
        if (!active) return
        const map: Record<string, string> = {}
        for (const bc of billingCodes) {
          map[bc.id] = formatBillingCodeDisplay({ type: bc.type, code: bc.code, modifier: bc.modifier })
        }
        setBillingCodeLabels(map)
      } catch {
        // Sin etiquetas el picker sigue funcionando; muestra solo fecha/horas/unidades
      }
    })()
    return () => {
      active = false
    }
  }, [])

  // ── Precarga en edición ──
  const hasHydratedFromBatchRef = useRef(false)
  useEffect(() => {
    if (!isEdit || !batchClaim || hasHydratedFromBatchRef.current) return
    hasHydratedFromBatchRef.current = true

    setPayerId(batchClaim.payerId)
    setPayerPlanId(batchClaim.payerPlanId)
    setReference(batchClaim.reference)
    setComments(batchClaim.comments)
    setSelectedIds(new Set(batchClaim.serviceLogIds))

    // El backend no persiste el período del lote: se deriva de los appointments derivados
    let minDate = ""
    let maxDate = ""
    for (const group of batchClaim.appointments) {
      for (const detail of group.appointmentDetails) {
        if (!detail.date) continue
        if (!minDate || detail.date < minDate) minDate = detail.date
        if (!maxDate || detail.date > maxDate) maxDate = detail.date
      }
    }
    if (minDate) setStartMonth(dateToReportMonth(minDate))
    if (maxDate) setEndMonth(dateToReportMonth(maxDate))
  }, [isEdit, batchClaim])

  // Un solo plan → se preselecciona; el usuario solo elige cuando hay varios
  useEffect(() => {
    if (planOptions.length !== 1) return
    setPayerPlanId((prev) => prev || planOptions[0].value)
    setErrors((prev) => {
      if (!prev.payerPlanId) return prev
      const next = { ...prev }
      delete next.payerPlanId
      return next
    })
  }, [planOptions])

  // ── Búsqueda de elegibles: automática cuando hay plan + período completo ──
  const initDate = useMemo(() => reportMonthToFirstDay(startMonth), [startMonth])
  const endDate = useMemo(() => reportMonthToLastDay(endMonth), [endMonth])
  const canSearch = !!payerPlanId && !!initDate && !!endDate && initDate <= endDate
  useEffect(() => {
    if (!canSearch) return
    void search({ payerPlanId, initDate, endDate })
  }, [canSearch, payerPlanId, initDate, endDate, search])

  // ── Huérfanos: seleccionados que no están en el resultado vigente ──
  const eligibleIds = useMemo(() => new Set(serviceLogs.map((sl) => sl.id)), [serviceLogs])

  const orphanIds = useMemo(
    () => [...selectedIds].filter((id) => !eligibleIds.has(id)),
    [selectedIds, eligibleIds],
  )

  // Resolver el detalle de cada huérfano una sola vez, tolerando fallos
  useEffect(() => {
    for (const id of orphanIds) {
      if (orphanFetchesRef.current.has(id)) continue
      orphanFetchesRef.current.add(id)
      void getServiceLogById(id)
        .then((detail) => {
          setOrphanSnapshots((prev) => ({
            ...prev,
            [id]: {
              serviceLogId: id,
              clientName: detail?.recipient ?? "",
              providerName: detail?.provider ?? "",
              initDate: detail?.initDate ?? "",
              endDate: detail?.endDate ?? "",
            },
          }))
        })
        .catch(() => {
          setOrphanSnapshots((prev) => ({
            ...prev,
            [id]: { serviceLogId: id, clientName: "", providerName: "", initDate: "", endDate: "" },
          }))
        })
    }
  }, [orphanIds])

  const orphanSelections = useMemo(
    () =>
      orphanIds.map(
        (id) =>
          orphanSnapshots[id] ?? {
            serviceLogId: id,
            clientName: "",
            providerName: "",
            initDate: "",
            endDate: "",
          },
      ),
    [orphanIds, orphanSnapshots],
  )

  const clearFieldError = useCallback((field: string) => {
    setErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }, [])

  const handlePayerChange = useCallback((id: string) => {
    setPayerId(id)
    setPayerPlanId("")
    // Los elegibles dependen del payer: cambiarlo invalida la selección actual
    setSelectedIds(new Set())
    reset()
    clearFieldError("payerPlanId")
  }, [reset, clearFieldError])

  const handlePlanChange = useCallback((id: string) => {
    setPayerPlanId(id)
    setSelectedIds(new Set())
    reset()
    clearFieldError("payerPlanId")
  }, [reset, clearFieldError])

  // Al mover el período se conserva lo seleccionado: puede seguir siendo válido
  // aunque quede fuera del nuevo resultado (se lista aparte en el picker)
  const handleRangeChange = useCallback((start: string, end: string) => {
    setStartMonth(start)
    setEndMonth(end)
    clearFieldError("dateRange")
  }, [clearFieldError])

  const toggleServiceLog = useCallback((serviceLogId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(serviceLogId)) next.delete(serviceLogId)
      else next.add(serviceLogId)
      return next
    })
    clearFieldError("serviceLogs")
  }, [clearFieldError])

  const setServiceLogsSelected = useCallback((serviceLogIds: string[], selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      for (const id of serviceLogIds) {
        if (selected) next.add(id)
        else next.delete(id)
      }
      return next
    })
    clearFieldError("serviceLogs")
  }, [clearFieldError])

  const scrollToField = (field: string) => {
    setTimeout(() => {
      const el = document.querySelector<HTMLElement>(`[data-form-field="${field}"]`)
      if (!el) return
      el.scrollIntoView({ behavior: "smooth", block: "center" })
      const focusable = el.querySelector<HTMLElement>("input, textarea, select, button")
      if (focusable) setTimeout(() => focusable.focus(), 300)
    }, 50)
  }

  const handleSubmit = useCallback(async (): Promise<string | null> => {
    const newErrors: Record<string, string> = {}
    if (!payerPlanId) newErrors.payerPlanId = "Select a payer plan"
    if (!reference.trim()) newErrors.reference = "Reference is required"
    if (selectedIds.size === 0) newErrors.serviceLogs = "Select at least one service log"

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      scrollToField(Object.keys(newErrors)[0])
      return null
    }
    setErrors({})

    const payload: BatchClaimPayload = {
      payerPlanId,
      reference: reference.trim(),
      comments: comments.trim(),
      serviceLogIds: [...selectedIds],
    }

    return isEdit && batchClaimId
      ? mutation.update(batchClaimId, payload)
      : mutation.create(payload)
  }, [payerPlanId, reference, comments, selectedIds, isEdit, batchClaimId, mutation])

  return {
    isEdit,
    batchClaim,
    isLoadingBatch,
    batchError,
    // Header fields
    payerId,
    payerPlanId,
    reference,
    comments,
    setReference: (v: string) => {
      setReference(v)
      clearFieldError("reference")
    },
    setComments,
    handlePayerChange,
    handlePlanChange,
    payerOptions,
    planOptions,
    isLoadingPayers,
    isLoadingPlans,
    // Range + selection
    startMonth,
    endMonth,
    handleRangeChange,
    serviceLogs,
    isLoadingEligible,
    hasSearched,
    canSearch,
    selectedIds,
    toggleServiceLog,
    setServiceLogsSelected,
    orphanSelections,
    billingCodeLabels,
    // Submit
    handleSubmit,
    isSaving: mutation.isLoading,
    errors,
  }
}
