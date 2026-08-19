"use client"

import { Contact, Plus, Trash2 } from "lucide-react"
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

/** Otros proveedores del cliente: tipo, nombre y contacto (`contactIformation` [sic] en el contrato) */
export function ProviderFilesSection({ rows, hasError, disabled, onAdd, onRemove, onUpdate }: ProviderFilesSectionProps) {
  return (
    <div className="space-y-4">
      {rows.length === 0 && (
        <div className={`flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-8 ${hasError ? "border-red-300 bg-red-50/40" : "border-slate-200 bg-slate-50/60"}`}>
          <Contact className={`h-6 w-6 ${hasError ? "text-red-300" : "text-slate-300"}`} />
          <p className={`text-sm ${hasError ? "text-red-500" : "text-slate-500"}`}>No providers added</p>
        </div>
      )}

      {rows.map((row, index) => (
        <div key={index} className="rounded-xl border border-slate-200 bg-slate-50/40 p-4">
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
      ))}

      <Button type="button" variant="secondary" onClick={onAdd} disabled={disabled} className="gap-2 flex items-center">
        <Plus className="h-4 w-4" />
        Add provider
      </Button>
    </div>
  )
}
