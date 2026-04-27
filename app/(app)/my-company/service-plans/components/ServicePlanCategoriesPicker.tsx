"use client"

import { useMemo, useState } from "react"
import { Search, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/custom/Button"

interface ServicePlanCategoryOption {
  value: string
  label: string
}

interface ServicePlanCategoriesPickerProps {
  value: string[]
  onChange: (next: string[]) => void
  options: ServicePlanCategoryOption[]
  onCreateCategory: (name: string) => Promise<boolean>
  isCreatingCategory?: boolean
  disabled?: boolean
  hasError?: boolean
  required?: boolean
}

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase()
}

export function ServicePlanCategoriesPicker({
  value,
  onChange,
  options,
  onCreateCategory,
  isCreatingCategory = false,
  disabled = false,
  hasError = false,
  required = false,
}: ServicePlanCategoriesPickerProps) {
  const [query, setQuery] = useState("")
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")

  const normalizedQuery = normalizeQuery(query)

  const selectedSet = useMemo(() => new Set(value), [value])

  const filteredOptions = useMemo(
    () =>
      options.filter((option) => {
        if (normalizedQuery.length === 0) return true
        return option.label.toLowerCase().includes(normalizedQuery)
      }),
    [options, normalizedQuery]
  )

  const canSelectAll = filteredOptions.length > 0
  const canSaveCategory = newCategoryName.trim().length > 0 && !disabled && !isCreatingCategory

  const handleToggleCategory = (categoryValue: string) => {
    if (disabled) return

    if (selectedSet.has(categoryValue)) {
      onChange(value.filter((entry) => entry !== categoryValue))
      return
    }

    onChange([...value, categoryValue])
  }

  const handleSelectAll = () => {
    if (disabled || !canSelectAll) return

    const nextSelection = new Set(value)
    filteredOptions.forEach((option) => {
      nextSelection.add(option.value)
    })

    onChange(Array.from(nextSelection))
  }

  const handleClear = () => {
    if (disabled || value.length === 0) return
    onChange([])
  }

  const handleStartAddCategory = () => {
    if (disabled) return

    setQuery("")
    setNewCategoryName("")
    setIsAddingCategory(true)
  }

  const handleCancelAddCategory = () => {
    if (isCreatingCategory) return

    setNewCategoryName("")
    setIsAddingCategory(false)
  }

  const handleSaveCategory = async () => {
    if (!canSaveCategory) return

    const saved = await onCreateCategory(newCategoryName.trim())

    if (!saved) return

    setNewCategoryName("")
    setQuery("")
    setIsAddingCategory(false)
  }

  return (
    <div
      className={cn(
        "rounded-2xl border bg-gradient-to-b from-white to-slate-50/70 p-4 md:p-5 transition-shadow",
        "shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
        hasError
          ? "border-red-300 ring-2 ring-red-100"
          : "border-slate-200 hover:border-slate-300 focus-within:border-[#037ECC]/45 focus-within:ring-2 focus-within:ring-[#037ECC]/20",
        disabled && "opacity-70"
      )}
      aria-disabled={disabled}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            Categories {required && <span className="text-[#037ECC]">*</span>}
          </p>
          <p className="text-xs text-slate-500">{value.length} selected</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSelectAll}
            disabled={disabled || !canSelectAll}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#037ECC]/30",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "border-[#037ECC]/20 bg-gradient-to-b from-[#037ECC]/10 to-[#037ECC]/5 text-[#037ECC] hover:border-[#037ECC]/35 hover:from-[#037ECC]/15 hover:to-[#079CFB]/10"
            )}
          >
            Select All
          </button>

          <button
            type="button"
            onClick={handleClear}
            disabled={disabled || value.length === 0}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
            )}
          >
            Clear
          </button>

          <Button
            type="button"
            variant="primary"
            onClick={handleStartAddCategory}
            disabled={disabled || isCreatingCategory}
            className="h-8 px-3 text-xs"
          >
            Add Category
          </Button>
        </div>
      </div>

      {isAddingCategory ? (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="text"
            value={newCategoryName}
            onChange={(event) => setNewCategoryName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                void handleSaveCategory()
              }
            }}
            disabled={disabled || isCreatingCategory}
            placeholder="Name"
            className={cn(
              "h-10 w-full rounded-xl border bg-white px-3 text-sm text-slate-900 sm:w-[90%]",
              "placeholder:text-slate-400",
              "transition-colors focus:outline-none focus:ring-2",
              "disabled:cursor-not-allowed disabled:bg-slate-100",
              hasError
                ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                : "border-slate-200 focus:border-[#037ECC]/45 focus:ring-[#037ECC]/20"
            )}
          />

          <div className="flex items-center gap-2 sm:justify-end">
            <button
              type="button"
              onClick={handleCancelAddCategory}
              disabled={disabled || isCreatingCategory}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300",
                "disabled:cursor-not-allowed disabled:opacity-50",
                "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              )}
            >
              Cancel
            </button>

            <Button
              type="button"
              variant="primary"
              onClick={() => {
                void handleSaveCategory()
              }}
              disabled={!canSaveCategory}
              className="h-8 px-3 text-xs"
            >
              {isCreatingCategory ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            disabled={disabled}
            placeholder="Search categories"
            className={cn(
              "h-10 w-full rounded-xl border bg-white pl-9 pr-3 text-sm text-slate-900",
              "placeholder:text-slate-400",
              "transition-colors focus:outline-none focus:ring-2",
              "disabled:cursor-not-allowed disabled:bg-slate-100",
              hasError
                ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                : "border-slate-200 focus:border-[#037ECC]/45 focus:ring-[#037ECC]/20"
            )}
          />
        </div>
      )}

      {filteredOptions.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white/70 px-4 py-6 text-center">
          <p className="text-sm font-medium text-slate-700">No categories found</p>
          <p className="mt-1 text-xs text-slate-500">Try another search term or clear the search.</p>
        </div>
      ) : (
        <div className="mt-4 max-h-[230px] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {filteredOptions.map((option) => {
              const isSelected = selectedSet.has(option.value)

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleToggleCategory(option.value)}
                  disabled={disabled}
                  className={cn(
                    "group relative flex items-center justify-between gap-2 overflow-hidden rounded-xl border px-3 py-2.5 text-left transition-all",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#037ECC]/30",
                    "disabled:cursor-not-allowed",
                    isSelected
                      ? "border-[#037ECC]/35 bg-gradient-to-r from-[#037ECC]/12 to-[#079CFB]/8 text-[#024f84] shadow-[0_1px_1px_rgba(3,126,204,0.14)]"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  )}
                  aria-pressed={isSelected}
                >
                  <span className="line-clamp-1 text-sm font-medium">{option.label}</span>
                  {isSelected && <Sparkles className="h-4 w-4 shrink-0 text-[#037ECC]" />}
                </button>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}
