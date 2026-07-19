"use client"

import { useMemo, useState, useRef, useCallback, useEffect } from "react"
import { createPortal } from "react-dom"
import { format, isSameMonth, parseISO } from "date-fns"
import { Clock, User, MoreVertical } from "lucide-react"
import type { Appointment, AppointmentStatus } from "@/lib/types/appointment.types"
import { formatTime, isToday } from "@/lib/date"
import { getAppointmentBillingCodeLabel } from "@/lib/modules/schedules/utils/schedule-display"
import { cn } from "@/lib/utils"

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const STATUS_DOT: Record<AppointmentStatus, string> = {
  Scheduled: "bg-blue-400",
  InProgress: "bg-amber-400",
  Completed: "bg-emerald-400",
  Cancelled: "bg-red-400",
  NoShow: "bg-slate-400",
}

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  Scheduled: "Scheduled",
  InProgress: "In Progress",
  Completed: "Completed",
  Cancelled: "Cancelled",
  NoShow: "No Show",
}

interface MonthCalendarProps {
  monthStart: string
  monthDays: Date[]
  appointments: Appointment[]
  isLoading: boolean
  isMenuOpen: boolean
  onDayClick: (date: Date) => void
  onAppointmentMenu?: (x: number, y: number, appointmentId: string) => void
}

export function MonthCalendar({
  monthStart,
  monthDays,
  appointments,
  isLoading,
  isMenuOpen,
  onDayClick,
  onAppointmentMenu,
}: MonthCalendarProps) {
  const month = parseISO(monthStart)

  // Group appointments by date key
  const appointmentsByDate = useMemo(() => {
    const map: Record<string, Appointment[]> = {}
    for (const apt of appointments) {
      const key = apt.date ?? format(parseISO(apt.startsAt), "yyyy-MM-dd")
      if (!map[key]) map[key] = []
      map[key].push(apt)
    }
    // Sort each day's appointments by start time
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => parseISO(a.startsAt).getTime() - parseISO(b.startsAt).getTime())
    }
    return map
  }, [appointments])

  // Split days into weeks (rows of 7)
  const weeks = useMemo(() => {
    const result: Date[][] = []
    for (let i = 0; i < monthDays.length; i += 7) {
      result.push(monthDays.slice(i, i + 7))
    }
    return result
  }, [monthDays])

  return (
    <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 backdrop-blur-[1px] rounded-2xl">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#037ECC] border-t-transparent" />
            Loading sessions...
          </div>
        </div>
      )}

      {/* Weekday header */}
      <div className="grid grid-cols-7 border-b border-slate-100">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-400"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="divide-y divide-slate-100">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 divide-x divide-slate-100">
            {week.map((day) => {
              const key = format(day, "yyyy-MM-dd")
              const dayAppointments = appointmentsByDate[key] ?? []
              const count = dayAppointments.length
              const inMonth = isSameMonth(day, month)
              const today = isToday(day)

              return (
                <MonthDayCell
                  key={key}
                  day={day}
                  dateKey={key}
                  count={count}
                  inMonth={inMonth}
                  today={today}
                  appointments={dayAppointments}
                  onClick={() => onDayClick(day)}
                  onAppointmentMenu={onAppointmentMenu}
                  isMenuOpen={isMenuOpen}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Day Cell with hover popover ───

interface MonthDayCellProps {
  day: Date
  dateKey: string
  count: number
  inMonth: boolean
  today: boolean
  appointments: Appointment[]
  onClick: () => void
  onAppointmentMenu?: (x: number, y: number, appointmentId: string) => void
  isMenuOpen: boolean
}

function MonthDayCell({ day, dateKey, count, inMonth, today, appointments, onClick, onAppointmentMenu, isMenuOpen }: MonthDayCellProps) {
  const [showPopover, setShowPopover] = useState(false)
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({})
  const cellRef = useRef<HTMLButtonElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hadMenuRef = useRef(false)

  const handleMouseEnter = useCallback(() => {
    if (count === 0) return
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setShowPopover(true), 300)
  }, [count])

  const handleMouseLeave = useCallback(() => {
    if (isMenuOpen) {
      hadMenuRef.current = true
      return // keep popover while context menu is active
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setShowPopover(false), 150)
  }, [isMenuOpen])

  // When the context menu closes (isMenuOpen goes false), close the popover too
  useEffect(() => {
    if (!isMenuOpen && hadMenuRef.current) {
      hadMenuRef.current = false
      setShowPopover(false)
    }
  }, [isMenuOpen])

  // Compute portal position when popover opens
  useEffect(() => {
    if (!showPopover || !cellRef.current) return
    const rect = cellRef.current.getBoundingClientRect()
    const popoverW = 300
    const popoverH = 280 // approximate max height

    // Horizontal: center on cell, clamp to viewport
    let left = rect.left + rect.width / 2 - popoverW / 2
    left = Math.max(8, Math.min(left, window.innerWidth - popoverW - 8))

    // Vertical: prefer above the cell; if not enough space, show below
    const spaceAbove = rect.top
    let top: number
    if (spaceAbove >= popoverH + 8) {
      top = rect.top - popoverH - 8 + window.scrollY
    } else {
      top = rect.bottom + 8 + window.scrollY
    }

    setPopoverStyle({ position: "absolute", top, left, width: popoverW, zIndex: 90 })
  }, [showPopover])

  return (
    <button
      ref={cellRef}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "group relative flex flex-col items-start gap-1.5 px-3 py-3 min-h-[100px] text-left transition-colors hover:bg-slate-50/80",
        !inMonth && "bg-slate-50/40",
      )}
    >
      {/* Day number */}
      <span
        className={cn(
          "inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium transition-colors",
          today
            ? "bg-[#037ECC] text-white font-semibold"
            : inMonth
              ? "text-slate-800 group-hover:bg-slate-100"
              : "text-slate-400",
        )}
      >
        {format(day, "d")}
      </span>

      {/* Appointment count badge */}
      {count > 0 && (
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-semibold",
            inMonth
              ? "bg-[#037ECC]/10 text-[#037ECC]"
              : "bg-slate-100 text-slate-400",
          )}
        >
          {count} {count === 1 ? "session" : "sessions"}
        </span>
      )}

      {/* Hover popover — rendered in a portal so it's never clipped */}
      {showPopover && count > 0 && createPortal(
        <div
          style={popoverStyle}
          onMouseEnter={() => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
          }}
          onMouseLeave={handleMouseLeave}
          className="rounded-xl border border-slate-200 bg-white shadow-2xl animate-in fade-in-0 zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {format(day, "EEEE, MMM d")}
            </p>
            <p className="text-sm font-bold text-slate-800 mt-0.5">
              {count} {count === 1 ? "Session" : "Sessions"}
            </p>
          </div>

          {/* Session list */}
          <div className="max-h-[240px] overflow-y-auto divide-y divide-slate-100">
            {appointments.map((apt) => (
              <SessionPreviewRow key={apt.id} appointment={apt} onMenu={onAppointmentMenu} />
            ))}
          </div>

          {/* Footer hint */}
          <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50 rounded-b-xl">
            <p className="text-[11px] text-slate-400 text-center">
              Click to view week
            </p>
          </div>
        </div>,
        document.body,
      )}
    </button>
  )
}

// ─── Session row inside popover ───

function SessionPreviewRow({
  appointment,
  onMenu,
}: {
  appointment: Appointment
  onMenu?: (x: number, y: number, appointmentId: string) => void
}) {
  const billingCode = getAppointmentBillingCodeLabel(appointment)
  const status = appointment.status ?? "Scheduled"
  const timeRange = `${formatTime(appointment.startsAt)} – ${formatTime(appointment.endsAt)}`

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    onMenu?.(rect.right, rect.bottom, appointment.id)
  }

  return (
    <div className="group/row px-4 py-2.5 hover:bg-slate-50/60 transition-colors">
      {/* Top: Time + Status + Menu */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
          <Clock className="h-3 w-3 text-slate-400" />
          {timeRange}
        </div>
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1.5">
            <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[status])} />
            <span className="text-[11px] font-medium text-slate-500">
              {STATUS_LABEL[status]}
            </span>
          </div>
          {onMenu && (
            <button
              type="button"
              onClick={handleMenuClick}
              className="opacity-0 group-hover/row:opacity-100 ml-1 p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Client + Billing Code */}
      <div className="mt-1.5 space-y-0.5">
        {appointment.clientName && (
          <div className="flex items-center gap-1.5">
            <User className="h-3 w-3 text-slate-300 shrink-0" />
            <span className="text-sm font-semibold text-slate-800 truncate">
              {appointment.clientName}
            </span>
          </div>
        )}
        {billingCode && (
          <p className="text-xs text-slate-500 pl-[18px] truncate">
            {billingCode}
            {appointment.providerName && ` · ${appointment.providerName}`}
          </p>
        )}
      </div>
    </div>
  )
}
