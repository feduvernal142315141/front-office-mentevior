"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { buildReportMonth, splitReportMonth } from "@/lib/utils/report-month"
import { getBillingCodes } from "@/lib/modules/billing-codes/services/billing-codes.service"
import { formatBillingCodeDisplay } from "@/lib/utils/billing-code-display"
import { useBatchClaimById } from "@/lib/modules/batch-claims/hooks/use-batch-claim-by-id"
import { useBatchClaimMutation } from "@/lib/modules/batch-claims/hooks/use-batch-claim-mutation"
import { useEligibleAppointments } from "@/lib/modules/batch-claims/hooks/use-eligible-appointments"
import { usePayerPlanOptions } from "@/lib/modules/batch-claims/hooks/use-payer-plan-options"
import type { BatchClaimPayload } from "@/lib/types/batch-claim.types"

/**
 * Fila mínima para poder listar en el picker un appointment que ya está
 * seleccionado en el batch pero que la búsqueda de elegibles no devolvió
 * (rango distinto, o su nota cambió de estado). Se arma desde el GET del batch.
 */
export interface SelectedAppointmentSnapshot {
  appointmentId: string
  clientName: string
  date: string
  billingCode: string
  units: number
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

  // ── Rango + selección ──
  // Rango en meses (`yyyyMM`, como MonthRangePicker); a la API van los bordes del período
  const [startMonth, setStartMonth] = useState("")
  const [endMonth, setEndMonth] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const { appointments, isLoading: isLoadingEligible, hasSearched, search, reset } = useEligibleAppointments()

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Snapshot de lo ya seleccionado en el batch (solo edit), para mostrar
  // los appointments seleccionados aunque no salgan en la búsqueda de elegibles
  const [selectedSnapshots, setSelectedSnapshots] = useState<Record<string, SelectedAppointmentSnapshot>>({})

  // ── Etiquetas de billing codes (el endpoint de elegibles solo trae el id) ──
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

    const ids = new Set<string>()
    const snapshots: Record<string, SelectedAppointmentSnapshot> = {}
    let minDate = ""
    let maxDate = ""
    for (const group of batchClaim.appointments) {
      for (const detail of group.appointmentDetails) {
        ids.add(detail.appointmentId)
        snapshots[detail.appointmentId] = {
          appointmentId: detail.appointmentId,
          clientName: group.clientName,
          date: detail.date,
          billingCode: detail.billingCode,
          units: detail.units,
        }
        if (detail.date) {
          if (!minDate || detail.date < minDate) minDate = detail.date
          if (!maxDate || detail.date > maxDate) maxDate = detail.date
        }
      }
    }
    setSelectedIds(ids)
    setSelectedSnapshots(snapshots)
    // El backend no persiste el rango del lote: se deriva de la selección
    if (minDate) setStartMonth(dateToReportMonth(minDate))
    if (maxDate) setEndMonth(dateToReportMonth(maxDate))
  }, [isEdit, batchClaim])

  // ── Búsqueda de elegibles: automática cuando hay plan + período completo ──
  // A la API van los bordes del período: día 1 del mes inicial → último día del final
  const initDate = useMemo(() => reportMonthToFirstDay(startMonth), [startMonth])
  const endDate = useMemo(() => reportMonthToLastDay(endMonth), [endMonth])
  const canSearch = !!payerPlanId && !!initDate && !!endDate && initDate <= endDate
  useEffect(() => {
    if (!canSearch) return
    void search({ payerPlanId, initDate, endDate })
  }, [canSearch, payerPlanId, initDate, endDate, search])

  const clearFieldError = useCallback((field: string) => {
    setErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }, [])

  // Un solo plan → se preselecciona; el usuario solo elige cuando hay varios
  useEffect(() => {
    if (planOptions.length !== 1) return
    setPayerPlanId((prev) => prev || planOptions[0].value)
    clearFieldError("payerPlanId")
  }, [planOptions, clearFieldError])

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

  const toggleAppointment = useCallback((appointmentId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(appointmentId)) next.delete(appointmentId)
      else next.add(appointmentId)
      return next
    })
    clearFieldError("appointments")
  }, [clearFieldError])

  const setAppointmentsSelected = useCallback((appointmentIds: string[], selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      for (const id of appointmentIds) {
        if (selected) next.add(id)
        else next.delete(id)
      }
      return next
    })
    clearFieldError("appointments")
  }, [clearFieldError])

  /** Seleccionados que la búsqueda vigente no devolvió (solo aparecen en edit) */
  const orphanSelections = useMemo(() => {
    const eligibleIds = new Set(appointments.map((a) => a.id))
    return [...selectedIds]
      .filter((id) => !eligibleIds.has(id) && selectedSnapshots[id])
      .map((id) => selectedSnapshots[id])
  }, [selectedIds, appointments, selectedSnapshots])

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
    if (selectedIds.size === 0) newErrors.appointments = "Select at least one appointment"

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
      appointmentIds: [...selectedIds],
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
    appointments,
    isLoadingEligible,
    hasSearched,
    canSearch,
    selectedIds,
    toggleAppointment,
    setAppointmentsSelected,
    orphanSelections,
    billingCodeLabels,
    // Submit
    handleSubmit,
    isSaving: mutation.isLoading,
    errors,
  }
}
