"use client"

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { VisuallyHidden } from "@/components/ui/visually-hidden"
import { Button } from "@/components/custom/Button"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { FloatingTimePicker } from "@/components/custom/FloatingTimePicker"
import { PremiumDatePicker } from "@/components/custom/PremiumDatePicker"
import { MultiSelect } from "@/components/custom/MultiSelect"
import {
  User,
  Calendar as CalendarIcon,
  FileText,
  MapPin,
  Receipt,
  Users,
  ShieldCheck,
  Clock,
  CheckCircle,
  XCircle,
  UserX,
} from "lucide-react"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import type { Appointment, AppointmentStatus, EventType } from "@/lib/types/appointment.types"
import { useAppointmentForm } from "../hooks/useAppointmentForm"
import { useAlert } from "@/lib/contexts/alert-context"
import { formatDuration } from "@/lib/utils/unit-calculation"
import { cn } from "@/lib/utils"

// ============================================
// Event type pill options
// ============================================

const EVENT_TYPES: Array<{ value: EventType; label: string }> = [
  { value: "session_note", label: "Session Note" },
  { value: "service_plan", label: "Service Plan" },
  { value: "supervision", label: "Supervision" },
]

// ============================================
// Component
// ============================================

interface AppointmentModalProps {
  open: boolean
  onClose: () => void
  appointment?: Appointment | null
  defaultDate?: string
  defaultTime?: string
  rbtId: string
  onStatusChange?: (appointmentId: string, status: AppointmentStatus) => void
}

export function AppointmentModal({
  open,
  onClose,
  appointment,
  defaultDate,
  defaultTime,
  rbtId,
  onStatusChange,
}: AppointmentModalProps) {
  const alert = useAlert()
  const {
    formData,
    updateField,
    errors,
    clientOptions,
    addressOptions,
    addressesLoading,
    billingCodeOptions,
    supervisionCodeOptions,
    rbtOptions,
    durationMinutes,
    billableUnits,
    isRbt,
    isEditing,
    handleSubmit,
    handleDelete,
    isSubmitting,
  } = useAppointmentForm({
    appointment,
    defaultDate,
    defaultTime,
    rbtId,
    onSuccess: onClose,
  })

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          "sm:max-w-[720px] p-0 gap-0",
          "bg-white rounded-2xl overflow-hidden",
          "border border-gray-100",
          "shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]",
        )}
        showCloseButton={true}
      >
        <VisuallyHidden>
          <DialogTitle>
            {isEditing ? "Edit Appointment" : "New Appointment"}
          </DialogTitle>
        </VisuallyHidden>

        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-b from-gray-50/50 to-transparent">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? "Edit Appointment" : "New Appointment"}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Complete the details to schedule this session
          </p>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">

          {/* ── Section 1: Event Type ─────────────────── */}
          <div className="space-y-2">
            <SectionHeader icon={FileText} label="Event Type" />
            <div className="flex gap-2">
              {EVENT_TYPES.map((et) => {
                const isSelected = formData.eventType === et.value
                return (
                  <button
                    key={et.value}
                    type="button"
                    className={cn(
                      "flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200",
                      isSelected
                        ? "bg-[#037ECC]/10 border-[#037ECC] text-[#037ECC]"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50",
                    )}
                    onClick={() => updateField("eventType", et.value)}
                  >
                    {et.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Section 2: Client ─────────────────────── */}
          <div className="space-y-2">
            <SectionHeader icon={User} label="Client" />
            <FloatingSelect
              label="Client"
              value={formData.clientId}
              onChange={(v) => updateField("clientId", v)}
              options={clientOptions}
              hasError={!!errors.clientId}
              required
              searchable
            />
            {errors.clientId && (
              <p className="text-xs text-red-500 mt-1">{errors.clientId}</p>
            )}
          </div>

          {/* ── Section 3: Place of Service ───────────── */}
          <div className="space-y-2">
            <SectionHeader icon={MapPin} label="Place of Service" />
            <FloatingSelect
              label="Place of Service"
              value={formData.placeOfServiceAddressId}
              onChange={(v) => updateField("placeOfServiceAddressId", v)}
              options={addressOptions}
              hasError={!!errors.placeOfServiceAddressId}
              required
              disabled={!formData.clientId || addressesLoading}
            />
            {!formData.clientId && (
              <p className="text-xs text-gray-400 italic">Select a client first</p>
            )}
            {errors.placeOfServiceAddressId && (
              <p className="text-xs text-red-500 mt-1">{errors.placeOfServiceAddressId}</p>
            )}
          </div>

          {/* ── Section 4: Date & Time ────────────────── */}
          <div className="space-y-3">
            <SectionHeader icon={CalendarIcon} label="Date & Time" />

            <PremiumDatePicker
              label="Date"
              value={formData.date}
              onChange={(v) => updateField("date", v)}
              onClear={() => updateField("date", "")}
              hasError={!!errors.date}
              errorMessage={errors.date}
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <FloatingTimePicker
                  label="Start Time"
                  value={formData.startTime}
                  onChange={(v) => updateField("startTime", v)}
                  hasError={!!errors.startTime}
                  required
                  allowManualInput
                />
                {errors.startTime && (
                  <p className="text-xs text-red-500 mt-1">{errors.startTime}</p>
                )}
              </div>
              <div>
                <FloatingTimePicker
                  label="End Time"
                  value={formData.endTime}
                  onChange={(v) => updateField("endTime", v)}
                  hasError={!!errors.endTime}
                  required
                  allowManualInput
                />
                {errors.endTime && (
                  <p className="text-xs text-red-500 mt-1">{errors.endTime}</p>
                )}
              </div>
            </div>

            {/* Duration & Units — read-only display */}
            {durationMinutes > 0 && (
              <div className="flex items-center gap-4 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-600">
                    Duration: <span className="font-semibold text-slate-800">{formatDuration(durationMinutes)}</span>
                  </span>
                </div>
                <div className="w-px h-4 bg-slate-300" />
                <span className="text-sm text-slate-600">
                  Units: <span className="font-semibold text-[#037ECC]">{billableUnits}</span>
                </span>
              </div>
            )}
          </div>

          {/* ── Section 5: Billing Codes ──────────────── */}
          <div className="space-y-2">
            <SectionHeader icon={Receipt} label="Billing Codes" />
            <MultiSelect
              label="Billing Codes"
              value={formData.billingCodeIds}
              onChange={(v) => updateField("billingCodeIds", v)}
              options={billingCodeOptions}
              hasError={!!errors.billingCodeIds}
              required
              disabled={!formData.clientId}
            />
            {errors.billingCodeIds && (
              <p className="text-xs text-red-500 mt-1">{errors.billingCodeIds}</p>
            )}
          </div>

          {/* ── Section 6: Supervision (non-RBT only) ── */}
          {!isRbt && (
            <div className="space-y-3">
              <SectionHeader icon={Users} label="Supervision" />

              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <span className="text-sm font-medium text-slate-700">Add Supervision</span>
                <SwitchPrimitives.Root
                  checked={formData.addSupervision}
                  onCheckedChange={(v) => updateField("addSupervision", v)}
                  className={cn(
                    "inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors shadow-sm",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                    formData.addSupervision ? "bg-[#037ECC]" : "bg-gray-200",
                  )}
                >
                  <SwitchPrimitives.Thumb className="pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0" />
                </SwitchPrimitives.Root>
              </label>

              {formData.addSupervision && (
                <div className="space-y-3 pl-1 border-l-2 border-[#037ECC]/20 ml-1">
                  <div className="pl-3">
                    <FloatingSelect
                      label="RBT (Provider being supervised)"
                      value={formData.supervisionRbtId}
                      onChange={(v) => updateField("supervisionRbtId", v)}
                      options={rbtOptions}
                      hasError={!!errors.supervisionRbtId}
                      required
                      searchable
                    />
                    {errors.supervisionRbtId && (
                      <p className="text-xs text-red-500 mt-1">{errors.supervisionRbtId}</p>
                    )}
                  </div>
                  <div className="pl-3">
                    <MultiSelect
                      label="Supervision Billing Codes"
                      value={formData.supervisionBillingCodeIds}
                      onChange={(v) => updateField("supervisionBillingCodeIds", v)}
                      options={supervisionCodeOptions}
                      hasError={!!errors.supervisionBillingCodeIds}
                      required
                    />
                    {errors.supervisionBillingCodeIds && (
                      <p className="text-xs text-red-500 mt-1">{errors.supervisionBillingCodeIds}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Section 7: Caregiver Signature ────────── */}
          <div className="space-y-2">
            <SectionHeader icon={ShieldCheck} label="Caregiver Signature" />
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <div>
                <span className="text-sm font-medium text-slate-700">Capture signature</span>
                <p className="text-xs text-slate-400">Only available within 48h after appointment ends</p>
              </div>
              <SwitchPrimitives.Root
                checked={formData.requiresCaregiverSignature}
                onCheckedChange={(v) => updateField("requiresCaregiverSignature", v)}
                className={cn(
                  "inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors shadow-sm",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                  formData.requiresCaregiverSignature ? "bg-[#037ECC]" : "bg-gray-200",
                )}
              >
                <SwitchPrimitives.Thumb className="pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0" />
              </SwitchPrimitives.Root>
            </label>
          </div>

          {/* ── Section 8: Notes ──────────────────────── */}
          <div className="space-y-2">
            <SectionHeader icon={FileText} label="Notes" optional />
            <textarea
              placeholder="Add any relevant notes about this session..."
              className={cn(
                "w-full min-h-[80px] px-4 py-3 rounded-xl",
                "border border-gray-200 bg-white",
                "text-sm text-gray-900 placeholder:text-gray-400",
                "focus:outline-none focus:ring-2 focus:ring-[#037ECC]/20 focus:border-[#037ECC]",
                "resize-none",
              )}
              value={formData.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              rows={3}
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 space-y-3">
          {/* Status actions — only when editing an active appointment */}
          {isEditing && appointment && onStatusChange &&
            (appointment.status === "Scheduled" || appointment.status === "InProgress") && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="primary"
                className="flex-1 h-9 gap-1.5 text-sm"
                onClick={() => {
                  alert.confirm({
                    title: "Complete Appointment",
                    description: "Mark this appointment as completed? The session note will be activated.",
                    confirmText: "Complete",
                    cancelText: "Go Back",
                    onConfirm: async () => {
                      onStatusChange(appointment.id, "Completed")
                      onClose()
                    },
                  })
                }}
              >
                <CheckCircle className="w-4 h-4" />
                Complete
              </Button>
              <Button
                type="button"
                variant="danger"
                className="flex-1 h-9 gap-1.5 text-sm"
                onClick={() => {
                  alert.confirm({
                    title: "Cancel Appointment",
                    description: "Cancel this appointment? The session note will not be activated.",
                    confirmText: "Cancel Appointment",
                    cancelText: "Go Back",
                    onConfirm: async () => {
                      onStatusChange(appointment.id, "Cancelled")
                      onClose()
                    },
                  })
                }}
              >
                <XCircle className="w-4 h-4" />
                Cancel Apt.
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="flex-1 h-9 gap-1.5 text-sm"
                onClick={() => {
                  alert.confirm({
                    title: "Mark as No Show",
                    description: "The client did not attend. A No Show note may be generated per company policy.",
                    confirmText: "Mark No Show",
                    cancelText: "Go Back",
                    onConfirm: async () => {
                      onStatusChange(appointment.id, "NoShow")
                      onClose()
                    },
                  })
                }}
              >
                <UserX className="w-4 h-4" />
                No Show
              </Button>
            </div>
          )}

          {/* Main actions */}
          <div className="flex items-center justify-between">
            {isEditing ? (
              <Button type="button" variant="danger" onClick={handleDelete} className="h-10">
                Delete
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={onClose} className="h-10">
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={isSubmitting}
                className="h-10"
                onClick={handleSubmit}
              >
                {isEditing ? "Update" : "Create"} Appointment
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ============================================
// Section header helper
// ============================================

function SectionHeader({
  icon: Icon,
  label,
  optional,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  optional?: boolean
}) {
  return (
    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
      <Icon className="w-4 h-4 text-[#037ECC]" />
      {label}
      {optional && <span className="text-xs font-normal text-gray-400">(optional)</span>}
    </h3>
  )
}
