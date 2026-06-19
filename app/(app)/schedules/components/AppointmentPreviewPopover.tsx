"use client"

import { useRouter } from "next/navigation"
import {
  ClipboardList,
  FileText,
  MapPin,
  Pencil,
  User,
} from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/custom/Button"
import type { Appointment } from "@/lib/types/appointment.types"
import {
  buildDataCollectionUrl,
  buildSessionNoteUrl,
  type CalendarViewMode,
  formatAppointmentDateLine,
  formatAppointmentUnits,
  getAppointmentBillingCodeLabel,
  getCalendarEventTypeLabel,
  getEventColor,
} from "@/lib/modules/schedules/utils/schedule-display"
import { cn } from "@/lib/utils"
import type { EventType } from "@/lib/types/appointment.types"

interface AppointmentPreviewPopoverProps {
  appointment: Appointment
  viewMode?: CalendarViewMode
  eventColors?: Partial<Record<EventType, string>>
  onEdit: (appointment: Appointment) => void
  children: React.ReactNode
}

export function AppointmentPreviewPopover({
  appointment,
  viewMode = "client",
  eventColors,
  onEdit,
  children,
}: AppointmentPreviewPopoverProps) {
  const router = useRouter()
  const eventType = appointment.eventType ?? "session_note"
  const eventColor = getEventColor(eventType, eventColors)
  const eventLabel = getCalendarEventTypeLabel(eventType)
  const billingCode = getAppointmentBillingCodeLabel(appointment)
  const units = formatAppointmentUnits(appointment)
  const locationLabel = appointment.addressLabel?.trim() || appointment.location
  const isGeneralView = viewMode === "general"

  const handleSessionNote = () => {
    router.push(buildSessionNoteUrl(appointment))
  }

  const handleDataCollection = () => {
    router.push(buildDataCollectionUrl(appointment))
  }

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align="center"
        side="top"
        sideOffset={8}
        className="z-[100] w-[min(440px,calc(100vw-2rem))] p-0 overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 shadow-2xl data-[state=open]:opacity-100"
      >
        <div
          className="bg-white px-4 py-3 border-b border-slate-100"
          style={{ borderLeft: `4px solid ${eventColor}` }}
        >
          <p className="text-xs font-bold uppercase tracking-wide text-slate-700">
            {eventLabel}
            {appointment.status ? ` (${appointment.status})` : ""}
          </p>
          <p className="mt-1 text-sm font-medium text-slate-900">
            {formatAppointmentDateLine(appointment)}
          </p>
          {units != null && (
            <p className="mt-1 text-xs text-slate-500">
              {units} Units · {billingCode}
            </p>
          )}
        </div>

        <div className="bg-white px-4 py-3 space-y-2 text-sm text-slate-700">
          <PreviewRow label="Billing Code" value={billingCode} />
          {isGeneralView && appointment.providerName && (
            <PreviewRow icon={User} label="Provider" value={appointment.providerName} />
          )}
          {isGeneralView && appointment.clientName && (
            <PreviewRow icon={User} label="Client" value={appointment.clientName} />
          )}
          <PreviewRow icon={MapPin} label="Location" value={locationLabel} />
        </div>

        <div className="flex gap-2 bg-slate-50 px-4 py-3 border-t border-slate-100">
          <Button
            type="button"
            variant="secondary"
            className="h-9 flex-1 min-w-0 text-xs whitespace-nowrap px-2"
            onClick={() => onEdit(appointment)}
          >
            <Pencil className="h-3.5 w-3.5 mr-1 shrink-0" />
            Edit
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="h-9 flex-1 min-w-0 text-xs whitespace-nowrap px-2"
            onClick={handleSessionNote}
          >
            <FileText className="h-3.5 w-3.5 mr-1 shrink-0" />
            Session Note
          </Button>
          <Button
            type="button"
            variant="primary"
            className="h-9 flex-1 min-w-0 text-xs whitespace-nowrap px-2"
            onClick={handleDataCollection}
          >
            <ClipboardList className="h-3.5 w-3.5 mr-1 shrink-0" />
            Data Collection
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function PreviewRow({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="flex items-start gap-2">
      {Icon && <Icon className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />}
      <div className="min-w-0">
        <span className="text-xs text-slate-500">{label}</span>
        <p className={cn("font-medium text-slate-800 truncate")}>{value}</p>
      </div>
    </div>
  )
}
