"use client"

import { useState } from "react"
import { format, parseISO } from "date-fns"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
} from "lucide-react"
import { Button } from "@/components/custom/Button"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { formatWeekRange, formatMonthLabel } from "@/lib/date"
import type { CalendarView } from "../hooks/useWeekCalendar"
import { cn } from "@/lib/utils"

interface CalendarToolbarProps {
  calendarView: CalendarView
  weekStart: string
  monthStart: string
  canCreate: boolean
  onViewChange: (view: CalendarView) => void
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  onDateSelect: (date: Date) => void
  onNewSession: () => void
}

const VIEW_OPTIONS: { value: CalendarView; label: string }[] = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
]

export function CalendarToolbar({
  calendarView,
  weekStart,
  monthStart,
  canCreate,
  onViewChange,
  onPrev,
  onNext,
  onToday,
  onDateSelect,
  onNewSession,
}: CalendarToolbarProps) {
  const [datePickerOpen, setDatePickerOpen] = useState(false)

  const label =
    calendarView === "month"
      ? formatMonthLabel(monthStart)
      : `Week of ${formatWeekRange(weekStart)}`

  const pickerDate =
    calendarView === "month"
      ? parseISO(monthStart)
      : parseISO(weekStart)

  return (
    <div className="flex items-center justify-between px-5 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
      {/* Left — View Toggle */}
      <div className="relative flex items-center rounded-xl bg-slate-100 p-1">
        {VIEW_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onViewChange(opt.value)}
            className={cn(
              "relative z-10 px-4 py-1.5 text-sm font-medium rounded-lg transition-all duration-200",
              calendarView === opt.value
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Center — Today + Arrows + Label + Date Picker */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onToday}
          className="px-3.5 py-1.5 text-sm font-medium text-gray-700 border border-slate-200 hover:bg-gray-50 rounded-lg transition-colors"
        >
          Today
        </button>

        <button
          onClick={onPrev}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Previous"
        >
          <ChevronLeft className="h-4.5 w-4.5 text-gray-500" />
        </button>

        <button
          onClick={onNext}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Next"
        >
          <ChevronRight className="h-4.5 w-4.5 text-gray-500" />
        </button>

        <h2 className="text-[15px] font-semibold text-gray-900 whitespace-nowrap ml-2">
          {label}
        </h2>

        <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
          <PopoverTrigger asChild>
            <button
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-[#037ECC]"
              aria-label="Jump to date"
            >
              <CalendarIcon className="h-4.5 w-4.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-white border border-slate-200 shadow-xl rounded-xl" align="center" sideOffset={8}>
            <Calendar
              mode="single"
              selected={pickerDate}
              defaultMonth={pickerDate}
              onSelect={(date) => {
                if (date) {
                  onDateSelect(date)
                  setDatePickerOpen(false)
                }
              }}
              className="rounded-xl"
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Right — Actions */}
      <div className="flex items-center">
        {canCreate && (
          <Button
            variant="primary"
            onClick={onNewSession}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Session
          </Button>
        )}
      </div>
    </div>
  )
}
