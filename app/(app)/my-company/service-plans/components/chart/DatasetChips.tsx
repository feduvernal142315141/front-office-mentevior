"use client"

import { Check, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  CHART_DATASET_OPTIONS,
  type ChartDataset,
} from "@/lib/modules/service-plans/constants/chart.constants"

interface DatasetChipsProps {
  value: ChartDataset[]
  onChange: (value: ChartDataset[]) => void
}

export function DatasetChips({ value, onChange }: DatasetChipsProps) {
  const selected = new Set(value)

  const toggle = (id: ChartDataset) => {
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
        <span className="text-xs text-slate-400">
          {value.length} of {CHART_DATASET_OPTIONS.length} selected
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {CHART_DATASET_OPTIONS.map((option) => {
          const isActive = selected.has(option.value)
          return (
            <Tooltip key={option.value}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => toggle(option.value)}
                  className={cn(
                    "group flex items-center justify-between gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium w-full",
                    "transition-all duration-200 ease-out",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#037ECC]/40 focus-visible:ring-offset-1",
                    isActive
                      ? "border-[#037ECC]/30 bg-[#037ECC]/10 text-[#037ECC] shadow-[0_1px_2px_rgba(3,126,204,0.12)] hover:bg-[#037ECC]/15"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
                  )}
                >
                  <span className="flex items-center gap-1.5 min-w-0">
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
                    <span className="truncate">{option.label}</span>
                  </span>
                  <Info
                    className={cn(
                      "h-3.5 w-3.5 shrink-0 transition-colors",
                      isActive ? "text-[#037ECC]/60" : "text-slate-300 group-hover:text-slate-400"
                    )}
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                sideOffset={6}
                className="max-w-xs bg-slate-900 text-white"
              >
                <span className="text-xs leading-relaxed">{option.description}</span>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </div>
  )
}
