"use client"

import { Checkbox } from "@/components/custom/Checkbox"
import { FloatingInput } from "@/components/custom/FloatingInput"

interface OtherTeachingMethodFieldProps {
  checked: boolean
  value: string
  onCheckedChange: (checked: boolean) => void
  onValueChange: (value: string) => void
  disabled?: boolean
  error?: string
}

/**
 * "Other" de Teaching Methods en las notas 97153 y 97156. Es una opción local: no existe
 * en el catálogo, el backend sólo guarda el indicador y el texto libre.
 */
export function OtherTeachingMethodField({
  checked,
  value,
  onCheckedChange,
  onValueChange,
  disabled = false,
  error,
}: OtherTeachingMethodFieldProps) {
  return (
    <div className="mt-3">
      <div className="flex items-center gap-4">
        <Checkbox
          label="Other"
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
          className="shrink-0 items-center"
        />
        <div className="min-w-0 flex-1">
          <FloatingInput
            label="Other teaching method"
            value={value}
            onChange={onValueChange}
            onBlur={() => {}}
            disabled={disabled || !checked}
            hasError={!!error}
            required={checked}
          />
        </div>
      </div>
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  )
}
