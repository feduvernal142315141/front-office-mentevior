"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Edit2, Loader2 } from "lucide-react"
import { Button } from "@/components/custom/Button"
import { CustomModal } from "@/components/custom/CustomModal"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { FloatingTextarea } from "@/components/custom/FloatingTextarea"
import { PremiumDatePicker } from "@/components/custom/PremiumDatePicker"
import { Tabs, type TabItem } from "@/components/custom/Tabs"
import { CustomTable, type CustomTableColumn } from "@/components/custom/CustomTable"
import { useBillingCodes } from "@/lib/modules/billing-codes/hooks/use-billing-codes"
import { useCurrencyCatalog } from "@/lib/modules/currencies/hooks/use-currency-catalog"
import { usePlanTypeCatalog } from "@/lib/modules/payers/hooks/use-plan-type-catalog"
import {
  createInsurancePlanGeneral,
  createInsurancePlanRate,
  getInsurancePlanForPayer,
  getRateById,
  getRatesByPayerId,
  mapInsurancePlanDetailToGeneral,
  mapRateRowToFormValues,
  updateInsurancePlanGeneral,
  updateInsurancePlanRate,
} from "@/lib/modules/payers/services/insurance-plan.service"
import {
  getInsurancePlanGeneralEmptyDefaults,
  getInsurancePlanRateEmptyDefaults,
  insurancePlanGeneralSchema,
  insurancePlanRateRowSchema,
  type InsurancePlanGeneralValues,
  type InsurancePlanRateRowValues,
} from "@/lib/schemas/insurance-plan-modal.schema"
import type { InsurancePlanRateRow } from "@/lib/types/insurance-plan-rate.types"
import type { Payer } from "@/lib/types/payer.types"
import { toast } from "sonner"

const INTERVAL_OPTIONS = [
  { value: "EVENT", label: "Event" },
  { value: "UNIT", label: "Unit" },
  { value: "HOUR", label: "Hour" },
  
]

interface EditInsurancePlanModalProps {
  payer: Payer | null
  open: boolean
  onOpenChange: (next: boolean) => void
  onSaved: (payload?: { rates?: InsurancePlanRateRow[] }) => void
}

/** Rates vienen de GET /rates/by-payer-id; filtrar por plan cuando el API envía insurancePlanId */
function ratesForPlanEntity(rows: InsurancePlanRateRow[], planEntityId: string | null): InsurancePlanRateRow[] {
  if (!planEntityId?.trim()) return rows
  const id = planEntityId.trim()
  return rows.filter((r) => !r.insurancePlanId?.trim() || r.insurancePlanId === id)
}

export function EditInsurancePlanModal({ payer, open, onOpenChange, onSaved }: EditInsurancePlanModalProps) {
  const { planTypes, isLoading: isLoadingPlanTypes } = usePlanTypeCatalog()
  const { currencies, isLoading: isLoadingCurrencies } = useCurrencyCatalog()
  const { billingCodes, isLoading: isLoadingBillingCodes } = useBillingCodes({ page: 0, pageSize: 100 })
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [isLoadingRate, setIsLoadingRate] = useState(false)
  const [rates, setRates] = useState<InsurancePlanRateRow[]>([])
  const [resolvedPlanId, setResolvedPlanId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("general")
  const [showRateForm, setShowRateForm] = useState(false)
  const [editingRateId, setEditingRateId] = useState<string | null>(null)
  const [ratesPage, setRatesPage] = useState(1)
  const [ratesPageSize, setRatesPageSize] = useState(10)

  const generalForm = useForm<InsurancePlanGeneralValues>({
    resolver: zodResolver(insurancePlanGeneralSchema),
    defaultValues: getInsurancePlanGeneralEmptyDefaults(),
    mode: "onSubmit",
  })

  const rateForm = useForm<InsurancePlanRateRowValues>({
    resolver: zodResolver(insurancePlanRateRowSchema),
    defaultValues: getInsurancePlanRateEmptyDefaults(""),
    mode: "onSubmit",
  })

  const payerPlanId = payer?.insurancePlanId?.trim() ?? ""
  const effectivePlanId = payerPlanId || resolvedPlanId || ""

  const billingOptions = billingCodes.map((bc) => ({
    value: bc.id,
    label: `${bc.code} (${bc.type})`,
  }))

  const usdCurrencyId = useMemo(
    () => currencies.find((c) => c.code?.toUpperCase() === "USD")?.id ?? "",
    [currencies],
  )

  const currencyLabelById = useMemo(() => {
    const m = new Map<string, string>()
    for (const c of currencies) {
      m.set(c.id, c.code ? `${c.name} (${c.code})` : c.name)
    }
    return m
  }, [currencies])

  const planTypeOptions = planTypes.map((p) => ({ value: p.id, label: p.name }))
  const currencyOptions = currencies.map((c) => ({
    value: c.id,
    label: c.code ? `${c.name} (${c.code})` : c.name,
  }))

  const refreshRatesFromServer = useCallback(async () => {
    if (!payer?.id) return
    const ratesList = await getRatesByPayerId(payer.id)
    const planEntityId = resolvedPlanId ?? payerPlanId ?? null
    setRates(ratesForPlanEntity(ratesList, planEntityId))
  }, [payer?.id, resolvedPlanId, payerPlanId])

  const refreshPlanFromServer = useCallback(async () => {
    if (!payer?.id) return
    const [data, ratesList] = await Promise.all([
      getInsurancePlanForPayer(payer.id),
      getRatesByPayerId(payer.id),
    ])
    if (!data) {
      generalForm.reset(getInsurancePlanGeneralEmptyDefaults())
      setRates([])
      setResolvedPlanId(null)
      return
    }
    generalForm.reset(mapInsurancePlanDetailToGeneral(data))
    const planEntityId = data.id?.trim() ?? null
    if (planEntityId) setResolvedPlanId(planEntityId)
    setRates(ratesForPlanEntity(ratesList, planEntityId))
  }, [payer?.id, generalForm])

  useEffect(() => {
    if (!open) return
    setActiveTab("general")
    setShowRateForm(false)
    setEditingRateId(null)
    setRatesPage(1)
  }, [open])

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(rates.length / ratesPageSize) || 1)
    if (ratesPage > totalPages) {
      setRatesPage(totalPages)
    }
  }, [rates.length, ratesPage, ratesPageSize])

  const payerIdRef = useRef<string | null>(null)
  if (payer?.id) payerIdRef.current = payer.id

  useEffect(() => {
    if (!open) return
    const payerId = payerIdRef.current
    if (!payerId) return

    generalForm.reset(getInsurancePlanGeneralEmptyDefaults())
    setRates([])
    setResolvedPlanId(null)
    rateForm.reset(getInsurancePlanRateEmptyDefaults(""))

    let cancelled = false
    setIsLoadingDetail(true)

    Promise.all([getInsurancePlanForPayer(payerId), getRatesByPayerId(payerId)])
      .then(([data, ratesList]) => {
        if (cancelled) return
        if (!data) {
          setRates([])
          return
        }
        generalForm.reset(mapInsurancePlanDetailToGeneral(data))
        const planEntityId = data.id?.trim() ?? null
        if (planEntityId) setResolvedPlanId(planEntityId)
        setRates(ratesForPlanEntity(ratesList, planEntityId))
      })
      .catch((e: unknown) => {
        if (cancelled) return
        const message = e instanceof Error ? e.message : "Failed to load insurance plan"
        toast.error(message)
        generalForm.reset(getInsurancePlanGeneralEmptyDefaults())
        setRates([])
      })
      .finally(() => {
        if (!cancelled) setIsLoadingDetail(false)
      })

    return () => {
      cancelled = true
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleGeneralSubmit = generalForm.handleSubmit(async (data) => {
    if (!payer) return
    try {
      if (effectivePlanId) {
        await updateInsurancePlanGeneral(payer.id, {
          id: effectivePlanId,
          planName: data.planName.trim(),
          planTypeId: data.planTypeId,
          comments: data.comments ?? "",
        })
        toast.success("Plan details saved")
        onSaved()
        await refreshPlanFromServer()
      } else {
        const { planId } = await createInsurancePlanGeneral(payer.id, {
          planName: data.planName.trim(),
          planTypeId: data.planTypeId,
          comments: data.comments ?? "",
        })
        if (planId) setResolvedPlanId(planId)
        toast.success("Insurance plan created")
        onSaved()
        await refreshPlanFromServer()
      }
      setShowRateForm(false)
      setEditingRateId(null)
      setActiveTab("rates")
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to save"
      toast.error(message)
    }
  })

  const openNewRateForm = () => {
    setEditingRateId(null)
    rateForm.reset(getInsurancePlanRateEmptyDefaults(effectivePlanId, usdCurrencyId))
    setShowRateForm(true)
  }

  const openEditRate = useCallback(
    async (row: InsurancePlanRateRow) => {
      if (!row.id) {
        toast.error("This rate cannot be edited until the server returns an id. Refresh after saving.")
        return
      }
      setIsLoadingRate(true)
      try {
        const rate = await getRateById(row.id)
        setEditingRateId(row.id)
        rateForm.reset(mapRateRowToFormValues(rate, row.insurancePlanId || effectivePlanId))
        setShowRateForm(true)
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to load rate"
        toast.error(message)
      } finally {
        setIsLoadingRate(false)
      }
    },
    [effectivePlanId, rateForm],
  )

  const paginatedRates = useMemo(() => {
    const start = (ratesPage - 1) * ratesPageSize
    return rates.slice(start, start + ratesPageSize)
  }, [rates, ratesPage, ratesPageSize])

  const ratesTableColumns: CustomTableColumn<InsurancePlanRateRow>[] = useMemo(
    () => [
      {
        key: "amount",
        header: "Amount",
        className: "whitespace-nowrap",
        render: (row) => (
          <span>
            {new Intl.NumberFormat(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(row.amount)}
          </span>
        ),
      },
      {
        key: "intervalType",
        header: "Interval",
        className: "whitespace-nowrap",
        render: (row) => {
          const label = INTERVAL_OPTIONS.find((o) => o.value === row.intervalType)?.label ?? row.intervalType
          return <span>{label || "—"}</span>
        },
      },
      {
        key: "currency",
        header: "Currency",
        className: "whitespace-nowrap",
        render: (row) => <span>{row.currencyCode || currencyLabelById.get(row.currencyId) || "—"}</span>,
      },
      {
        key: "billingCode",
        header: "Billing code",
        className: "whitespace-nowrap",
        render: (row) => {
          const codeId = row.billingCodeId
          if (!codeId) return <span>{"—"}</span>
          const match = billingCodes.find((bc) => bc.id === codeId)
          return <span>{match ? `${match.code} (${match.type})` : codeId}</span>
        },
      },
      {
        key: "actions",
        header: "Actions",
        className: "whitespace-nowrap",
        align: "right",
        render: (row) => (
          <div className="flex justify-end">
            <button
              type="button"
              data-row-no-click="true"
              onClick={() => void openEditRate(row)}
              disabled={!row.id || isLoadingRate}
              title={!row.id ? "Rate id missing from server" : "Edit rate"}
              aria-label="Edit rate"
              className="group/edit relative h-9 w-9 flex items-center justify-center rounded-xl bg-gradient-to-b from-blue-50 to-blue-100/80 border border-blue-200/60 shadow-sm shadow-blue-900/5 hover:from-blue-100 hover:to-blue-200/90 hover:border-blue-300/80 hover:shadow-md hover:shadow-blue-900/10 hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Edit2 className="w-4 h-4 text-blue-600 group-hover/edit:text-blue-700 transition-colors duration-200" />
            </button>
          </div>
        ),
      },
    ],
    [currencyLabelById, billingCodes, openEditRate, isLoadingRate],
  )

  const cancelRateForm = () => {
    setShowRateForm(false)
    setEditingRateId(null)
    if (effectivePlanId) {
      rateForm.reset(getInsurancePlanRateEmptyDefaults(effectivePlanId, usdCurrencyId))
    }
  }

  const handleRateSubmit = rateForm.handleSubmit(async (values) => {
    if (!payer) return
    const v = {
      ...values,
      insurancePlanId: values.insurancePlanId || effectivePlanId,
    }
    try {
      if (editingRateId) {
        await updateInsurancePlanRate(editingRateId, v)
      } else {
        await createInsurancePlanRate(payer.id, effectivePlanId, v)
      }
      setShowRateForm(false)
      setEditingRateId(null)
      rateForm.reset(getInsurancePlanRateEmptyDefaults(effectivePlanId, usdCurrencyId))
      await refreshRatesFromServer()
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to save rate"
      toast.error(message)
    }
  })

  const handleModalOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        onSaved({ rates })
      }
      onOpenChange(next)
    },
    [onOpenChange, onSaved, rates],
  )

  const rateFormSection = (
    <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Controller
          name="alias"
          control={rateForm.control}
          render={({ field, fieldState }) => (
            <div>
              <FloatingInput
                label="Alias"
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder=" "
                hasError={!!fieldState.error}
                autoComplete="off"
              />
              {fieldState.error && <p className="text-sm text-red-600 mt-2">{fieldState.error.message}</p>}
            </div>
          )}
        />
        <Controller
          name="amount"
          control={rateForm.control}
          render={({ field, fieldState }) => (
            <div>
              <FloatingInput
                label="Amount"
                value={
                  field.value === undefined ||
                  field.value === null ||
                  Number.isNaN(field.value)
                    ? ""
                    : String(field.value)
                }
                onChange={(v) => {
                  const digits = v.replace(/\D/g, "")
                  field.onChange(digits === "" ? Number.NaN : Number(digits))
                }}
                onBlur={field.onBlur}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                hasError={!!fieldState.error}
                required
                autoComplete="off"
              />
              {fieldState.error && <p className="text-sm text-red-600 mt-2">{fieldState.error.message}</p>}
            </div>
          )}
        />
        <Controller
          name="submitAmount"
          control={rateForm.control}
          render={({ field, fieldState }) => (
            <div>
              <FloatingInput
                label="Submit amount"
                value={
                  field.value === undefined ||
                  field.value === null ||
                  Number.isNaN(field.value)
                    ? ""
                    : String(field.value)
                }
                onChange={(v) => {
                  const digits = v.replace(/\D/g, "")
                  field.onChange(digits === "" ? Number.NaN : Number(digits))
                }}
                onBlur={field.onBlur}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                hasError={!!fieldState.error}
                autoComplete="off"
              />
              {fieldState.error && <p className="text-sm text-red-600 mt-2">{fieldState.error.message}</p>}
            </div>
          )}
        />
        <Controller
          name="intervalType"
          control={rateForm.control}
          render={({ field, fieldState }) => (
            <div>
              <FloatingSelect
                label="Interval"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                options={INTERVAL_OPTIONS}
                hasError={!!fieldState.error}
                searchable
                required
              />
              {fieldState.error && <p className="text-sm text-red-600 mt-2">{fieldState.error.message}</p>}
            </div>
          )}
        />
        <Controller
          name="currencyId"
          control={rateForm.control}
          render={({ field, fieldState }) => (
            <div>
              <FloatingSelect
                label="Currency"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                options={currencyOptions}
                hasError={!!fieldState.error}
                disabled={isLoadingCurrencies}
                searchable
                required
              />
              {fieldState.error && <p className="text-sm text-red-600 mt-2">{fieldState.error.message}</p>}
            </div>
          )}
        />
        <Controller
          name="startDate"
          control={rateForm.control}
          render={({ field, fieldState }) => (
            <PremiumDatePicker
              label="Start date"
              value={field.value ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              onClear={() => field.onChange("")}
              hasError={!!fieldState.error}
              errorMessage={fieldState.error?.message}
            />
          )}
        />
        <Controller
          name="endDate"
          control={rateForm.control}
          render={({ field, fieldState }) => (
            <PremiumDatePicker
              label="End date"
              value={field.value ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              onClear={() => field.onChange("")}
              hasError={!!fieldState.error}
              errorMessage={fieldState.error?.message}
            />
          )}
        />
        <div className="md:col-span-2">
          <Controller
            name="billingCodeId"
            control={rateForm.control}
            render={({ field, fieldState }) => (
              <div>
                <FloatingSelect
                  label="Billing code"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  options={billingOptions}
                  disabled={isLoadingBillingCodes}
                  hasError={!!fieldState.error}
                  searchable
                  required
                />
                {fieldState.error && <p className="text-sm text-red-600 mt-2">{fieldState.error.message}</p>}
              </div>
            )}
          />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2 border-t border-slate-200/60">
        <Button type="button" variant="ghost" onClick={cancelRateForm}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="primary"
          loading={rateForm.formState.isSubmitting}
          disabled={rateForm.formState.isSubmitting}
          onClick={() => void handleRateSubmit()}
        >
          Save
        </Button>
      </div>
    </div>
  )

  const ratesTabContent = (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          Add one or more rates for this plan.
        </p>
        <Button
          type="button"
          variant="secondary"
          onClick={openNewRateForm}
          disabled={showRateForm}
        >
          Add rate
        </Button>
      </div>

      {showRateForm && (
        <form autoComplete="off" onSubmit={(e) => e.preventDefault()}>
          {rateFormSection}
        </form>
      )}

      <CustomTable<InsurancePlanRateRow>
        columns={ratesTableColumns}
        data={paginatedRates}
        isLoading={false}
        compactEmpty
        emptyMessage='No rates yet. Use "Add rate" to create one.'
        getRowKey={(row, index) => row.id ?? `rate-${(ratesPage - 1) * ratesPageSize + index}`}
        pagination={
          rates.length > 0
            ? {
                page: ratesPage,
                pageSize: ratesPageSize,
                total: rates.length,
                onPageChange: setRatesPage,
                onPageSizeChange: (size) => {
                  setRatesPageSize(size)
                  setRatesPage(1)
                },
                pageSizeOptions: [10, 25, 50],
              }
            : undefined
        }
      />

      {!showRateForm && (
        <div className="flex justify-end pt-2 border-t border-slate-200/80">
          <Button
            type="button"
            variant="primary"
            onClick={() => handleModalOpenChange(false)}
            disabled={rateForm.formState.isSubmitting || isLoadingRate}
          >
            Save & close
          </Button>
        </div>
      )}
    </div>
  )

  const generalTabContent = (
    <form onSubmit={handleGeneralSubmit} className="space-y-6" autoComplete="off">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Controller
          name="planName"
          control={generalForm.control}
          render={({ field, fieldState }) => (
            <div>
              <FloatingInput
                label="Plan name"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder=" "
                hasError={!!fieldState.error}
                required
                autoComplete="off"
              />
              {fieldState.error && <p className="text-sm text-red-600 mt-2">{fieldState.error.message}</p>}
            </div>
          )}
        />
        <Controller
          name="planTypeId"
          control={generalForm.control}
          render={({ field, fieldState }) => (
            <div>
              <FloatingSelect
                label="Plan type"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                options={planTypeOptions}
                hasError={!!fieldState.error}
                disabled={isLoadingPlanTypes}
                searchable
                required
              />
              {fieldState.error && <p className="text-sm text-red-600 mt-2">{fieldState.error.message}</p>}
            </div>
          )}
        />
        <div className="md:col-span-2">
          <Controller
            name="comments"
            control={generalForm.control}
            render={({ field, fieldState }) => (
              <div>
                <FloatingTextarea
                  label="Comments"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  rows={4}
                  hasError={!!fieldState.error}
                />
                {fieldState.error && <p className="text-sm text-red-600 mt-2">{fieldState.error.message}</p>}
              </div>
            )}
          />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2 border-t border-slate-200/80">
        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={generalForm.formState.isSubmitting}
          disabled={generalForm.formState.isSubmitting}
        >
          Save
        </Button>
      </div>
    </form>
  )

  const tabItems: TabItem[] = [
    { id: "general", label: "General", content: generalTabContent },
    { id: "rates", label: "Rates", content: ratesTabContent },
  ]

  return (
    <CustomModal
      open={open}
      onOpenChange={handleModalOpenChange}
      title="Edit insurance plan"
      description="Update plan details and manage rates"
      maxWidthClassName="sm:max-w-[960px]"
      contentClassName="overflow-visible"
      allowSelectOverflow
      onOpenAutoFocus={(e) => e.preventDefault()}
      onInteractOutside={(e) => e.preventDefault()}
    >
      {isLoadingDetail && (
        <div className="flex flex-col items-center justify-center gap-3 py-12 px-6 text-slate-500">
          <Loader2 className="h-10 w-10 animate-spin text-[#037ECC]" />
          <p className="text-sm font-medium">Loading insurance plan…</p>
        </div>
      )}
      {!isLoadingDetail && (
        <div className="pb-2">
          <Tabs items={tabItems} activeTab={activeTab} onChange={setActiveTab} />
        </div>
      )}
    </CustomModal>
  )
}
