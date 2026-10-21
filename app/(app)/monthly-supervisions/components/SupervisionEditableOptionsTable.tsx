"use client"

import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/custom/Button"
import { cn } from "@/lib/utils"

interface SupervisionEditableOptionsTableProps {
  title: string
  description: string
  options: string[]
  onChange: (options: string[]) => void
  disabled?: boolean
}

export function SupervisionEditableOptionsTable({
  title,
  description,
  options,
  onChange,
  disabled,
}: SupervisionEditableOptionsTableProps) {
  const updateOption = (index: number, value: string) => {
    onChange(options.map((option, currentIndex) => currentIndex === index ? value : option))
  }

  const removeOption = (index: number) => {
    onChange(options.filter((_, currentIndex) => currentIndex !== index))
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#037ECC]/20 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-[#037ECC]/10 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          <p className="mt-1 text-xs text-slate-400">{description}</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="h-9 px-3 text-xs"
          onClick={() => onChange([...options, ""])}
          disabled={disabled}
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </Button>
      </div>

      <div className="divide-y divide-slate-100">
        {options.length === 0 ? (
          <p className="px-5 py-6 text-center text-sm text-slate-400">No items configured.</p>
        ) : (
          options.map((option, index) => (
            // El índice es estable mientras se edita el texto. Incluir `option`
            // en la key desmonta el input en cada tecla y elimina el foco.
            <div key={index} className="flex items-center gap-3 px-5 py-3">
              <span className="w-6 shrink-0 text-xs font-medium text-slate-400">{index + 1}</span>
              <input
                value={option}
                onChange={(event) => updateOption(index, event.target.value)}
                disabled={disabled}
                placeholder="Enter an item"
                className={cn(
                  "min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none",
                  "focus:border-[#037ECC]/50 focus:ring-2 focus:ring-[#037ECC]/10",
                  "disabled:bg-slate-50 disabled:text-slate-400",
                )}
              />
              <button
                type="button"
                onClick={() => removeOption(index)}
                disabled={disabled}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label={`Remove item ${index + 1}`}
                title="Remove item"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
