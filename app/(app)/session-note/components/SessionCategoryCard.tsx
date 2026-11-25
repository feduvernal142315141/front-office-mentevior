"use client"

import { BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AppointmentNoteCategory } from "@/lib/types/appointment-note.types"
import { groupItemsByType } from "@/lib/modules/appointment-notes/utils/group-items-by-type"

interface SessionCategoryCardProps {
  category: AppointmentNoteCategory
  categoryItems: Record<string, { value: number | null; environmentalChange: string }>
  onValueChange: (itemId: string, value: number | null) => void
  onEnvChangeChange: (itemId: string, text: string) => void
  itemErrors?: Set<string>
  disabled?: boolean
  activeItemId?: string
  onItemFocus?: (itemId: string) => void
}

/** Categoría → grupos por Type → ítems. El Type se muestra una vez por grupo. */
export function SessionCategoryCard({
  category,
  categoryItems,
  onValueChange,
  onEnvChangeChange,
  itemErrors,
  disabled,
  activeItemId,
  onItemFocus,
}: SessionCategoryCardProps) {
  const groups = groupItemsByType(category.items)

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 overflow-hidden self-start">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-white border-b border-slate-100">
        <BarChart3 className="h-3.5 w-3.5 text-[#037ECC]" />
        <span className="text-xs font-semibold text-slate-800 flex-1">{category.name}</span>
        <span className="inline-flex items-center justify-center rounded-full bg-[#037ECC]/10 text-[#037ECC] text-[10px] font-bold h-5 min-w-[20px] px-1.5">{category.items.length}</span>
      </div>

      <div className="space-y-3 p-3">
        {groups.map((group) => (
          <div
            key={group.type ?? "__no-type__"}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
          >
            {group.type && (
              <div className="flex items-center gap-2 border-b border-[#037ECC]/15 bg-gradient-to-r from-[#037ECC]/[0.08] to-[#037ECC]/[0.02] px-3.5 py-2">
                <span className="h-4 w-1 rounded-full bg-gradient-to-b from-[#037ECC] to-[#079CFB]" />
                <span className="text-[11px] font-semibold uppercase tracking-wide text-[#037ECC]">
                  {group.type}
                </span>
                <span className="ml-auto text-[10px] font-medium text-slate-400">
                  {group.items.length} {group.items.length === 1 ? "item" : "items"}
                </span>
              </div>
            )}
          <div className="divide-y divide-slate-100">
            {group.items.map((item) => {
              const edited = categoryItems[item.id]
              const currentValue = edited?.value ?? item.value
              const currentEnv = edited?.environmentalChange ?? item.environmentalChange ?? ""
              const hasError = itemErrors?.has(item.id)
              const isActive = activeItemId === item.id
              return (
                <div
                  key={item.id}
                  className={cn(
                    "px-4 py-3 space-y-2 transition-colors cursor-pointer",
                    isActive && "bg-[#037ECC]/[0.03] border-l-2 border-l-[#037ECC]",
                  )}
                  onClick={() => onItemFocus?.(item.id)}
                >
                  <span className={cn("text-sm font-medium block", isActive ? "text-[#037ECC]" : "text-slate-700")}>{item.name}</span>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-semibold uppercase text-slate-400">Value <span className="text-[#037ECC]">*</span></span>
                        <input
                          type="text"
                          inputMode="numeric"
                          data-item-value={item.id}
                          disabled={disabled}
                          value={currentValue ?? ""}
                          onFocus={() => onItemFocus?.(item.id)}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/[^0-9.]/g, "")
                            onValueChange(item.id, raw === "" ? null : parseFloat(raw))
                          }}
                          placeholder="—"
                          className={cn(
                            "h-7 w-16 rounded-lg border bg-white text-center text-sm font-semibold tabular-nums text-slate-800 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400",
                            hasError
                              ? "border-red-400 ring-1 ring-red-200 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                              : "border-slate-200 focus:border-[#037ECC] focus:ring-2 focus:ring-[#037ECC]/15",
                          )}
                        />
                      </div>
                      {hasError && (
                        <span className="text-[10px] font-medium text-red-500">Value is required</span>
                      )}
                    </div>
                    <div className="flex-1 flex items-center gap-1.5 min-w-0">
                      <span className="text-[10px] font-semibold uppercase text-slate-400 shrink-0">Env.</span>
                      <input
                        type="text"
                        value={currentEnv}
                        disabled={disabled}
                        onFocus={() => onItemFocus?.(item.id)}
                        onChange={(e) => onEnvChangeChange(item.id, e.target.value)}
                        placeholder="Environmental change..."
                        className="h-7 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-[#037ECC] focus:ring-2 focus:ring-[#037ECC]/15 transition-all placeholder:text-slate-300 disabled:bg-slate-50 disabled:text-slate-400"
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          </div>
        ))}
      </div>
    </div>
  )
}
