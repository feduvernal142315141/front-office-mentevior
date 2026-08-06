"use client"

import { Checkbox } from "@/components/custom/Checkbox"
import { FloatingTextarea } from "@/components/custom/FloatingTextarea"
import {
  OTHER_APPLIED_OPTION_CODE,
  type SupervisionOptionCatalogItem,
} from "@/lib/types/monthly-supervision.types"

interface SupervisionOptionsChecklistProps {
  options: SupervisionOptionCatalogItem[]
  selectedIds: string[]
  onToggle: (id: string, checked: boolean) => void
  disabled?: boolean
  /** Texto libre que acompaña a la opción "Other"; sólo en el catálogo aplicado */
  otherValue?: string
  onOtherChange?: (value: string) => void
}

/**
 * Lista de opciones del catálogo, en checkboxes.
 *
 * El campo de texto libre aparece **sólo cuando se marca la opción cuyo `code`
 * es `OTHER`**. Se ancla al `code` y no al UUID ni al nombre porque es el único
 * de los tres que el contrato promete estable: los UUIDs cambian entre
 * ambientes y el texto visible lo puede editar cualquiera.
 */
export function SupervisionOptionsChecklist({
  options,
  selectedIds,
  onToggle,
  disabled,
  otherValue,
  onOtherChange,
}: SupervisionOptionsChecklistProps) {
  const otherOption = options.find((option) => option.code === OTHER_APPLIED_OPTION_CODE)
  const isOtherSelected = !!otherOption && selectedIds.includes(otherOption.id)

  if (options.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-slate-400">
        No options available.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-x-6 gap-y-3 lg:grid-cols-2">
        {options.map((option) => (
          <Checkbox
            key={option.id}
            checked={selectedIds.includes(option.id)}
            onCheckedChange={(checked) => onToggle(option.id, checked)}
            disabled={disabled}
            label={option.name}
          />
        ))}
      </div>

      {isOtherSelected && onOtherChange && (
        <div className="pt-1">
          <FloatingTextarea
            label="Other — please specify"
            value={otherValue ?? ""}
            onChange={onOtherChange}
            onBlur={() => {}}
            rows={3}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  )
}
