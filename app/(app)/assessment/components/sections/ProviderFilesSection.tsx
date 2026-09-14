"use client"

import { useMemo } from "react"
import { Contact, Plus, ShieldCheck, Trash2, Users } from "lucide-react"
import { Button } from "@/components/custom/Button"
import { FloatingInput } from "@/components/custom/FloatingInput"
import type { AssessmentProviderFileInput } from "@/lib/types/assessment.types"

interface ProviderFilesSectionProps {
  rows: AssessmentProviderFileInput[]
  /** Pinta el empty state en rojo cuando la sección exige al menos una fila */
  hasError?: boolean
  disabled?: boolean
  onAdd: () => void
  onRemove: (index: number) => void
  onUpdate: (index: number, field: keyof AssessmentProviderFileInput, value: string) => void
}

function isBcbaRow(row: AssessmentProviderFileInput): boolean {
  return /bcba|bcaba/i.test(row.type)
}

/** Otros proveedores del cliente: tipo, nombre y contacto (`contactIformation` [sic] en el contrato) */
export function ProviderFilesSection({ rows, hasError, disabled, onAdd, onRemove, onUpdate }: ProviderFilesSectionProps) {
  // Separate BCBA/BCaBA rows (evaluator) from other providers, preserving original indices
  const { bcbaRows, otherRows } = useMemo(() => {
    const bcba: { row: AssessmentProviderFileInput; index: number }[] = []
    const other: { row: AssessmentProviderFileInput; index: number }[] = []
    rows.forEach((row, index) => {
      if (isBcbaRow(row)) {
        bcba.push({ row, index })
      } else {
        other.push({ row, index })
      }
    })
    return { bcbaRows: bcba, otherRows: other }
  }, [rows])

  return (
    <div className="space-y-6">
      {/* BCBA / Evaluator section — always visible */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#037ECC]" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#037ECC]">Evaluator / BCBA</h4>
        </div>

        {bcbaRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#037ECC]/20 bg-[#037ECC]/5 py-6">
            <ShieldCheck className="h-5 w-5 text-[#037ECC]/40" />
            <p className="text-xs text-slate-500">
              No BCBA provider found — add one or set the Type to &quot;BCBA&quot;
            </p>
          </div>
        ) : (
          bcbaRows.map(({ row, index }) => (
            <ProviderRow key={index} row={row} index={index} disabled={disabled} onRemove={onRemove} onUpdate={onUpdate} highlighted />
          ))
        )}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Other Providers</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      {/* Other providers */}
      <div className="space-y-3">
        {otherRows.length === 0 && (
          <div className={`flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-6 ${hasError ? "border-red-300 bg-red-50/40" : "border-slate-200 bg-slate-50/60"}`}>
            <Users className={`h-5 w-5 ${hasError ? "text-red-300" : "text-slate-300"}`} />
            <p className={`text-xs ${hasError ? "text-red-500" : "text-slate-500"}`}>No other providers added</p>
          </div>
        )}

        {otherRows.map(({ row, index }) => (
          <ProviderRow key={index} row={row} index={index} disabled={disabled} onRemove={onRemove} onUpdate={onUpdate} />
        ))}
      </div>

      <Button type="button" variant="secondary" onClick={onAdd} disabled={disabled} className="gap-2 flex items-center">
        <Plus className="h-4 w-4" />
        Add provider
      </Button>
    </div>
  )
}

function ProviderRow({
  row,
  index,
  disabled,
  onRemove,
  onUpdate,
  highlighted = false,
}: {
  row: AssessmentProviderFileInput
  index: number
  disabled?: boolean
  onRemove: (index: number) => void
  onUpdate: (index: number, field: keyof AssessmentProviderFileInput, value: string) => void
  highlighted?: boolean
}) {
  return (
    <div className={`rounded-xl border p-4 ${highlighted ? "border-[#037ECC]/20 bg-[#037ECC]/5" : "border-slate-200 bg-slate-50/40"}`}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[220px_1fr_1fr_auto]">
        <FloatingInput
          label="Type"
          value={row.type}
          onChange={(v) => onUpdate(index, "type", v)}
          onBlur={() => {}}
          disabled={disabled}
        />
        <FloatingInput
          label="Name"
          value={row.name}
          onChange={(v) => onUpdate(index, "name", v)}
          onBlur={() => {}}
          disabled={disabled}
        />
        <FloatingInput
          label="Contact information"
          value={row.contactIformation}
          onChange={(v) => onUpdate(index, "contactIformation", v)}
          onBlur={() => {}}
          disabled={disabled}
        />
        <button
          type="button"
          onClick={() => onRemove(index)}
          disabled={disabled}
          className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center self-start rounded-xl border border-red-200/60 bg-gradient-to-b from-red-50 to-red-100/80 text-red-600 transition-all hover:from-red-100 hover:to-red-200/90 disabled:opacity-50"
          title="Remove provider"
          aria-label="Remove provider"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
