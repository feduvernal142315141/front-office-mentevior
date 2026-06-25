"use client"

import { CalendarDays, ChevronLeft, ChevronRight, Target, CheckCircle2, Percent, UserCircle, FileText, Minus, Plus } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { FloatingInput } from "@/components/custom/FloatingInput"
import type { ClientServicePlanCategoryMappedItem } from "@/lib/types/client-service-plan.types"
import type { DataCollectionConfig } from "@/lib/types/data-collection.types"
import { usePercentageDatasheet } from "./usePercentageDatasheet"
import { useChartDateRange } from "./useChartDateRange"
import { ChartDateRangeToolbar } from "./ChartDateRangeToolbar"
import { getDateKey, calculatePercentage } from "./percentage-datasheet.types"
import { PercentageChart } from "./PercentageChart"

interface PercentageDatasheetProps {
  activeItem: ClientServicePlanCategoryMappedItem
  categoryTypeName: string
  dcConfig: DataCollectionConfig | null
}

export function PercentageDatasheet({ activeItem, categoryTypeName, dcConfig }: PercentageDatasheetProps) {
  const ds = usePercentageDatasheet()
  const chartRange = useChartDateRange()

  return (
    <div className="space-y-4">
      {/* Header */}
      <DatasheetHeader
        monthYearLabel={ds.monthYearLabel}
        periodLabel={ds.periodLabel}
        staffAvatars={ds.staffAvatars}
        staffCount={ds.staffCount}
        onPrev={ds.goToPrevWeek}
        onNext={ds.goToNextWeek}
        onToday={ds.goToCurrentWeek}
      />

      {/* Grid */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[1120px]">
            {/* Column Headers */}
            <div className="grid grid-cols-[200px_repeat(7,minmax(130px,1fr))] border-b border-slate-100">
              <div className="px-4 py-3 bg-slate-50/60 border-r border-slate-100">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Measurement Row</span>
              </div>
              {ds.weekDays.map((day) => {
                const today = ds.isToday(day)
                return (
                  <div key={getDateKey(day)} className={cn("flex items-center justify-center py-3", today && "bg-[#037ECC]/[0.03]")}>
                    <div className={cn(
                      "flex flex-col items-center justify-center w-14 h-14 rounded-full",
                      today
                        ? "bg-gradient-to-br from-[#037ECC] to-[#079CFB] text-white shadow-md ring-2 ring-[#037ECC]/20 ring-offset-2"
                        : "bg-slate-100 text-slate-700"
                    )}>
                      <span className="text-lg font-bold leading-none">{format(day, "dd")}</span>
                      <span className={cn("text-[10px] font-semibold uppercase leading-none mt-0.5", today ? "text-white/80" : "text-slate-400")}>
                        {format(day, "MMM")}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Row: Number of Trials */}
            <div className="grid grid-cols-[200px_repeat(7,minmax(130px,1fr))] border-b border-slate-100">
              <RowLabel
                icon={<Target className="h-4 w-4 text-[#037ECC]" />}
                title="Number of Trials"
                badge="Configurable"
                badgeColor="blue"
              />
              {ds.weekDays.map((day) => {
                const key = getDateKey(day)
                const entry = ds.getEntry(key)
                const today = ds.isToday(day)
                return (
                  <div key={key} className={cn("flex items-center justify-center px-2 py-3", today && "bg-[#037ECC]/[0.03]")}>
                    <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50/80 p-1">
                      <button
                        type="button"
                        onClick={() => ds.decrementTrials(key)}
                        disabled={entry.numberOfTrials <= 1}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-30"
                      >
                        <Minus className="h-3.5 w-3.5" strokeWidth={2.5} />
                      </button>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={entry.numberOfTrials}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, "")
                          if (v) ds.setNumberOfTrials(key, parseInt(v, 10))
                        }}
                        className="h-8 w-10 rounded-lg bg-white border border-slate-200 text-center text-sm font-semibold text-slate-800 tabular-nums outline-none focus:border-[#037ECC] focus:ring-2 focus:ring-[#037ECC]/15 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => ds.incrementTrials(key)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-blue-50 hover:text-[#037ECC]"
                      >
                        <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Row: Trials (Yes/No toggles) */}
            <div className="grid grid-cols-[200px_repeat(7,minmax(130px,1fr))] border-b border-slate-100">
              <RowLabel
                icon={<CheckCircle2 className="h-4 w-4 text-slate-400" />}
                title="Trials"
                badge="Yes / No per trial"
                badgeColor="slate"
              />
              {ds.weekDays.map((day) => {
                const key = getDateKey(day)
                const entry = ds.getEntry(key)
                const today = ds.isToday(day)
                return (
                  <div key={key} className={cn("px-2 py-3", today && "bg-[#037ECC]/[0.03]")}>
                    <div className="grid grid-cols-5 gap-1">
                      {entry.trials.map((trial, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => ds.toggleTrial(key, idx)}
                          title={`Trial #${idx + 1}: ${trial.result ?? "Not answered"}`}
                          className={cn(
                            "h-7 rounded-md text-[10px] font-bold transition-all duration-150 border",
                            trial.result === "yes" && "bg-emerald-500 border-emerald-500 text-white shadow-sm",
                            trial.result === "no" && "bg-red-50 border-red-200 text-red-600",
                            trial.result === null && "bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300 hover:bg-slate-100"
                          )}
                        >
                          {trial.result === "yes" ? "Y" : trial.result === "no" ? "N" : `#${idx + 1}`}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Row: Percentage (auto-calculated, read-only) */}
            <div className="grid grid-cols-[200px_repeat(7,minmax(130px,1fr))] border-b border-slate-100">
              <RowLabel
                icon={<Percent className="h-4 w-4 text-[#037ECC]" />}
                title="Percentage"
                badge="Auto-calculated"
                badgeColor="blue"
              />
              {ds.weekDays.map((day) => {
                const key = getDateKey(day)
                const entry = ds.getEntry(key)
                const pct = calculatePercentage(entry)
                const today = ds.isToday(day)
                return (
                  <div key={key} className={cn("flex items-center justify-center px-3 py-3", today && "bg-[#037ECC]/[0.03]")}>
                    {pct !== null ? (
                      <span className={cn(
                        "text-xl font-bold tabular-nums",
                        pct >= 60
                          ? "bg-gradient-to-r from-emerald-500 to-emerald-600 bg-clip-text text-transparent"
                          : "text-slate-700"
                      )}>
                        {pct}%
                      </span>
                    ) : (
                      <span className="text-lg text-slate-300 font-medium">—</span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Row: Collector Initials */}
            <div className="grid grid-cols-[200px_repeat(7,minmax(130px,1fr))] border-b border-slate-100">
              <RowLabel
                icon={<UserCircle className="h-4 w-4 text-slate-400" />}
                title="Collector Initials"
              />
              {ds.weekDays.map((day) => {
                const key = getDateKey(day)
                const entry = ds.getEntry(key)
                const today = ds.isToday(day)
                return (
                  <div key={key} className={cn("flex items-center justify-center px-3 py-3", today && "bg-[#037ECC]/[0.03]")}>
                    <FloatingInput
                      label="Initials"
                      value={entry.initials}
                      onChange={(v) => ds.setInitials(key, v)}
                      onBlur={() => {}}
                      maxLength={3}
                    />
                  </div>
                )
              })}
            </div>

            {/* Row: Environmental Changes */}
            <div className="grid grid-cols-[200px_repeat(7,minmax(130px,1fr))]">
              <RowLabel
                icon={<FileText className="h-4 w-4 text-teal-500" />}
                title="Environmental changes"
                badge="Affects Chart Phase Lines"
                badgeColor="teal"
              />
              {ds.weekDays.map((day) => {
                const key = getDateKey(day)
                const entry = ds.getEntry(key)
                const hasNote = entry.environmentalNote.trim().length > 0
                const today = ds.isToday(day)
                return (
                  <div key={key} className={cn("flex items-center justify-center px-3 py-3", today && "bg-[#037ECC]/[0.03]")}>
                    <FloatingInput
                      label="Add note..."
                      value={entry.environmentalNote}
                      onChange={(v) => ds.setNote(key, v)}
                      onBlur={() => {}}
                      isSuccess={hasNote}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="space-y-3">
        <ChartDateRangeToolbar
          preset={chartRange.preset}
          rangeLabel={chartRange.rangeLabel}
          isAtToday={chartRange.isAtToday}
          onPresetChange={chartRange.setPreset}
          onPrev={chartRange.goToPrev}
          onNext={chartRange.goToNext}
          onToday={chartRange.goToToday}
        />
        <PercentageChart
          weekDays={ds.weekDays}
          entries={ds.entries}
          dcConfig={dcConfig}
          chartDays={chartRange.chartDays}
          tickInterval={chartRange.tickInterval}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white shadow-sm px-5 py-3.5">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Weekly Avg</span>
            <span className="text-xl font-bold tabular-nums leading-tight bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-transparent">
              {ds.weeklyAveragePercentage > 0 ? `${ds.weeklyAveragePercentage}%` : "—"}
            </span>
          </div>

          <div className="h-9 w-px bg-slate-200" />

          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Monthly Avg</span>
            <span className="text-xl font-bold tabular-nums leading-tight text-slate-800">
              {ds.monthlyAveragePercentage > 0 ? `${ds.monthlyAveragePercentage}%` : "—"}
            </span>
          </div>
        </div>

        {ds.eventsLoggedCount > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1.5 border border-teal-200/60">
            <FileText className="h-3.5 w-3.5 text-teal-500" />
            <span className="text-xs font-semibold uppercase tracking-wide text-teal-600">
              {ds.eventsLoggedCount} event{ds.eventsLoggedCount !== 1 ? "s" : ""} logged
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function DatasheetHeader({
  monthYearLabel, periodLabel, staffAvatars, staffCount, onPrev, onNext, onToday,
}: {
  monthYearLabel: string; periodLabel: string; staffAvatars: string[]; staffCount: number
  onPrev: () => void; onNext: () => void; onToday: () => void
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white shadow-sm px-5 py-3.5">
      <div className="flex items-center gap-2.5">
        <CalendarDays className="h-5 w-5 text-[#037ECC]" />
        <span className="text-base font-bold text-slate-800">{monthYearLabel}</span>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={onPrev} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all hover:border-[#037ECC]/30 hover:text-[#037ECC] hover:shadow-sm">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium text-slate-600 px-1">Period: {periodLabel}</span>
        <button type="button" onClick={onNext} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all hover:border-[#037ECC]/30 hover:text-[#037ECC] hover:shadow-sm">
          <ChevronRight className="h-4 w-4" />
        </button>
        <button type="button" onClick={onToday} className="ml-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-all hover:border-[#037ECC]/30 hover:text-[#037ECC] hover:shadow-sm">
          Today
        </button>
      </div>
      <div className="flex items-center gap-2">
        {staffAvatars.length > 0 && (
          <div className="flex -space-x-1.5">
            {staffAvatars.map((initials) => (
              <div key={initials} className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#037ECC] to-[#079CFB] text-[10px] font-bold text-white ring-2 ring-white" title={initials}>
                {initials}
              </div>
            ))}
          </div>
        )}
        {staffCount > 0 && <span className="text-xs font-medium text-slate-500">{staffCount} Staff Recording</span>}
      </div>
    </div>
  )
}

function RowLabel({ icon, title, badge, badgeColor }: {
  icon: React.ReactNode; title: string; badge?: string; badgeColor?: "blue" | "teal" | "slate"
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white border-r border-slate-100 sticky left-0 z-10 shadow-[2px_0_8px_rgba(0,0,0,0.04)]">
      <div className="shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-700 leading-tight">{title}</p>
        {badge && (
          <span className={cn(
            "text-[10px] font-semibold leading-none mt-0.5 inline-block",
            badgeColor === "blue" && "text-[#037ECC]",
            badgeColor === "teal" && "text-teal-500",
            badgeColor === "slate" && "text-slate-400"
          )}>
            {badge}
          </span>
        )}
      </div>
    </div>
  )
}
