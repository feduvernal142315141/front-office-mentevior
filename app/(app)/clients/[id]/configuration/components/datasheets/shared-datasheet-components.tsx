"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import {
  CalendarDays, ChevronLeft, ChevronRight, FileText,
  Plus, MapPin, Save, RotateCcw, Loader2, Check,
  CalendarRange,
} from "lucide-react"
import { addDays, format, startOfWeek } from "date-fns"
import { AnimatePresence, motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import type { RangeMode } from "./useFrequencyDatasheet"

// ─── Premium Header ──────────────────────────────────────────────────────────

const MODE_OPTIONS: { value: RangeMode; label: string }[] = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "custom", label: "Custom" },
]

export function DatasheetHeader({
  rangeMode,
  periodLabel,
  monthYearLabel,
  dateRange,
  staffAvatars,
  staffCount,
  minDate,
  canGoPrev,
  onPrev,
  onNext,
  onToday,
  onChangeMode,
  onGoToDate,
  onSetRange,
}: {
  rangeMode: RangeMode
  periodLabel: string
  monthYearLabel: string
  dateRange: { start: Date; end: Date }
  staffAvatars: string[]
  staffCount: number
  minDate?: Date
  canGoPrev: boolean
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  onChangeMode: (mode: RangeMode) => void
  onGoToDate: (date: Date) => void
  onSetRange: (start: Date, end: Date) => void
}) {
  const [calendarOpen, setCalendarOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const handleOpenChange = useCallback((open: boolean) => {
    setCalendarOpen(open)
    if (open) {
      requestAnimationFrame(() => {
        triggerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      })
    }
  }, [])
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(undefined)

  const selectedWeekRange = useMemo(() => {
    if (!selectedDay) return null
    const weekStart = startOfWeek(selectedDay, { weekStartsOn: 1 })
    const weekEnd = addDays(weekStart, 6)
    return { start: weekStart, end: weekEnd }
  }, [selectedDay])

  const handleCalendarSelect = useCallback(
    (day: Date | undefined) => {
      if (!day) return
      setSelectedDay(day)
    },
    [],
  )

  const handleApplyRange = useCallback(() => {
    if (!selectedDay) return
    onGoToDate(selectedDay)
    onChangeMode("week")
    setCalendarOpen(false)
    setSelectedDay(undefined)
  }, [selectedDay, onGoToDate, onChangeMode])

  const handleQuickMonth = useCallback(
    (date: Date) => {
      onGoToDate(date)
      onChangeMode("month")
      setCalendarOpen(false)
    },
    [onGoToDate, onChangeMode],
  )

  const handleQuickWeek = useCallback(
    (date: Date) => {
      onGoToDate(date)
      onChangeMode("week")
      setCalendarOpen(false)
    },
    [onGoToDate, onChangeMode],
  )

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 rounded-xl bg-slate-100/80 p-1">
            {MODE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChangeMode(opt.value === "custom" ? rangeMode : opt.value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200",
                  rangeMode === opt.value
                    ? "bg-white text-[#037ECC] shadow-sm"
                    : "text-slate-500 hover:text-slate-700",
                  opt.value === "custom" && "hidden",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <CalendarDays className="h-4.5 w-4.5 text-[#037ECC]" />
          <span className="text-base font-bold text-slate-800">{monthYearLabel}</span>
        </div>

        <div className="flex items-center gap-2">
          <button type="button" onClick={onPrev} disabled={!canGoPrev}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all hover:border-[#037ECC]/30 hover:text-[#037ECC] hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-slate-200 disabled:hover:text-slate-500 disabled:hover:shadow-none">
            <ChevronLeft className="h-4 w-4" />
          </button>

          <Popover open={calendarOpen} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
              <button
                ref={triggerRef}
                type="button"
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-4 py-1.5 text-sm font-medium transition-all",
                  calendarOpen
                    ? "border-[#037ECC]/40 bg-[#037ECC]/5 text-[#037ECC] shadow-sm ring-2 ring-[#037ECC]/10"
                    : "border-slate-200 bg-white text-slate-600 hover:border-[#037ECC]/30 hover:text-[#037ECC] hover:shadow-sm"
                )}
              >
                <CalendarRange className="h-3.5 w-3.5" />
                <span>Period: {periodLabel}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-white border border-slate-200 shadow-2xl rounded-2xl z-[100]" align="center" sideOffset={8}>
              <div className="p-5 space-y-4">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Quick select</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { label: "This week", getDate: () => new Date(), handler: handleQuickWeek },
                      { label: "This month", getDate: () => new Date(), handler: handleQuickMonth },
                      { label: "Last month", getDate: () => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d }, handler: handleQuickMonth },
                      { label: "First week of year", getDate: () => new Date(new Date().getFullYear(), 0, 1), handler: handleQuickWeek },
                    ].map(({ label, getDate, handler }) => {
                      const target = getDate()
                      const isBlocked = !!minDate && target < minDate
                      return (
                        <button key={label} type="button" onClick={() => handler(target)} disabled={isBlocked}
                          className="px-3 py-2 text-xs font-medium text-slate-600 rounded-lg border border-slate-200 bg-white hover:bg-[#037ECC]/5 hover:border-[#037ECC]/30 hover:text-[#037ECC] transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-slate-200 disabled:hover:text-slate-600">
                          {label}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div className="h-px bg-slate-200" />
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Select a week</p>
                  <p className="text-[11px] text-slate-400">Click any day to select its full week (Mon – Sun)</p>
                  <Calendar
                    mode="single"
                    captionLayout="dropdown"
                    selected={selectedDay}
                    onSelect={handleCalendarSelect}
                    numberOfMonths={1}
                    fromYear={2020}
                    toYear={2030}
                    disabled={minDate ? { before: minDate } : undefined}
                    fromDate={minDate}
                    modifiers={selectedWeekRange ? { weekHighlight: { from: selectedWeekRange.start, to: selectedWeekRange.end } } : undefined}
                    modifiersClassNames={{ weekHighlight: "!bg-[#037ECC]/10 !text-[#037ECC] !font-semibold" }}
                  />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div className="text-xs text-slate-500">
                    {selectedWeekRange
                      ? `${format(selectedWeekRange.start, "MMM dd")} – ${format(selectedWeekRange.end, "MMM dd, yyyy")}`
                      : "No week selected"}
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyRange}
                    disabled={!selectedDay}
                    className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#037ECC] to-[#079CFB] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Check className="h-3 w-3" />
                    Apply
                  </button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <button type="button" onClick={onNext}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all hover:border-[#037ECC]/30 hover:text-[#037ECC] hover:shadow-sm">
            <ChevronRight className="h-4 w-4" />
          </button>

          <button type="button" onClick={onToday}
            className="ml-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-all hover:border-[#037ECC]/30 hover:text-[#037ECC] hover:shadow-sm">
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
    </div>
  )
}

// ─── Shared sub-components ───────────────────────────────────────────────────

export function NoteButton({ value, onChange, dateLabel }: { value: string; onChange: (v: string) => void; dateLabel: string }) {
  const hasNote = value.trim().length > 0
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "relative flex items-center justify-center rounded-xl border transition-all",
            hasNote
              ? "h-9 w-full border-teal-200 bg-teal-50/80 text-teal-600 hover:border-teal-300 hover:bg-teal-50"
              : "h-9 w-full border-slate-200 bg-slate-50/60 text-slate-400 hover:border-slate-300 hover:bg-white hover:text-slate-500",
          )}
        >
          {hasNote ? (
            <>
              <FileText className="h-3.5 w-3.5 shrink-0" />
              <div className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-teal-500 ring-2 ring-white" />
            </>
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0 bg-white border border-slate-200 shadow-xl rounded-xl z-[100]" align="center" sideOffset={6}>
        <div className="p-3 space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-teal-500" />
            <span className="text-xs font-semibold text-slate-700">{dateLabel}</span>
          </div>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Add environmental note..."
            rows={3}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-[#037ECC] focus:ring-2 focus:ring-[#037ECC]/15 transition-all resize-none"
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function RowLabel({ icon, title, badge, badgeColor }: { icon: React.ReactNode; title: string; badge?: string; badgeColor?: "blue" | "teal" }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white border-r border-slate-100 sticky left-0 z-10 shadow-[2px_0_8px_rgba(0,0,0,0.04)]">
      <div className="shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-700 leading-tight">{title}</p>
        {badge && <span className={cn("text-[10px] font-semibold leading-none mt-0.5 inline-block", badgeColor === "blue" && "text-[#037ECC]", badgeColor === "teal" && "text-teal-500")}>{badge}</span>}
      </div>
    </div>
  )
}

export function SaveBar({ label, sublabel, saveLabel, saveState, onSave, onDiscard, accentColor }: {
  label: string; sublabel: string; saveLabel: string; saveState: "idle" | "saving" | "success"; onSave: () => void; onDiscard: () => void; accentColor?: "amber" | "emerald"
}) {
  const color = accentColor ?? "amber"
  const borderColor = color === "emerald" ? "border-emerald-300/70" : "border-amber-300/70"
  const shimmerColor = color === "emerald" ? "via-emerald-400" : "via-amber-400"
  const indicatorBg = color === "emerald" ? "bg-emerald-400/20" : "bg-amber-400/20"
  const indicatorInner = color === "emerald" ? "from-emerald-100 to-emerald-50 border-emerald-200/60" : "from-amber-100 to-amber-50 border-amber-200/60"
  const iconColor = color === "emerald" ? "text-emerald-600" : "text-amber-600"

  return (
    <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} className="sticky bottom-4 z-30">
      <div className={cn("relative rounded-2xl border bg-white shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden", borderColor)}>
        <div className={cn("absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent to-transparent animate-[shimmer_2s_ease-in-out_infinite]", shimmerColor)} />
        <div className="flex items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center">
              <div className={cn("absolute inset-0 rounded-full animate-ping", indicatorBg)} />
              <div className={cn("relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br border", indicatorInner)}>
                <Save className={cn("h-4 w-4", iconColor)} />
              </div>
            </div>
            <div><p className="text-sm font-semibold text-slate-800">{label}</p><p className="text-xs text-slate-500">{sublabel}</p></div>
          </div>
          <div className="flex items-center gap-2.5">
            <button type="button" onClick={onDiscard} className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600 active:scale-[0.97]">
              <RotateCcw className="h-3.5 w-3.5" />Discard
            </button>
            <motion.button type="button" onClick={onSave} disabled={saveState === "saving"}
              animate={saveState === "success" ? { scale: 1 } : { scale: [1, 1.03, 1] }}
              transition={saveState === "success" ? {} : { duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className={cn("flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.97] disabled:opacity-80",
                saveState === "success" ? "bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_4px_14px_rgba(16,185,129,0.4)]" : "bg-gradient-to-r from-[#037ECC] to-[#079CFB] shadow-[0_4px_14px_rgba(3,126,204,0.4)] hover:shadow-[0_6px_20px_rgba(3,126,204,0.5)] hover:brightness-110")}>
              {saveState === "saving" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : saveState === "success" ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
              {saveState === "saving" ? "Saving..." : saveState === "success" ? "Saved!" : saveLabel}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function EnvironmentalChangesLegend({ entries }: { entries: Record<string, { environmentalNote?: string }> }) {
  const changes = useMemo(() => {
    const result: { dateKey: string; note: string }[] = []
    for (const [dateKey, entry] of Object.entries(entries)) {
      const note = entry.environmentalNote?.trim()
      if (note) result.push({ dateKey, note })
    }
    return result.sort((a, b) => a.dateKey.localeCompare(b.dateKey))
  }, [entries])

  if (changes.length === 0) return null

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm px-5 py-4">
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="h-4 w-4 text-teal-500" />
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Environmental Changes</h4>
        <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-teal-50 border border-teal-200/60 text-[10px] font-bold text-teal-600 tabular-nums">{changes.length}</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-2">
        {changes.map(({ dateKey, note }) => {
          const [y, m, d] = dateKey.split("-")
          const dateObj = new Date(Number(y), Number(m) - 1, Number(d))
          return (
            <div key={dateKey} className="flex items-center gap-2 min-w-0">
              <div className="h-1.5 w-1.5 rounded-full bg-teal-400 shrink-0" />
              <span className="text-sm font-semibold text-slate-700 tabular-nums shrink-0">{format(dateObj, "MM/dd/yyyy")}</span>
              <span className="text-sm text-slate-500 truncate">{note}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export { AnimatePresence }
