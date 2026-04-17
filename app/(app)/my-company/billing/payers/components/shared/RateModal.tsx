"use client"

import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { CustomModal } from "@/components/custom/CustomModal"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { PremiumDatePicker } from "@/components/custom/PremiumDatePicker"
import { Button } from "@/components/custom/Button"
import type { LocalInsurancePlanRate } from "@/lib/types/payer.types"
import type { BillingCodeListItem } from "@/lib/types/billing-code.types"
import { formatBillingCodeDisplay } from "@/lib/utils/billing-code-display"

const INTERVAL_OPTIONS = [
  { value: "EVENT", label: "Event" },
  { value: "UNIT", label: "Unit" },
  { value: "HOUR", label: "Hour" },
]

const rateFormSchema = z.object({
  billingCodeId: z.string().min(1, "Billing code is required"),
  amount: z.coerce
    .number({ invalid_type_error: "Amount is required" })
    .min(0, "Amount is required"),
  submitAmount: z.coerce
    .number({ invalid_type_error: "Invalid number" })
    .min(0, "Must be >= 0")
    .optional()
    .or(z.literal(Number.NaN)),
  intervalType: z.string().min(1, "Interval is required"),
  currencyId: z.string().min(1, "Currency is required"),
  alias: z.string().max(200).optional().or(z.literal("")),
  startDate: z.string().optional().or(z.literal("")),
  endDate: z.string().optional().or(z.literal("")),
})

export type RateFormValues = z.infer<typeof rateFormSchema>

const emptyDefaults: RateFormValues = {
  billingCodeId: "",
  amount: Number.NaN,
  submitAmount: undefined,
  intervalType: "UNIT",
  currencyId: "",
  alias: "",
  startDate: "",
  endDate: "",
}

interface RateModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (values: RateFormValues, billingCodeLabel: string, currencyLabel: string, billingModifier?: string) => void | Promise<void>
  editingRate: LocalInsurancePlanRate | null
  billingCodes: BillingCodeListItem[]
  usedBillingCodeIds: string[]
  currencies: Array<{ id: string; name: string; code?: string }>
  isLoadingBillingCodes?: boolean
  isLoadingCurrencies?: boolean
}

export function RateModal({
  open,
  onClose,
  onConfirm,
  editingRate,
  billingCodes,
  usedBillingCodeIds,
  currencies,
  isLoadingBillingCodes = false,
  isLoadingCurrencies = false,
}: RateModalProps) {
  const form = useForm<RateFormValues>({
    resolver: zodResolver(rateFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: emptyDefaults,
  })

  useEffect(() => {
    if (editingRate) {
      form.reset({
        billingCodeId: editingRate.billingCodeId,
        amount: editingRate.amount,
        submitAmount: editingRate.submitAmount,
        intervalType: editingRate.intervalType,
        currencyId: editingRate.currencyId,
        alias: editingRate.alias ?? "",
        startDate: editingRate.startDate ?? "",
        endDate: editingRate.endDate ?? "",
      })
    } else {
      const usdCurrency = currencies.find((c) => c.code === "USD")
      form.reset({ ...emptyDefaults, currencyId: usdCurrency?.id ?? "" })
    }
  }, [editingRate, open, form, currencies])

  const billingCodeOptions = billingCodes
    .filter(
      (bc) =>
        bc.active !== false &&
        (!usedBillingCodeIds.includes(bc.id) || editingRate?.billingCodeId === bc.id)
    )
    .map((bc) => ({
      value: bc.id,
      label: formatBillingCodeDisplay({ type: bc.type, code: bc.code, modifier: bc.modifier }),
    }))

  const currencyOptions = currencies.map((c) => ({
    value: c.id,
    label: c.code ? `${c.name} (${c.code})` : c.name,
  }))

  const handleSubmit = form.handleSubmit((values) => {
    const selectedBC = billingCodes.find((bc) => bc.id === values.billingCodeId)
    const billingCodeLabel = selectedBC
      ? formatBillingCodeDisplay({ type: selectedBC.type, code: selectedBC.code })
      : values.billingCodeId
    const billingModifier = selectedBC?.modifier?.trim() || undefined

    const selectedCurrency = currencies.find((c) => c.id === values.currencyId)
    const currencyLabel = selectedCurrency
      ? selectedCurrency.code
        ? `${selectedCurrency.name} (${selectedCurrency.code})`
        : selectedCurrency.name
      : values.currencyId

    onConfirm(values, billingCodeLabel, currencyLabel, billingModifier)
  })

  const handleClose = () => {
    form.reset(emptyDefaults)
    onClose()
  }

  return (
    <CustomModal
      open={open}
      onOpenChange={(o) => { if (!o) handleClose() }}
      title={editingRate ? "Edit Rate" : "Add Rate"}
      maxWidthClassName="sm:max-w-[680px]"
      contentClassName="overflow-visible"
      allowSelectOverflow
    >
      <form
        onSubmit={(e) => { e.preventDefault(); void handleSubmit() }}
        noValidate
        className="px-6 py-5 space-y-5"
      >
        {/* Billing Code — full width */}
        <Controller
          name="billingCodeId"
          control={form.control}
          render={({ field, fieldState }) => (
            <div>
              <FloatingSelect
                label="Billing Code"
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                options={billingCodeOptions}
                searchable
                hasError={!!fieldState.error}
                required
                disabled={!!editingRate || isLoadingBillingCodes}
              />
              {fieldState.error && (
                <p className="mt-1.5 text-sm text-red-600">{fieldState.error.message}</p>
              )}
              {!editingRate && !isLoadingBillingCodes && billingCodeOptions.length === 0 && (
                <p className="mt-1.5 text-sm text-amber-600">
                  No billing codes available. Please create billing codes first.
                </p>
              )}
            </div>
          )}
        />

        {/* 2-column grid for rest of fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Amount */}
          <Controller
            name="amount"
            control={form.control}
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
                {fieldState.error && (
                  <p className="mt-1.5 text-sm text-red-600">{fieldState.error.message}</p>
                )}
              </div>
            )}
          />

          {/* Submit Amount */}
          <Controller
            name="submitAmount"
            control={form.control}
            render={({ field, fieldState }) => (
              <div>
                <FloatingInput
                  label="Submit Amount"
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
                {fieldState.error && (
                  <p className="mt-1.5 text-sm text-red-600">{fieldState.error.message}</p>
                )}
              </div>
            )}
          />

          {/* Interval Type */}
          <Controller
            name="intervalType"
            control={form.control}
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
                {fieldState.error && (
                  <p className="mt-1.5 text-sm text-red-600">{fieldState.error.message}</p>
                )}
              </div>
            )}
          />

          {/* Currency */}
          <Controller
            name="currencyId"
            control={form.control}
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
                {fieldState.error && (
                  <p className="mt-1.5 text-sm text-red-600">{fieldState.error.message}</p>
                )}
              </div>
            )}
          />

          {/* Alias */}
          <Controller
            name="alias"
            control={form.control}
            render={({ field, fieldState }) => (
              <div>
                <FloatingInput
                  label="Alias"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  hasError={!!fieldState.error}
                  autoComplete="off"
                />
                {fieldState.error && (
                  <p className="mt-1.5 text-sm text-red-600">{fieldState.error.message}</p>
                )}
              </div>
            )}
          />

          {/* Spacer for alignment */}
          <div className="hidden md:block" />

          {/* Start Date */}
          <Controller
            name="startDate"
            control={form.control}
            render={({ field, fieldState }) => (
              <PremiumDatePicker
                label="Start Date"
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                onClear={() => field.onChange("")}
                hasError={!!fieldState.error}
                errorMessage={fieldState.error?.message}
              />
            )}
          />

          {/* End Date */}
          <Controller
            name="endDate"
            control={form.control}
            render={({ field, fieldState }) => (
              <PremiumDatePicker
                label="End Date"
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                onClear={() => field.onChange("")}
                hasError={!!fieldState.error}
                errorMessage={fieldState.error?.message}
              />
            )}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end border-t border-slate-200 pt-5">
          <div className="flex items-center gap-3">
            <Button type="button" variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={form.formState.isSubmitting}
              disabled={form.formState.isSubmitting || isLoadingBillingCodes || (!editingRate && billingCodeOptions.length === 0)}
            >
              {editingRate ? "Update" : "Add Rate"}
            </Button>
          </div>
        </div>
      </form>
    </CustomModal>
  )
}
