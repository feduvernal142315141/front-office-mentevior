"use client"

import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/custom/Button"
import { cn } from "@/lib/utils"
import { useEffect, useRef, useState } from "react"

interface SupervisionEditableOptionsTableProps {
  title: string
  description: string
  options: string[]
  /** Names of the catalog items that ADD must restore before creating blanks. */
  defaultOptions?: string[]
  onChange: (options: string[]) => void
  disabled?: boolean
}

interface EditableOptionRow {
  id: string
  value: string
  defaultIndex?: number
}

function createRows(options: string[], defaultOptions: string[]): EditableOptionRow[] {
  const usedDefaultIndexes = new Set<number>()

  return options.map((value, index) => {
    const defaultIndex = defaultOptions.findIndex(
      (defaultOption, candidateIndex) =>
        !usedDefaultIndexes.has(candidateIndex) && defaultOption === value,
    )

    if (defaultIndex >= 0) usedDefaultIndexes.add(defaultIndex)

    return {
      id: `option-${index}`,
      value,
      ...(defaultIndex >= 0 ? { defaultIndex } : {}),
    }
  })
}

function sameValues(rows: EditableOptionRow[], options: string[]): boolean {
  return rows.length === options.length && rows.every((row, index) => row.value === options[index])
}

export function SupervisionEditableOptionsTable({
  title,
  description,
  options,
  defaultOptions = [],
  onChange,
  disabled,
}: SupervisionEditableOptionsTableProps) {
  const [rows, setRows] = useState<EditableOptionRow[]>(() => createRows(options, defaultOptions))
  const nextIdRef = useRef(options.length)

  // The parent owns the serialized values. Rebuild the local identity map only
  // when it changed outside this component (for example when a report loads).
  useEffect(() => {
    if (sameValues(rows, options)) return
    setRows(createRows(options, defaultOptions))
    nextIdRef.current = options.length
  }, [defaultOptions, options, rows])

  const emitRows = (nextRows: EditableOptionRow[]) => {
    setRows(nextRows)
    onChange(nextRows.map((row) => row.value))
  }

  const updateOption = (index: number, value: string) => {
    emitRows(rows.map((row, currentIndex) => currentIndex === index ? { ...row, value } : row))
  }

  const removeOption = (index: number) => {
    emitRows(rows.filter((_, currentIndex) => currentIndex !== index))
  }

  const addOption = () => {
    const presentDefaults = new Set(
      rows.flatMap((row) => row.defaultIndex === undefined ? [] : [row.defaultIndex]),
    )
    const missingDefaultIndex = defaultOptions.findIndex((_, index) => !presentDefaults.has(index))

    if (missingDefaultIndex < 0) {
      emitRows([
        ...rows,
        { id: `option-${nextIdRef.current++}`, value: "" },
      ])
      return
    }

    const restoredRow: EditableOptionRow = {
      id: `default-option-${missingDefaultIndex}`,
      value: defaultOptions[missingDefaultIndex],
      defaultIndex: missingDefaultIndex,
    }
    const insertAt = rows.findIndex(
      (row) => row.defaultIndex !== undefined && row.defaultIndex > missingDefaultIndex,
    )
    const nextRows = [...rows]
    nextRows.splice(insertAt < 0 ? rows.length : insertAt, 0, restoredRow)
    emitRows(nextRows)
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
          onClick={addOption}
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
          rows.map((row, index) => (
            // El índice es estable mientras se edita el texto. Incluir `option`
            // en la key desmonta el input en cada tecla y elimina el foco.
            <div key={row.id} className="flex items-center gap-3 px-5 py-3">
              <span className="w-6 shrink-0 text-xs font-medium text-slate-400">{index + 1}</span>
              <input
                value={row.value}
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
