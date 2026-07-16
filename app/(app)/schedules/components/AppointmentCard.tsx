"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { MoreVertical } from "lucide-react"
import type { Appointment, AppointmentStatus, EventType } from "@/lib/types/appointment.types"
import { formatTime } from "@/lib/date"
import {
  type CalendarViewMode,
  formatAppointmentTimeRange,
  getAppointmentBillingCodeLabel,
  getCalendarEventTypeLabel,
  getEventColor,
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

type CardLayout = "grid" | "list"

interface AppointmentCardProps {
  appointment: Appointment
  viewMode?: CalendarViewMode
  layout?: CardLayout
  eventColors?: Partial<Record<EventType, string>>
  cardHeight?: number
  onClick?: () => void
  onOpenMenu?: (x: number, y: number) => void
  onOpenSupervisionMenu?: (x: number, y: number) => void
  isDragOverlay?: boolean
}

export function AppointmentCard({
  appointment,
  viewMode = "client",
  layout = "grid",
  eventColors,
  cardHeight = 0,
  onClick,
  onOpenMenu,
  onOpenSupervisionMenu,
  isDragOverlay = false,
}: AppointmentCardProps) {
  const eventType = appointment.eventType ?? "session_note"
  const eventColor = getEventColor(eventType, eventColors)
  const eventLabel = getCalendarEventTypeLabel(eventType)
  const billingCode = getAppointmentBillingCodeLabel(appointment)
  const locationLabel = appointment.addressLabel?.trim() || appointment.location
  const units = formatAppointmentUnits(appointment)
  const showPeople = viewMode === "general"
  const clientName = appointment.clientName?.trim() || ""
  const hasSupervision = !!appointment.supervision

  // Format supervision billing code labels
  const sup = appointment.supervision
  // Session BC: try supervision response fields, fallback to parent appointment's billingCodeName
  const supSessionBC = sup?.billingCodeCode
    ? [sup.billingCodeCode, sup.billingCodeModifier ? `(${sup.billingCodeModifier})` : ""].filter(Boolean).join(" ")
    : appointment.billingCodeName || null
  // Supervision BC: from supervision response fields
  const supBillingBC = sup?.supervisionBillingCodeCode
    ? [sup.supervisionBillingCodeCode, sup.supervisionBillingCodeModifier ? `(${sup.supervisionBillingCodeModifier})` : ""].filter(Boolean).join(" ")
    : null

  const handleMenuClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    onOpenMenu?.(rect.right, rect.bottom + 4)
  }

  const handleSupervisionMenuClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    onOpenSupervisionMenu?.(rect.right, rect.bottom + 4)
  }

  // ─── Menu trigger button (shared between layouts) ───
  const menuButton = onOpenMenu && (
    <button
      type="button"
      onClick={handleMenuClick}
      className={cn(
        "absolute right-1 top-1 z-10",
        "p-1 rounded-md",
        "opacity-100",
        "transition-all duration-150",
        "hover:bg-gray-100",
        "text-gray-400 hover:text-gray-600",
      )}
    >
      <MoreVertical className="h-3.5 w-3.5" />
    </button>
  )

  // ─── List layout ───────────────────────────────────────────────────
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
        {menuButton}

        <div className="px-2.5 py-2 pr-7 space-y-0.5">
          {/* Row 1: Time range + status */}
          <div className="flex items-center justify-between gap-1.5">
            <p className="text-[11px] font-semibold text-gray-800 truncate">
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
            <div className="group/sup relative mt-1.5 rounded-lg border border-indigo-200 bg-indigo-50/60 px-2.5 py-2 space-y-0.5">
              {/* Supervision ⋮ menu */}
              {onOpenSupervisionMenu && (
                <button
                  type="button"
                  onClick={handleSupervisionMenuClick}
                  className={cn(
                    "absolute right-1 top-1 z-10",
                    "p-0.5 rounded-md",
                    "opacity-100",
                    "transition-all duration-150",
                    "hover:bg-indigo-200/60",
                    "text-indigo-400 hover:text-indigo-700",
                  )}
                >
                  <MoreVertical className="h-3 w-3" />
                </button>
              )}
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-indigo-500 flex-shrink-0" />
                <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-800">
                  Supervision
                </p>
              </div>
              <p className="text-[10px] text-indigo-700">
                {formatTime(`2000-01-01T${sup!.timeInit}`)}
                {" - "}
                {formatTime(`2000-01-01T${sup!.timeEnd}`)}
                {sup!.units != null && (
                  <span className="text-indigo-500"> ({sup!.units} units)</span>
                )}
              </p>
              {(supSessionBC || supBillingBC) && (
                <p className="text-[10px] text-indigo-600">
                  {[supSessionBC, supBillingBC].filter(Boolean).join(" · ")}
                </p>
              )}
              {sup!.providerName && (
                <p className="text-[10px] text-indigo-500">
                  {sup!.providerName}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Bottom color bar */}
        <div
          className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-lg"
          style={{ backgroundColor: eventColor }}
        />
      </div>
    )
  }

  // ─── Grid layout ───────────────────────────────────────────────────
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
      {menuButton}

      {/* Card body */}
      <div className="h-full overflow-hidden px-2.5 pr-7 pt-5 pb-1.5 flex flex-col">
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
            <div className="group/sup relative mt-1 rounded-md border border-indigo-200 bg-indigo-50/60 px-1.5 py-1 space-y-px">
              {onOpenSupervisionMenu && (
                <button
                  type="button"
                  onClick={handleSupervisionMenuClick}
                  className={cn(
                    "absolute right-0.5 top-0.5 z-10",
                    "p-0.5 rounded",
                    "opacity-100",
                    "transition-all duration-150",
                    "hover:bg-indigo-200/60",
                    "text-indigo-400 hover:text-indigo-700",
                  )}
                >
                  <MoreVertical className="h-2.5 w-2.5" />
                </button>
              )}
              <div className="flex items-center gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                <p className="text-[9px] font-bold text-indigo-800">SUPERVISION</p>
              </div>
              <p className="text-[9px] text-indigo-600 truncate">
                {formatTime(`2000-01-01T${sup!.timeInit}`)}
                {" - "}
                {formatTime(`2000-01-01T${sup!.timeEnd}`)}
                {sup!.providerName && ` · ${sup!.providerName}`}
              </p>
              {(supSessionBC || supBillingBC) && (
                <p className="text-[9px] text-indigo-500 truncate">
                  {[supSessionBC, supBillingBC].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom color bar */}
      <div
        className="absolute bottom-0 left-0 right-0 h-0.5"
        style={{ backgroundColor: eventColor }}
      />
    </div>
  )
}
