"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarRange, ChevronLeft, ChevronRight, X } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format, differenceInCalendarDays } from "date-fns"

interface PremiumDateRangePickerProps {
  /** `yyyy-MM-dd` or empty string */
  startValue: string
  /** `yyyy-MM-dd` or empty string */
  endValue: string
  /** Emits both endpoints; empty strings when cleared */
  onChange: (start: string, end: string) => void
  label?: string
  required?: boolean
  hasError?: boolean
  disabled?: boolean
}

function parseLocalDate(dateStr: string): Date | undefined {
  if (!dateStr) return undefined
  const [year, month, day] = dateStr.split("-").map(Number)
  if (!year || !month || !day) return undefined
  return new Date(year, month - 1, day)
}

function toDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const TODAY = toDateString(new Date())

/**
 * Day-level range picker that follows the same two-click interaction as
 * `MonthRangePicker`: first click → start, second click → end, hover preview,
 * `onChange` only fires when the range is complete.
 */
export function PremiumDateRangePicker({
  startValue,
  endValue,
  onChange,
  label = "Period",
  required = false,
  hasError,
  disabled,
}: PremiumDateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [displayMonth, setDisplayMonth] = useState<Date>(new Date())
  const [pendingStart, setPendingStart] = useState<string | null>(null)
  const [hoveredDate, setHoveredDate] = useState<string | null>(null)

  const startDate = useMemo(() => parseLocalDate(startValue), [startValue])
  const endDate = useMemo(() => parseLocalDate(endValue), [endValue])

  // Reset pending state and navigate on open
  useEffect(() => {
    if (!isOpen) return
    setPendingStart(null)
    setHoveredDate(null)
    if (startDate) setDisplayMonth(new Date(startDate.getFullYear(), startDate.getMonth(), 1))
    else setDisplayMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Trigger label ──
  const triggerLabel = useMemo(() => {
    if (!startDate || !endDate) return ""
    return `${format(startDate, "MM/dd/yyyy")}  –  ${format(endDate, "MM/dd/yyyy")}`
  }, [startDate, endDate])

  const dayCount = useMemo(() => {
    if (!startDate || !endDate) return 0
    return differenceInCalendarDays(endDate, startDate) + 1
  }, [startDate, endDate])

  // ── Highlight range: pending preview or confirmed ──
  const [highlightFrom, highlightTo] = useMemo(() => {
    if (pendingStart != null) {
      const end =
        hoveredDate != null && hoveredDate >= pendingStart
          ? hoveredDate
          : pendingStart
      return [pendingStart, end]
    }
    return [startValue || "", endValue || ""]
  }, [pendingStart, hoveredDate, startValue, endValue])

  // ── Day grid for the displayed month ──
  const cells = useMemo(() => {
    const year = displayMonth.getFullYear()
    const month = displayMonth.getMonth()
    const firstDow = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const daysInPrev = new Date(year, month, 0).getDate()

    const result: { date: Date; dateStr: string; isOutside: boolean }[] = []

    // Trailing days of previous month
    for (let i = firstDow - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, daysInPrev - i)
      result.push({ date: d, dateStr: toDateString(d), isOutside: true })
    }

    // Current month
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day)
      result.push({ date: d, dateStr: toDateString(d), isOutside: false })
    }

    // Leading days of next month to fill grid
    const remainder = result.length % 7
    if (remainder > 0) {
      const fill = 7 - remainder
      for (let day = 1; day <= fill; day++) {
        const d = new Date(year, month + 1, day)
        result.push({ date: d, dateStr: toDateString(d), isOutside: true })
      }
    }

    return result
  }, [displayMonth])

  // ── Selection: same pattern as MonthRangePicker ──
  const handleDayClick = (dateStr: string) => {
    if (pendingStart == null) {
      setPendingStart(dateStr)
      return
    }
    if (dateStr < pendingStart) {
      setPendingStart(dateStr)
      return
    }
    onChange(pendingStart, dateStr)
    setPendingStart(null)
    setIsOpen(false)
  }

  const handleClear = (event: React.MouseEvent) => {
    event.stopPropagation()
    onChange("", "")
    setPendingStart(null)
  }

  return (
    <Popover open={isOpen} onOpenChange={(open) => !disabled && setIsOpen(open)}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "premium-input relative h-[52px] 2xl:h-[56px] w-full rounded-[16px] px-4 text-left",
            "flex items-center gap-2",
            hasError && "premium-input-error",
            disabled && "cursor-not-allowed opacity-60",
          )}
        >
          <span
            className={cn(
              "pointer-events-none absolute px-1 transition-all duration-200 ease-out",
              "bg-white/20 backdrop-blur-md text-[var(--color-login-text-muted)]",
              triggerLabel || isOpen
                ? "left-4 top-0 -translate-y-1/2 text-xs"
                : "left-10 top-1/2 -translate-y-1/2 text-sm",
              isOpen && !disabled && "text-[#2563EB]",
            )}
          >
            {label} {required && <span className="text-[#037ECC]">*</span>}
          </span>

          <CalendarRange className="h-4 w-4 shrink-0 text-[#037ECC]" />
          <span className="flex-1 truncate text-[15px] tabular-nums text-slate-800">
            {triggerLabel}
          </span>

          {triggerLabel && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              aria-label="Clear period"
              onClick={handleClear}
              className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-200/70 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="z-[100] w-[320px] rounded-2xl border border-slate-200 bg-white p-0 shadow-xl"
      >
        {/* Month navigation */}
        <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2.5">
          <button
            type="button"
            onClick={() => setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1, 1))}
            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold text-slate-800">
            {format(displayMonth, "MMMM yyyy")}
          </span>
          <button
            type="button"
            onClick={() => setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 1))}
            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Day grid */}
        <div
          className="grid grid-cols-7 gap-y-0.5 px-3 py-2"
          onMouseLeave={() => setHoveredDate(null)}
        >
          {/* Weekday headers */}
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="pb-1.5 text-center text-[11px] font-semibold text-slate-400"
            >
              {day}
            </div>
          ))}

          {/* Day cells */}
          {cells.map(({ date, dateStr, isOutside }, i) => {
            const isStart = dateStr === highlightFrom
            const isEnd = dateStr === highlightTo
            const inRange =
              !!highlightFrom &&
              !!highlightTo &&
              dateStr > highlightFrom &&
              dateStr < highlightTo
            const isEdge = (isStart || isEnd) && !!highlightFrom
            const isToday = dateStr === TODAY

            return (
              <button
                key={i}
                type="button"
                onClick={() => handleDayClick(dateStr)}
                onMouseEnter={() => setHoveredDate(dateStr)}
                className={cn(
                  "h-8 text-[13px] font-medium transition-all duration-150",
                  // Shape: edges get full rounding, range fills get side rounding
                  isEdge && isStart && isEnd && "rounded-lg",
                  isEdge && isStart && !isEnd && "rounded-l-lg",
                  isEdge && isEnd && !isStart && "rounded-r-lg",
                  inRange && "rounded-none",
                  !isEdge && !inRange && "rounded-lg",
                  // Colors
                  isOutside && !isEdge && !inRange && "text-slate-300 hover:text-slate-400 hover:bg-slate-50",
                  !isOutside && !isEdge && !inRange && "text-slate-600 hover:bg-[#037ECC]/10 hover:text-[#037ECC]",
                  inRange && "bg-[#037ECC]/10 text-[#037ECC]",
                  isEdge && "bg-[#037ECC] text-white shadow-sm shadow-[#037ECC]/30",
                  // Today ring (when not selected)
                  isToday && !isEdge && "ring-2 ring-inset ring-[#037ECC]/20",
                )}
              >
                {date.getDate()}
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-3 py-2.5 text-[11px] text-slate-500">
          {pendingStart != null ? (
            <span>
              Start:{" "}
              <strong className="text-slate-700">
                {format(parseLocalDate(pendingStart)!, "MMM dd, yyyy")}
              </strong>{" "}
              — now pick the end date
            </span>
          ) : dayCount > 0 ? (
            <span>
              <strong className="text-slate-700">{dayCount}</strong>{" "}
              {dayCount === 1 ? "day" : "days"} selected
            </span>
          ) : (
            <span>Pick the start date, then the end date</span>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
