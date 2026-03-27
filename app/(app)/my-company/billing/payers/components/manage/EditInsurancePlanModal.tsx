"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { Loader2, Pencil } from "lucide-react"
import { Button } from "@/components/custom/Button"
import { CustomModal } from "@/components/custom/CustomModal"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { FloatingTextarea } from "@/components/custom/FloatingTextarea"
import { MultiSelect } from "@/components/custom/MultiSelect"
import { PremiumDatePicker } from "@/components/custom/PremiumDatePicker"
import { Tabs, type TabItem } from "@/components/custom/Tabs"
import { CustomTable, type CustomTableColumn } from "@/components/custom/CustomTable"
import { useBillingCodesCatalog } from "@/lib/modules/billing-codes/hooks/use-billing-codes-catalog"
import { useCurrencyCatalog } from "@/lib/modules/currencies/hooks/use-currency-catalog"
import { usePlanTypeCatalog } from "@/lib/modules/payers/hooks/use-plan-type-catalog"
import {
  createInsurancePlanGeneral,
  createInsurancePlanRate,
  getInsurancePlanForPayer,
  mapInsurancePlanDetailToGeneral,
  mapInsurancePlanDetailToRates,
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
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "BIWEEKLY", label: "Biweekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "YEARLY", label: "Yearly" },
]

interface EditInsurancePlanModalProps {
  payer: Payer | null
  open: boolean
  onOpenChange: (next: boolean) => void
  onSaved: () => void
}

function formatDisplayDate(iso: string) {
  if (!iso?.trim()) return "—"
  const [y, m, d] = iso.split("-").map(Number)
  if (!y || !m || !d) return iso
  try {
    return format(new Date(y, m - 1, d), "MM/dd/yyyy")
  } catch {
    return iso
  }
}

export function EditInsurancePlanModal({ payer, open, onOpenChange, onSaved }: EditInsurancePlanModalProps) {
  const { planTypes, isLoading: isLoadingPlanTypes } = usePlanTypeCatalog()
  const { currencies, isLoading: isLoadingCurrencies } = useCurrencyCatalog()
  const { catalogCodes, isLoading: isLoadingBillingCodes } = useBillingCodesCatalog()
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [rates, setRates] = useState<InsurancePlanRateRow[]>([])
  const [resolvedPlanId, setResolvedPlanId] = useState<string | null>(null)
  const [tabsKey, setTabsKey] = useState(0)
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

  const billingOptions = catalogCodes.map((bc) => ({
    value: bc.id,
    label: `${bc.code} (${bc.type})`,
  }))

  const billingLabelById = useMemo(() => {
    const m = new Map<string, string>()
    for (const bc of catalogCodes) {
      m.set(bc.id, `${bc.code} (${bc.type})`)
    }
    return m
  }, [catalogCodes])

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

  const refreshPlanFromServer = useCallback(async () => {
    if (!payer?.id) return
    const data = await getInsurancePlanForPayer(payer.id)
    if (!data) {
      generalForm.reset(getInsurancePlanGeneralEmptyDefaults())
      setRates([])
      setResolvedPlanId(null)
      return
    }
    generalForm.reset(mapInsurancePlanDetailToGeneral(data))
    setRates(mapInsurancePlanDetailToRates(data))
    if (data.id) setResolvedPlanId(data.id)
  }, [payer?.id, generalForm])

  useEffect(() => {
    if (!open) return
    setTabsKey((k) => k + 1)
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

  useEffect(() => {
    if (!open || !payer) return

    generalForm.reset(getInsurancePlanGeneralEmptyDefaults())
    setRates([])
    setResolvedPlanId(null)
    rateForm.reset(getInsurancePlanRateEmptyDefaults(""))

    let cancelled = false
    setIsLoadingDetail(true)

    getInsurancePlanForPayer(payer.id)
      .then((data) => {
        if (cancelled) return
        if (!data) {
          return
        }
        generalForm.reset(mapInsurancePlanDetailToGeneral(data))
        setRates(mapInsurancePlanDetailToRates(data))
        if (data.id) setResolvedPlanId(data.id)
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
  }, [open, payer, generalForm, rateForm])

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
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to save"
      toast.error(message)
    }
  })

  const openNewRateForm = () => {
    if (!effectivePlanId) {
      toast.info("Save the general plan first", {
        description: "Create the plan in the General tab before adding rates.",
      })
      return
    }
    setEditingRateId(null)
    rateForm.reset(getInsurancePlanRateEmptyDefaults(effectivePlanId))
    setShowRateForm(true)
  }

  const openEditRate = useCallback(
    (row: InsurancePlanRateRow) => {
      if (!effectivePlanId) return
      if (!row.id) {
        toast.error("This rate cannot be edited until the server returns an id. Refresh after saving.")
        return
      }
      setEditingRateId(row.id)
      rateForm.reset(mapRateRowToFormValues(row, effectivePlanId))
      setShowRateForm(true)
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
        key: "billingCodes",
        header: "Billing codes",
        render: (row) => {
          const codesSummary =
            row.billingCodeIds.length === 0
              ? "—"
              : row.billingCodeIds.map((id) => billingLabelById.get(id) ?? id).join(", ")
          return (
            <span className="max-w-[min(280px,100%)] truncate block" title={codesSummary}>
              {codesSummary}
            </span>
          )
        },
      },
      {
        key: "approvedRate",
        header: "Approved rate",
        render: (row) => {
          const cur = currencyLabelById.get(row.currencyId)
          const text = `${new Intl.NumberFormat(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(row.amount)}${cur ? ` ${cur}` : ""}`
          return <span>{text}</span>
        },
      },
      {
        key: "submitRate",
        header: "Submit rate",
        render: (row) => {
          const cur = currencyLabelById.get(row.currencyId)
          const text = `${new Intl.NumberFormat(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(row.submitAmount)}${cur ? ` ${cur}` : ""}`
          return <span>{text}</span>
        },
      },
      {
        key: "startDate",
        header: "Start date",
        render: (row) => <span>{formatDisplayDate(row.startDate)}</span>,
      },
      {
        key: "endDate",
        header: "End date",
        render: (row) => <span>{formatDisplayDate(row.endDate)}</span>,
      },
      {
        key: "actions",
        header: "Actions",
        align: "right",
        render: (row) => (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              className="gap-1.5 text-[#037ECC]"
              data-row-no-click="true"
              onClick={() => openEditRate(row)}
              disabled={!row.id}
              title={!row.id ? "Rate id missing from server" : "Edit rate"}
              aria-label="Edit rate"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          </div>
        ),
      },
    ],
    [billingLabelById, currencyLabelById, openEditRate],
  )

  const cancelRateForm = () => {
    setShowRateForm(false)
    setEditingRateId(null)
    if (effectivePlanId) {
      rateForm.reset(getInsurancePlanRateEmptyDefaults(effectivePlanId))
    }
  }

  const handleRateSubmit = rateForm.handleSubmit(async (values) => {
    if (!payer || !effectivePlanId) return
    const v = {
      ...values,
      insurancePlanId: effectivePlanId,
    }
    try {
      if (editingRateId) {
        await updateInsurancePlanRate(effectivePlanId, editingRateId, v)
        toast.success("Rate updated")
      } else {
        await createInsurancePlanRate(effectivePlanId, v)
        toast.success("Rate added")
      }
      setShowRateForm(false)
      setEditingRateId(null)
      rateForm.reset(getInsurancePlanRateEmptyDefaults(effectivePlanId))
      onSaved()
      await refreshPlanFromServer()
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to save rate"
      toast.error(message)
    }
  })

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
          name="amount"
          control={rateForm.control}
          render={({ field, fieldState }) => (
            <div>
              <FloatingInput
                label="Amount"
                value={field.value === 0 || field.value === undefined ? "" : String(field.value)}
                onChange={(v) => field.onChange(v === "" ? 0 : Number(v))}
                onBlur={field.onBlur}
                type="number"
                inputMode="decimal"
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
                value={field.value === 0 || field.value === undefined ? "" : String(field.value)}
                onChange={(v) => field.onChange(v === "" ? 0 : Number(v))}
                onBlur={field.onBlur}
                type="number"
                inputMode="decimal"
                hasError={!!fieldState.error}
                required
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
                label="Interval type"
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
              hasError={!!fieldState.error}
              errorMessage={fieldState.error?.message}
              required
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
              hasError={!!fieldState.error}
              errorMessage={fieldState.error?.message}
              required
            />
          )}
        />
        <div className="md:col-span-2">
          <Controller
            name="billingCodeIds"
            control={rateForm.control}
            render={({ field, fieldState }) => (
              <div>
                <MultiSelect
                  label="Billing codes"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  options={billingOptions}
                  disabled={isLoadingBillingCodes}
                  hasError={!!fieldState.error}
                  searchable
                  placeholder=""
                  searchPlaceholder=""
                  dropdownPosition="top"
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
          {effectivePlanId
            ? "Add one or more rates for this plan."
            : "Save the plan in the General tab to enable rates."}
        </p>
        <Button
          type="button"
          variant="secondary"
          onClick={openNewRateForm}
          disabled={!effectivePlanId || showRateForm}
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
      onOpenChange={onOpenChange}
      title="Edit insurance plan"
      description="Update plan details and manage rates"
      maxWidthClassName="sm:max-w-[960px]"
      contentClassName="overflow-visible"
      allowSelectOverflow
    >
      {isLoadingDetail && (
        <div className="flex flex-col items-center justify-center gap-3 py-12 px-6 text-slate-500">
          <Loader2 className="h-10 w-10 animate-spin text-[#037ECC]" />
          <p className="text-sm font-medium">Loading insurance plan…</p>
        </div>
      )}
      {!isLoadingDetail && (
        <div className="pb-2">
          <Tabs key={tabsKey} items={tabItems} defaultTab="general" />
        </div>
      )}
    </CustomModal>
  )
}
