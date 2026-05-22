"use client"

import { Check, Info, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { DatasetCatalogEntry } from "@/lib/modules/service-plans/services/datasets-catalog.service"

interface DatasetChipsProps {
  entries: DatasetCatalogEntry[]
  value: string[]
  onChange: (value: string[]) => void
  isLoading?: boolean
  error?: Error | null
  onRetry?: () => void
}

export function DatasetChips({
  entries,
  value,
  onChange,
  isLoading,
  error,
  onRetry,
}: DatasetChipsProps) {
  const selected = new Set(value)

  const toggle = (id: string) => {
    if (selected.has(id)) {
      onChange(value.filter((v) => v !== id))
    } else {
      onChange([...value, id])
    }
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-600">Datasets</label>
        {!isLoading && !error && (
          <span className="text-xs text-slate-400">
            {value.length} of {entries.length} selected
          </span>
        )}
      </div>

      {isLoading && (
        <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        </div>
      )}

      {error && !isLoading && (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-red-100 bg-red-50/60 px-4 py-6 text-center">
          <p className="text-sm text-red-700">{error.message}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="text-xs font-medium text-red-700 underline hover:text-red-800"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {!isLoading && !error && entries.length === 0 && (
        <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-sm text-slate-500">
          No datasets available
        </div>
      )}

      {!isLoading && !error && entries.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {entries.map((entry) => {
            const isActive = selected.has(entry.id)
            return (
              <div
                key={entry.id}
                className={cn(
                  "group flex items-center gap-0.5 rounded-xl border px-2 py-2 w-full",
                  "transition-all duration-200 ease-out",
                  isActive
                    ? "border-[#037ECC]/30 bg-[#037ECC]/10 text-[#037ECC] shadow-[0_1px_2px_rgba(3,126,204,0.12)]"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
                )}
              >
                <button
                  type="button"
                  onClick={() => toggle(entry.id)}
                  className={cn(
                    "flex min-w-0 flex-1 items-center gap-1.5 rounded-lg px-1 py-0.5 text-sm font-medium",
                    "transition-colors duration-200 ease-out",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#037ECC]/40 focus-visible:ring-offset-1",
                    isActive ? "hover:bg-[#037ECC]/10" : "hover:bg-slate-50"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors",
                      isActive
                        ? "border-[#037ECC] bg-[#037ECC] text-white"
                        : "border-slate-300 bg-white text-transparent group-hover:border-slate-400"
                    )}
                    aria-hidden
                  >
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  <span className="truncate">{entry.name}</span>
                </button>

                {entry.description && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        tabIndex={0}
                        aria-label={`Info about ${entry.name}`}
                        className={cn(
                          "shrink-0 rounded-md p-1 transition-colors",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#037ECC]/40",
                          isActive
                            ? "text-[#037ECC]/60 hover:bg-[#037ECC]/10 hover:text-[#037ECC]"
                            : "text-slate-300 hover:bg-slate-100 hover:text-slate-500"
                        )}
                      >
                        <Info className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      sideOffset={6}
                      className="max-w-xs bg-slate-900 text-white"
                    >
                      <span className="text-xs leading-relaxed">{entry.description}</span>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
