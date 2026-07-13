"use client"

import { useRouter } from "next/navigation"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { X } from "lucide-react"
import type { Appointment, AppointmentStatus, EventType } from "@/lib/types/appointment.types"
import { formatTime } from "@/lib/date"
import {
  type CalendarViewMode,
  formatAppointmentTimeRange,
  getAppointmentBillingCodeLabel,
  getCalendarEventTypeLabel,
  getEventColor,
  buildSessionNoteUrl,
  buildDataCollectionUrl,
  formatAppointmentUnits,
} from "@/lib/modules/schedules/utils/schedule-display"
import { cn } from "@/lib/utils"

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  Scheduled: "bg-blue-50 text-blue-700 border-blue-200",
  InProgress: "bg-amber-50 text-amber-700 border-amber-200",
  Completed: "bg-green-50 text-green-700 border-green-200",
  Cancelled: "bg-red-50 text-red-700 border-red-200",
  NoShow: "bg-gray-50 text-gray-700 border-gray-200",
}

/** Minimum card height (px) to show details + buttons inline */
const INLINE_THRESHOLD = 140

type CardLayout = "grid" | "list"

interface AppointmentCardProps {
  appointment: Appointment
  viewMode?: CalendarViewMode
  layout?: CardLayout
  eventColors?: Partial<Record<EventType, string>>
  cardHeight?: number
  onClick?: () => void
  onDelete?: (e: React.MouseEvent) => void
  isDragOverlay?: boolean
}

export function AppointmentCard({
  appointment,
  viewMode = "client",
  layout = "grid",
  eventColors,
  cardHeight = 0,
  onClick,
  onDelete,
  isDragOverlay = false,
}: AppointmentCardProps) {
  const router = useRouter()
  const eventType = appointment.eventType ?? "session_note"
  const eventColor = getEventColor(eventType, eventColors)
  const eventLabel = getCalendarEventTypeLabel(eventType)
  const billingCode = getAppointmentBillingCodeLabel(appointment)
  const locationLabel = appointment.addressLabel?.trim() || appointment.location
  const units = formatAppointmentUnits(appointment)
  const showPeople = viewMode === "general"
  const clientName = appointment.clientName?.trim() || ""
  const hasSupervision = !!appointment.supervision

  // List layout: used in agency view — shows all info, floating hover buttons
  if (layout === "list") {
    return (
      <div
        className={cn(
          "group/card relative w-full",
          "bg-white rounded-lg",
          "border-l-[3px] border border-gray-100",
          "shadow-[0_1px_3px_rgba(0,0,0,0.08)]",
          "transition-all duration-200",
          "cursor-pointer overflow-visible",
          "hover:shadow-[0_4px_16px_rgba(0,0,0,0.10)]",
          "hover:border-gray-200",
          appointment.status === "Cancelled" && "opacity-60",
        )}
        style={{ borderLeftColor: eventColor }}
        onClick={onClick}
      >
        {/* Delete X */}
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="absolute right-1.5 top-1 z-10 opacity-0 group-hover/card:opacity-100 transition-opacity duration-200 p-0.5 rounded-full hover:bg-red-100"
          >
            <X className="h-3 w-3 text-red-500" />
          </button>
        )}

        <div className="px-2.5 py-2 space-y-0.5">
          {/* Row 1: Time range */}
          <div className="flex items-center gap-1.5">
            <p className="text-[11px] font-semibold text-gray-800">
              {formatAppointmentTimeRange(appointment)}
            </p>
            <span
              className={cn(
                "text-[8px] px-1.5 py-px rounded-full border flex-shrink-0",
                "font-medium whitespace-nowrap leading-tight",
                STATUS_STYLES[appointment.status],
              )}
            >
              {appointment.status}
            </span>
          </div>

          {/* Row 2: Event type */}
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-900">
            {eventLabel}
          </p>

          {/* Row 3: Billing code (units) | Location */}
          <p className="text-[10px] text-gray-500">
            {billingCode}
            {units != null ? ` (${units})` : ""}
            {locationLabel ? ` | ${locationLabel}` : ""}
          </p>

          {/* Row 4: Provider | Client */}
          <p className="text-[10px] text-gray-400">
            {[appointment.providerName, clientName].filter(Boolean).join(" | ")}
          </p>

          {/* Supervision sub-event details */}
          {hasSupervision && (
            <div className="mt-1.5 rounded-lg border border-indigo-200 bg-indigo-50/60 px-2.5 py-2 space-y-0.5">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-indigo-500 flex-shrink-0" />
                <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-800">
                  Supervision
                </p>
              </div>
              <p className="text-[10px] text-indigo-700">
                {formatTime(`2000-01-01T${appointment.supervision!.timeInit}`)}
                {" - "}
                {formatTime(`2000-01-01T${appointment.supervision!.timeEnd}`)}
                {appointment.supervision!.units != null && (
                  <span className="text-indigo-500"> ({appointment.supervision!.units} units)</span>
                )}
              </p>
              {appointment.supervision!.providerName && (
                <p className="text-[10px] text-indigo-600">
                  {appointment.supervision!.providerName}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Floating action buttons on hover */}
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover/card:opacity-100 transition-all duration-200 pointer-events-none group-hover/card:pointer-events-auto">
          <button
            type="button"
            className="px-2.5 py-1 text-[9px] font-semibold text-white bg-slate-800 rounded-md shadow-lg hover:bg-slate-700 transition-colors whitespace-nowrap"
            onClick={(e) => {
              e.stopPropagation()
              router.push(buildSessionNoteUrl(appointment))
            }}
          >
            Session Note
          </button>
          <button
            type="button"
            className="px-2.5 py-1 text-[9px] font-semibold text-white bg-[#2563EB] rounded-md shadow-lg hover:bg-[#1d4ed8] transition-colors whitespace-nowrap"
            onClick={(e) => {
              e.stopPropagation()
              router.push(buildDataCollectionUrl(appointment))
            }}
          >
            Data Collection
          </button>
        </div>

        {/* Bottom color bar */}
        <div
          className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-lg"
          style={{ backgroundColor: eventColor }}
        />
      </div>
    )
  }

  // Grid layout (default): time-grid positioned cards
  const showInline = cardHeight >= INLINE_THRESHOLD
  const needsHover = !showInline && !isDragOverlay

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: appointment.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    "--service-color": eventColor,
  } as React.CSSProperties

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "group/card relative h-full w-full",
        "bg-white rounded-lg",
        "border-l-[3px] border border-gray-100",
        "shadow-[0_1px_3px_rgba(0,0,0,0.08)]",
        "transition-all duration-200",
        "cursor-pointer overflow-visible",
        "border-l-[var(--service-color)]",
        "hover:shadow-[0_6px_20px_rgba(0,0,0,0.12)]",
        "hover:border-gray-200",
        "hover:z-[60]",
        isDragging && "opacity-50 shadow-2xl scale-105 z-50",
        isDragOverlay && "shadow-2xl scale-105",
        appointment.status === "Cancelled" && "opacity-60",
      )}
      onClick={onClick}
    >
      {/* Delete button */}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className={cn(
            "absolute right-1.5 top-1 z-10",
            "opacity-0 group-hover/card:opacity-100",
            "transition-opacity duration-200",
            "p-0.5 rounded-full hover:bg-red-100",
          )}
        >
          <X className="h-3 w-3 text-red-500" />
        </button>
      )}

      {/* Card body */}
      <div className="h-full overflow-hidden px-2.5 pt-5 pb-1.5 flex flex-col">
        {/* Header info */}
        <div>
          <div className="flex items-center gap-1 mb-0.5">
            <p className="text-[10px] font-medium text-gray-700 truncate">
              {formatAppointmentTimeRange(appointment)}
            </p>
            <span
              className={cn(
                "text-[8px] px-1 py-px rounded-full border flex-shrink-0",
                "font-medium whitespace-nowrap leading-tight",
                STATUS_STYLES[appointment.status],
              )}
            >
              {appointment.status}
            </span>
          </div>

          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-900 truncate">
            {clientName || eventLabel}
          </p>

          <p className="text-[10px] text-gray-500 truncate">
            {billingCode} · {locationLabel}
          </p>

          {showPeople && (
            <p className="text-[10px] text-gray-400 truncate">
              {[appointment.providerName, appointment.clientName].filter(Boolean).join(" · ")}
            </p>
          )}

          {/* Supervision sub-event indicator */}
          {hasSupervision && (
            <div className="mt-1 rounded-md border border-indigo-200 bg-indigo-50/60 px-1.5 py-1 space-y-px">
              <div className="flex items-center gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                <p className="text-[9px] font-bold text-indigo-800">SUPERVISION</p>
              </div>
              <p className="text-[9px] text-indigo-600 truncate">
                {formatTime(`2000-01-01T${appointment.supervision!.timeInit}`)}
                {" - "}
                {formatTime(`2000-01-01T${appointment.supervision!.timeEnd}`)}
                {appointment.supervision!.providerName && ` · ${appointment.supervision!.providerName}`}
              </p>
            </div>
          )}
        </div>

        {/* Inline details + buttons — when card is tall enough */}
        {showInline && (
          <div className="mt-auto pt-1.5">
            <div className="flex items-center gap-2 mb-2 text-[10px] text-gray-500">
              {units != null && (
                <span><span className="font-semibold text-gray-700">{units}</span> units</span>
              )}
              <span className="truncate">{billingCode}</span>
            </div>

            <div className="grid grid-cols-1 gap-1.5">
              <button
                type="button"
                className="h-7 text-[10px] font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:border-gray-300 transition-colors text-center"
                onClick={(e) => {
                  e.stopPropagation()
                  router.push(buildSessionNoteUrl(appointment))
                }}
              >
                Session Note
              </button>
              <button
                type="button"
                className="h-7 text-[10px] font-semibold text-white bg-[#2563EB] rounded-lg hover:bg-[#1d4ed8] transition-colors text-center"
                onClick={(e) => {
                  e.stopPropagation()
                  router.push(buildDataCollectionUrl(appointment))
                }}
              >
                Data Collection
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hover panel — only when card is too small */}
      {needsHover && (
        <div
          className={cn(
            "absolute left-[-1px] right-[-1px] bottom-0 z-20",
            "translate-y-full",
            "opacity-0 pointer-events-none",
            "group-hover/card:opacity-100 group-hover/card:pointer-events-auto",
            "transition-all duration-200 ease-out",
          )}
        >
          <div
            className="bg-white rounded-b-xl border border-t-0 border-gray-200 shadow-[0_12px_32px_rgba(0,0,0,0.14)]"
            style={{ borderLeftColor: eventColor, borderLeftWidth: 3 }}
          >
            <div className="flex items-center gap-3 px-3 py-2 border-t border-gray-100">
              {units != null && (
                <span className="text-[10px] text-gray-500">
                  <span className="font-semibold text-gray-700">{units}</span> units
                </span>
              )}
              <span className="text-[10px] text-gray-500 truncate">
                {billingCode}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-1.5 px-2.5 pb-2.5 pt-1">
              <button
                type="button"
                className="h-7 text-[10px] font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:border-gray-300 transition-colors text-center"
                onClick={(e) => {
                  e.stopPropagation()
                  router.push(buildSessionNoteUrl(appointment))
                }}
              >
                Session Note
              </button>
              <button
                type="button"
                className="h-7 text-[10px] font-semibold text-white bg-[#2563EB] rounded-lg hover:bg-[#1d4ed8] transition-colors text-center"
                onClick={(e) => {
                  e.stopPropagation()
                  router.push(buildDataCollectionUrl(appointment))
                }}
              >
                Data Collection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom color bar */}
      <div
        className="absolute bottom-0 left-0 right-0 h-0.5"
        style={{ backgroundColor: eventColor }}
      />
    </div>
  )
}
