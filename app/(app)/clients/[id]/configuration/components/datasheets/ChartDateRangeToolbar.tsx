"use client"

import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react"
import { cn } from "@/lib/utils"
import { ChartInterval } from "@/lib/modules/service-plans/constants/chart.constants"
import {
  CHART_RANGE_PRESETS,
  type ChartRangePreset,
} from "./useChartDateRange"

const INTERVAL_OPTIONS: { value: ChartInterval; label: string }[] = [
  { value: ChartInterval.DAILY, label: "Daily" },
  { value: ChartInterval.WEEKLY, label: "Weekly" },
  { value: ChartInterval.MONTHLY, label: "Monthly" },
]

interface ChartDateRangeToolbarProps {
  preset: ChartRangePreset
  rangeLabel: string
  isAtToday: boolean
  interval?: ChartInterval
  presetsDisabled?: boolean
  onPresetChange: (preset: ChartRangePreset) => void
  onIntervalChange?: (interval: ChartInterval) => void
  onPrev: () => void
  onNext: () => void
  onToday: () => void
}

export function ChartDateRangeToolbar({
  preset,
  rangeLabel,
  isAtToday,
  interval,
  presetsDisabled,
  onPresetChange,
  onIntervalChange,
  onPrev,
  onNext,
  onToday,
}: ChartDateRangeToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      {/* Left: Range presets + Interval toggle */}
      <div className="flex items-center gap-2.5">
        {/* Range presets */}
        <div className={cn("flex items-center gap-1 rounded-xl bg-slate-100/80 p-1", presetsDisabled && "opacity-40")}>
          {CHART_RANGE_PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              disabled={presetsDisabled}
              onClick={() => onPresetChange(p)}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200",
                p === preset && !presetsDisabled
                  ? "bg-gradient-to-br from-[#037ECC] to-[#079CFB] text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-white/60",
                presetsDisabled && "cursor-not-allowed hover:bg-transparent hover:text-slate-500",
              )}
            >
              {p}
            </button>
          ))}
        </div>

        {interval !== undefined && onIntervalChange && (
          <>
            <div className="h-6 w-px bg-slate-200" />
            <div className="flex items-center gap-1 rounded-xl bg-slate-100/80 p-1">
              {INTERVAL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onIntervalChange(opt.value)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200",
                    opt.value === interval
                      ? "bg-white text-[#037ECC] shadow-sm"
                      : "text-slate-500 hover:text-slate-700 hover:bg-white/60"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Right: Date range display + navigation */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all hover:border-[#037ECC]/30 hover:text-[#037ECC] hover:shadow-sm"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 min-w-[200px] justify-center">
          <CalendarDays className="h-3.5 w-3.5 text-[#037ECC] shrink-0" />
          <span className="text-sm font-medium text-slate-700 whitespace-nowrap">
            {rangeLabel}
          </span>
        </div>

        <button
          type="button"
          onClick={onNext}
          disabled={isAtToday}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all hover:border-[#037ECC]/30 hover:text-[#037ECC] hover:shadow-sm",
            isAtToday && "opacity-40 cursor-not-allowed hover:border-slate-200 hover:text-slate-500 hover:shadow-none"
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {!isAtToday && (
          <button
            type="button"
            onClick={onToday}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-all hover:border-[#037ECC]/30 hover:text-[#037ECC] hover:shadow-sm"
          >
            Today
          </button>
        )}
      </div>
    </div>
  )
}
