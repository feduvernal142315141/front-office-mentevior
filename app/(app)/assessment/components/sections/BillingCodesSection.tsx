"use client"

import { Plus, Receipt, Trash2 } from "lucide-react"
import { Button } from "@/components/custom/Button"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import type { BillingCodeRow } from "../../hooks/useAssessmentForm"

interface BillingCodesSectionProps {
  rows: BillingCodeRow[]
  options: { value: string; label: string }[]
  optionsLoading: boolean
  errors: Record<string, string>
  disabled?: boolean
  onAdd: () => void
  onRemove: (index: number) => void
  onUpdate: (index: number, field: keyof BillingCodeRow, value: string) => void
}

/** Códigos de facturación propuestos: código + unidades por período/semana + settings (location/notes) */
export function BillingCodesSection({
  rows,
  options,
  optionsLoading,
  errors,
  disabled,
  onAdd,
  onRemove,
  onUpdate,
}: BillingCodesSectionProps) {
  return (
    <div className="space-y-4">
      {rows.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 py-8">
          <Receipt className="h-6 w-6 text-slate-300" />
          <p className="text-sm text-slate-500">No proposed billing codes added</p>
        </div>
      )}

      {rows.map((row, index) => {
        const rowError = errors[`billing-code-${index}`]
        return (
          <div
            key={index}
            data-field={`billing-code-${index}`}
            className={`rounded-xl border p-4 ${rowError ? "border-red-300 bg-red-50/40" : "border-slate-200 bg-slate-50/40"}`}
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_150px_150px_auto]">
              <FloatingSelect
                label="Billing code"
                value={row.billingCodeId}
                onChange={(v) => onUpdate(index, "billingCodeId", v)}
                options={options}
                disabled={disabled || optionsLoading}
                hasError={!!rowError && !row.billingCodeId}
                searchable
              />
              <FloatingInput
                label="Units / period"
                value={row.unitsPeriod}
                onChange={(v) => onUpdate(index, "unitsPeriod", v)}
                onBlur={() => {}}
                inputMode="decimal"
                disabled={disabled}
                hasError={!!rowError && !!row.billingCodeId}
              />
              <FloatingInput
                label="Units / week"
                value={row.unitsWeek}
                onChange={(v) => onUpdate(index, "unitsWeek", v)}
                onBlur={() => {}}
                inputMode="decimal"
                disabled={disabled}
                hasError={!!rowError && !!row.billingCodeId}
              />
              <button
                type="button"
                onClick={() => onRemove(index)}
                disabled={disabled}
                className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center self-start rounded-xl border border-red-200/60 bg-gradient-to-b from-red-50 to-red-100/80 text-red-600 transition-all hover:from-red-100 hover:to-red-200/90 disabled:opacity-50"
                title="Remove billing code"
                aria-label="Remove billing code"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[220px_1fr]">
              <FloatingInput
                label="Location"
                value={row.location}
                onChange={(v) => onUpdate(index, "location", v)}
                onBlur={() => {}}
                disabled={disabled}
              />
              <FloatingInput
                label="Notes"
                value={row.notes}
                onChange={(v) => onUpdate(index, "notes", v)}
                onBlur={() => {}}
                disabled={disabled}
              />
            </div>
            {rowError && <p className="mt-2 text-xs font-medium text-red-500">{rowError}</p>}
          </div>
        )
      })}

      <Button type="button" variant="secondary" onClick={onAdd} disabled={disabled} className="gap-2 flex items-center">
        <Plus className="h-4 w-4" />
        Add billing code
      </Button>
    </div>
  )
}
