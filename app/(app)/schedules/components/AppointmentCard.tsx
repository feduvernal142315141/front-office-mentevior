"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"
import type { Appointment, AppointmentStatus, EventType } from "@/lib/types/appointment.types"
import {
  type CalendarViewMode,
  formatAppointmentTimeRange,
  getAppointmentBillingCodeLabel,
  getCalendarEventTypeLabel,
  getEventColor,
} from "@/lib/modules/schedules/utils/schedule-display"
import { cn } from "@/lib/utils"

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  Scheduled: "bg-blue-50 text-blue-700 border-blue-200",
  InProgress: "bg-amber-50 text-amber-700 border-amber-200",
  Completed: "bg-green-50 text-green-700 border-green-200",
  Cancelled: "bg-red-50 text-red-700 border-red-200",
  NoShow: "bg-gray-50 text-gray-700 border-gray-200",
}

interface AppointmentCardProps {
  appointment: Appointment
  viewMode?: CalendarViewMode
  eventColors?: Partial<Record<EventType, string>>
  onClick?: () => void
  isDragOverlay?: boolean
}

export function AppointmentCard({
  appointment,
  viewMode = "client",
  eventColors,
  onClick,
  isDragOverlay = false,
}: AppointmentCardProps) {
  const eventType = appointment.eventType ?? "session_note"
  const eventColor = getEventColor(eventType, eventColors)
  const eventLabel = getCalendarEventTypeLabel(eventType)
  const billingCode = getAppointmentBillingCodeLabel(appointment)
  const locationLabel = appointment.addressLabel?.trim() || appointment.location
  const showPeople = viewMode === "general"

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
      className={cn(
        "group relative h-full w-full",
        "bg-white rounded-lg",
        "border-l-[3px] border border-gray-100",
        "shadow-[0_1px_3px_rgba(0,0,0,0.08)]",
        "transition-all duration-200",
        "cursor-pointer overflow-hidden",
        "border-l-[var(--service-color)]",
        "hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]",
        "hover:border-gray-200",
        isDragging && "opacity-50 shadow-2xl scale-105 z-50",
        isDragOverlay && "shadow-2xl scale-105",
        appointment.status === "Cancelled" && "opacity-60",
      )}
      onClick={onClick}
    >
      <div
        {...attributes}
        {...listeners}
        className={cn(
          "absolute left-1 top-1",
          "opacity-0 group-hover:opacity-100",
          "cursor-grab active:cursor-grabbing",
          "transition-opacity duration-200",
          "p-1 rounded hover:bg-gray-100",
        )}
      >
        <GripVertical className="h-3 w-3 text-gray-400" />
      </div>

      <div className="p-2 pl-4 space-y-0.5">
        <div className="flex items-start justify-between gap-1">
          <p className="text-[10px] font-medium text-gray-700 truncate flex-1">
            {formatAppointmentTimeRange(appointment)}
          </p>
          <span
            className={cn(
              "text-[9px] px-1.5 py-0.5 rounded-full border flex-shrink-0",
              "font-medium whitespace-nowrap",
              STATUS_STYLES[appointment.status],
            )}
          >
            {appointment.status}
          </span>
        </div>

        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-900 truncate">
          {eventLabel}
        </p>

        <p className="text-[10px] text-gray-600 truncate">
          {billingCode} | {locationLabel}
        </p>

        {showPeople && (
          <p className="text-[10px] text-gray-500 truncate">
            {[appointment.providerName, appointment.clientName].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-0.5"
        style={{ backgroundColor: eventColor }}
      />
    </div>
  )
}
