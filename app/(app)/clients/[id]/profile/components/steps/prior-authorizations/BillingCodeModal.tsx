"use client"

import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CustomModal } from "@/components/custom/CustomModal"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { Button } from "@/components/custom/Button"
import {
  billingCodeEntryDefaults,
  billingCodeEntrySchema,
  UNITS_INTERVAL_OPTIONS,
  type BillingCodeEntryValues,
} from "@/lib/schemas/prior-authorization-form.schema"
import type { LocalBillingCodeEntry } from "@/lib/types/prior-authorization.types"
import type { BillingCodeListItem } from "@/lib/types/billing-code.types"
import { cn } from "@/lib/utils"
import { formatBillingCodeDisplay } from "@/lib/utils/billing-code-display"
import { resolveBillingCodeAutoUnits } from "@/lib/constants/billing-code-rules"

interface BillingCodeModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (values: BillingCodeEntryValues, billingCodeLabel: string) => void | Promise<void>
  editingCode?: LocalBillingCodeEntry | null
  billingCodes: BillingCodeListItem[]
  usedBillingCodeIds?: string[]
  isLoading?: boolean
  isLoadingCatalog?: boolean
}

export function BillingCodeModal({
  open,
  onClose,
  onConfirm,
  editingCode,
  billingCodes,
  usedBillingCodeIds = [],
  isLoading = false,
  isLoadingCatalog = false,
}: BillingCodeModalProps) {
  const form = useForm<BillingCodeEntryValues>({
    resolver: zodResolver(billingCodeEntrySchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: billingCodeEntryDefaults,
  })

  // Populate form when editing
  useEffect(() => {
    if (editingCode) {
      form.reset({
        billingCodeId: editingCode.billingCodeId,
        approvedUnits: editingCode.approvedUnits,
        usedUnits: editingCode.usedUnits,
        unitsInterval: editingCode.unitsInterval,
        maxUnitsPerDay: editingCode.maxUnitsPerDay ?? null,
        maxUnitsPerWeek: editingCode.maxUnitsPerWeek ?? null,
        maxUnitsPerMonth: editingCode.maxUnitsPerMonth ?? null,
        maxCountPerDay: editingCode.maxCountPerDay ?? null,
        maxCountPerWeek: editingCode.maxCountPerWeek ?? null,
        maxCountPerMonth: editingCode.maxCountPerMonth ?? null,
      })
    } else {
      form.reset(billingCodeEntryDefaults)
    }
  }, [editingCode, open, form])

  const billingCodeOptions = billingCodes
    .filter(
      (bc) =>
        (bc.active !== false) &&
        (!usedBillingCodeIds.includes(bc.id) || editingCode?.billingCodeId === bc.id)
    )
    .map((bc) => ({
      value: bc.id,
      label: formatBillingCodeDisplay({ type: bc.type, code: bc.code, modifier: bc.modifier }),
    }))

  const handleSubmit = form.handleSubmit((values) => {
    const selected = billingCodes.find((bc) => bc.id === values.billingCodeId)
    const label = selected
      ? formatBillingCodeDisplay({
          type: selected.type,
          code: selected.code,
          modifier: selected.modifier,
        })
      : values.billingCodeId
    onConfirm(values, label)
  })

  const handleClose = () => {
    form.reset(billingCodeEntryDefaults)
    onClose()
  }

  return (
    <CustomModal
      open={open}
      onOpenChange={(o) => { if (!o) handleClose() }}
      title={editingCode ? "Edit authorization code" : "New authorization code"}
      maxWidthClassName="sm:max-w-[600px]"
      allowSelectOverflow
      contentClassName="overflow-visible"
    >
      <form
        onSubmit={(e) => { e.preventDefault(); void handleSubmit() }}
        noValidate
        className="px-6 py-5 space-y-5"
      >
        {/* Billing Code Select */}
        <Controller
          name="billingCodeId"
          control={form.control}
          render={({ field, fieldState }) => (
            <div>
              <FloatingSelect
                label="Allowed Billing Code"
                value={field.value}
                onChange={(id) => {
                  field.onChange(id)
                  const selectedBillingCode = billingCodes.find((bc) => bc.id === id)
                  const autoUnits = resolveBillingCodeAutoUnits({
                    type: selectedBillingCode?.type,
                    code: selectedBillingCode?.code,
                    modifier: selectedBillingCode?.modifier,
                  })
                  form.setValue(
                    "approvedUnits",
                    autoUnits !== undefined ? autoUnits : (null as unknown as number),
                  )
                }}
                onBlur={field.onBlur}
                options={billingCodeOptions}
                searchable
                hasError={!!fieldState.error}
                required
                disabled={!!editingCode || isLoadingCatalog}
              />
              {fieldState.error && (
                <p className="mt-1.5 text-sm text-red-600">{fieldState.error.message}</p>
              )}
              {!editingCode && !isLoadingCatalog && billingCodeOptions.length === 0 && (
                <p className="mt-1.5 text-sm text-amber-600">
                  No billing codes available. Please create billing codes first in My Company → Billing → Billing Codes.
                </p>
              )}
            </div>
          )}
        />

        {/* Units row */}
        <div className="grid grid-cols-3 gap-4">
          {/* Used units — read-only */}
          <div>
            <div className="relative">
              <div
                className={cn(
                  "w-full h-[52px] 2xl:h-[56px] px-4 rounded-[16px] flex items-center",
                  "bg-slate-50 border border-slate-200 text-slate-500 text-[15px]",
                  "cursor-not-allowed select-none"
                )}
              >
                {form.watch("usedUnits") ?? 0}
              </div>
              <label className="absolute left-4 px-1 top-0 -translate-y-1/2 text-xs text-slate-400 bg-white/80 pointer-events-none">
                Used Units
              </label>
            </div>
            <p className="mt-1 text-xs text-slate-400">Auto-updated by billing</p>
          </div>

          {/* Approved units */}
          <Controller
            name="approvedUnits"
            control={form.control}
            render={({ field, fieldState }) => (
              <div>
                <FloatingInput
                  label="Approved Units"
                  value={field.value === null || field.value === undefined ? "" : String(field.value)}
                  onChange={(v) => {
                    if (v === "") {
                      field.onChange(null as unknown as number)
                      return
                    }
                    const parsed = parseInt(v, 10)
                    if (!isNaN(parsed)) field.onChange(parsed)
                  }}
                  onBlur={field.onBlur}
                  inputMode="numeric"
                  hasError={!!fieldState.error}
                  required
                />
                {fieldState.error && (
                  <p className="mt-1.5 text-sm text-red-600">{fieldState.error.message}</p>
                )}
              </div>
            )}
          />

          {/* Units Interval */}
          <Controller
            name="unitsInterval"
            control={form.control}
            render={({ field, fieldState }) => (
              <div>
                <FloatingSelect
                  label="Units Interval"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  options={UNITS_INTERVAL_OPTIONS}
                  hasError={!!fieldState.error}
                  required
                />
                {fieldState.error && (
                  <p className="mt-1.5 text-sm text-red-600">{fieldState.error.message}</p>
                )}
              </div>
            )}
          />
        </div>

        {/* Max Units per period */}
        
     

        {/* Actions */}
        <div className="flex items-center justify-end border-t border-slate-200 pt-5">
          <div className="flex items-center gap-3">
            <Button type="button" variant="secondary" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isLoading}
              disabled={isLoading || isLoadingCatalog || (!editingCode && billingCodeOptions.length === 0)}
            >
              {editingCode ? "Update" : "Add Code"}
            </Button>
          </div>
        </div>
      </form>
    </CustomModal>
  )
}
