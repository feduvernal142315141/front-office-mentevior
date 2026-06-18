"use client"

import { format, parseISO } from "date-fns"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
  DrawerFooter,
} from "@/components/ui/drawer"
import { Button } from "@/components/custom/Button"
import {
  CalendarCheck,
  Clock,
  MapPin,
  FileText,
  Receipt,
  Users,
  CheckCircle,
  XCircle,
  UserX,
  Edit,
  Info,
} from "lucide-react"
import type { Appointment, AppointmentStatus } from "@/lib/types/appointment.types"
import { getEventTypeLabel } from "@/lib/modules/schedules/utils/appointment-api.mapper"
import { useAlert } from "@/lib/contexts/alert-context"
import { calculateDurationMinutes, calculateBillableUnits, formatDuration } from "@/lib/utils/unit-calculation"
import { cn } from "@/lib/utils"

// ============================================
// Status config
// ============================================

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; color: string; bg: string; border: string }> = {
  Scheduled: { label: "Scheduled", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
  InProgress: { label: "In Progress", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
  Completed: { label: "Completed", color: "text-green-700", bg: "bg-green-50", border: "border-green-200" },
  Cancelled: { label: "Cancelled", color: "text-red-700", bg: "bg-red-50", border: "border-red-200" },
  NoShow: { label: "No Show", color: "text-gray-700", bg: "bg-gray-50", border: "border-gray-200" },
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  session_note: "Session Note",
  service_plan: "Service Plan",
  supervision: "Supervision",
}

const NOTE_MESSAGES: Record<AppointmentStatus, string> = {
  Scheduled: "The session note will be enabled when this appointment ends.",
  InProgress: "The session note will be enabled when this appointment ends.",
  Completed: "Session note is active. The 48h editing window has started.",
  Cancelled: "This appointment was cancelled. No session note was generated.",
  NoShow: "Client did not attend. A No Show note may be generated per company policy.",
}

const NOTE_MESSAGE_STYLES: Record<AppointmentStatus, string> = {
  Scheduled: "bg-blue-50 border-blue-200 text-blue-800",
  InProgress: "bg-amber-50 border-amber-200 text-amber-800",
  Completed: "bg-green-50 border-green-200 text-green-800",
  Cancelled: "bg-red-50 border-red-200 text-red-800",
  NoShow: "bg-gray-50 border-gray-200 text-gray-700",
}

// ============================================
// Component
// ============================================

interface AppointmentDetailDrawerProps {
  open: boolean
  onClose: () => void
  appointment: Appointment | null
  onStatusChange: (appointmentId: string, status: AppointmentStatus) => void
  onEdit: (appointment: Appointment) => void
}

export function AppointmentDetailDrawer({
  open,
  onClose,
  appointment,
  onStatusChange,
  onEdit,
}: AppointmentDetailDrawerProps) {
  const alert = useAlert()

  if (!appointment) return null

  const eventLabel =
    appointment.billingCodeName ?? getEventTypeLabel(appointment.eventType)
  const status = STATUS_CONFIG[appointment.status]
  const startTime = parseISO(appointment.startsAt)
  const endTime = parseISO(appointment.endsAt)
  const durationMin = calculateDurationMinutes(
    format(startTime, "HH:mm"),
    format(endTime, "HH:mm")
  )
  const units = calculateBillableUnits(durationMin)
  const canChangeStatus = appointment.status === "Scheduled" || appointment.status === "InProgress"

  const handleComplete = () => {
    alert.confirm({
      title: "Complete Appointment",
      description: "Mark this appointment as completed? The session note will be activated.",
      confirmText: "Complete",
      cancelText: "Cancel",
      onConfirm: async () => {
        onStatusChange(appointment.id, "Completed")
      },
    })
  }

  const handleCancel = () => {
    alert.confirm({
      title: "Cancel Appointment",
      description: "Cancel this appointment? The session note will not be activated.",
      confirmText: "Cancel Appointment",
      cancelText: "Go Back",
      onConfirm: async () => {
        onStatusChange(appointment.id, "Cancelled")
      },
    })
  }

  const handleNoShow = () => {
    alert.confirm({
      title: "Mark as No Show",
      description: "The client did not attend this appointment. A No Show note may be generated per company policy.",
      confirmText: "Mark No Show",
      cancelText: "Go Back",
      onConfirm: async () => {
        onStatusChange(appointment.id, "NoShow")
      },
    })
  }

  const handleEdit = () => {
    onClose()
    onEdit(appointment)
  }

  return (
    <Drawer open={open} onOpenChange={onClose} direction="right">
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-[#037ECC]" />
            Appointment Details
          </DrawerTitle>
          <DrawerDescription>
            {format(startTime, "EEEE, MMMM d, yyyy")}
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody>
          <div className="space-y-6">

            {/* Status Badge */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-500">Status</span>
              <span className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border",
                status.bg, status.color, status.border,
              )}>
                {status.label}
              </span>
            </div>

            {/* Event Info */}
            <DetailSection icon={FileText} title="Event Info">
              <DetailRow label="Event Type" value={EVENT_TYPE_LABELS[appointment.eventType || ""] || "Session Note"} />
              <DetailRow label="Client" value={appointment.clientName || "Unknown"} />
              <DetailRow label="Event" value={eventLabel} />
              <DetailRow label="Location" value={appointment.location} />
            </DetailSection>

            {/* Schedule */}
            <DetailSection icon={Clock} title="Schedule">
              <DetailRow label="Date" value={format(startTime, "MMM d, yyyy")} />
              <DetailRow
                label="Time"
                value={`${format(startTime, "h:mm a")} — ${format(endTime, "h:mm a")}`}
              />
              <div className="flex items-center gap-4 mt-1">
                <span className="text-sm text-slate-600">
                  Duration: <span className="font-semibold text-slate-800">{formatDuration(durationMin)}</span>
                </span>
                <span className="text-sm text-slate-600">
                  Units: <span className="font-semibold text-[#037ECC]">{units}</span>
                </span>
              </div>
            </DetailSection>

            {/* Billing Codes */}
            {appointment.billingCodeIds && appointment.billingCodeIds.length > 0 && (
              <DetailSection icon={Receipt} title="Billing Codes">
                <div className="flex flex-wrap gap-2">
                  {appointment.billingCodeIds.map((codeId) => (
                    <span
                      key={codeId}
                      className="inline-flex px-2.5 py-1 rounded-lg bg-slate-100 text-xs font-medium text-slate-700 border border-slate-200"
                    >
                      {codeId}
                    </span>
                  ))}
                </div>
              </DetailSection>
            )}

            {/* Supervision */}
            {appointment.addSupervision && (
              <DetailSection icon={Users} title="Supervision">
                <DetailRow label="Supervised RBT" value={appointment.supervisionRbtId || "—"} />
              </DetailSection>
            )}

            {/* Notes */}
            <DetailSection icon={FileText} title="Notes">
              <p className="text-sm text-slate-600">
                {appointment.notes || "No notes added."}
              </p>
            </DetailSection>

            {/* Session Note Status Message */}
            <div className={cn(
              "flex items-start gap-3 p-4 rounded-xl border",
              NOTE_MESSAGE_STYLES[appointment.status],
            )}>
              <Info className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold mb-0.5">Session Note</p>
                <p className="text-sm">{NOTE_MESSAGES[appointment.status]}</p>
              </div>
            </div>
          </div>
        </DrawerBody>

        <DrawerFooter className="flex-col gap-3">
          {/* Status action buttons */}
          {canChangeStatus && (
            <div className="flex items-center gap-2 w-full">
              <Button
                variant="primary"
                onClick={handleComplete}
                className="flex-1 h-10 gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Complete
              </Button>
              <Button
                variant="danger"
                onClick={handleCancel}
                className="flex-1 h-10 gap-2"
              >
                <XCircle className="w-4 h-4" />
                Cancel
              </Button>
              <Button
                variant="secondary"
                onClick={handleNoShow}
                className="flex-1 h-10 gap-2"
              >
                <UserX className="w-4 h-4" />
                No Show
              </Button>
            </div>
          )}

          {/* Edit button */}
          {(canChangeStatus || appointment.status === "Completed") && (
            <Button
              variant="secondary"
              onClick={handleEdit}
              className="w-full h-10 gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit Appointment
            </Button>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

// ============================================
// Helpers
// ============================================

function DetailSection({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
        <Icon className="w-4 h-4 text-[#037ECC]" />
        {title}
      </h4>
      <div className="pl-6 space-y-1.5">{children}</div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate-500 min-w-[100px]">{label}</span>
      <span className="text-sm font-medium text-slate-800">{value}</span>
    </div>
  )
}
