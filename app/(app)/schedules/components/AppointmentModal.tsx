"use client"

import { useState } from "react"
import { format, parseISO } from "date-fns"
import { CustomModal } from "@/components/custom/CustomModal"
import { Button } from "@/components/custom/Button"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { FloatingTimePicker } from "@/components/custom/FloatingTimePicker"
import { PremiumDatePicker } from "@/components/custom/PremiumDatePicker"
import { PremiumSwitch } from "@/components/custom/PremiumSwitch"
import { SupervisionConfigModal } from "./SupervisionConfigModal"
import {
  Clock,
  Zap,
  CheckCircle,
  XCircle,
  UserX,
  Users,
  Pencil,
  ChevronRight,
} from "lucide-react"
import type { Appointment, AppointmentStatus, EventType } from "@/lib/types/appointment.types"
import { useAppointmentForm } from "../hooks/useAppointmentForm"
import { useAlert } from "@/lib/contexts/alert-context"
import { formatDuration } from "@/lib/utils/unit-calculation"
import { cn } from "@/lib/utils"

// ============================================
// Event type options
// ============================================

// Supervision is no longer a top-level event type — it is configured as a
// sub-event of Service Plan via the "Add Supervision" toggle below.
const EVENT_TYPES: Array<{ value: EventType; label: string }> = [
  { value: "session_note", label: "Session Note" },
  { value: "service_plan", label: "Service Plan" },
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
  onSaved?: () => void
}

export function AppointmentModal({
  open,
  onClose,
  appointment,
  defaultDate,
  defaultTime,
  rbtId,
  onStatusChange,
  onSaved,
}: AppointmentModalProps) {
  const alert = useAlert()
  const [showSupervisionModal, setShowSupervisionModal] = useState(false)

  const {
    formData,
    updateField,
    setSupervisionData,
    isSupervisionConfigured,
    errors,
    validationError,
    supervisionValidationError,
    isValidatingMain,
    clientOptions,
    clientsLoading,
    clientsError,
    addressOptions,
    addressesLoading,
    billingCodeOptions,
    mainBillingCodesLoading,
    mainBillingCodesError,
    supervisionCodeOptions,
    supervisionBillingCodesLoading,
    priorAuthorizationOptions,
    supervisionPriorAuthorizationOptions,
    isLoadingPriorAuthLabel,
    isValidatingSupervision,
    rbtOptions,
    rbtProvidersLoading,
    rbtProvidersError,
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
    onSuccess: onSaved ?? onClose,
  })

  const showStatusActions =
    isEditing &&
    appointment &&
    onStatusChange &&
    (appointment.status === "Scheduled" || appointment.status === "InProgress")

  const rbtLabel =
    rbtOptions.find((o) => o.value === formData.supervision.providerId)?.label ?? ""
  const supervisionBillingLabel =
    supervisionCodeOptions.find((o) => o.value === formData.supervision.billingCodeId)?.label ?? ""

  const supervisionSummary = isSupervisionConfigured
    ? [
        formData.supervision.title,
        rbtLabel,
        formData.supervision.date
          ? format(parseISO(formData.supervision.date), "MMM d")
          : "",
        formData.supervision.startTime && formData.supervision.endTime
          ? `${formData.supervision.startTime}–${formData.supervision.endTime}`
          : "",
        supervisionBillingLabel,
      ]
        .filter(Boolean)
        .join(" · ")
    : ""

  return (
    <>
    <CustomModal
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      title={isEditing ? "Edit Session" : "New Session"}
      description="Complete the details to schedule this session"
      maxWidthClassName="sm:max-w-[760px]"
      allowSelectOverflow
      contentClassName="!overflow-visible"
    >
      {/* Body */}
      <form onSubmit={handleSubmit} className="px-7 py-6 space-y-6">

        {/* Event Type — segmented control */}
        <Field>
          <FieldLabel>Event Type</FieldLabel>
          <div className="inline-flex w-full gap-1 rounded-2xl border border-slate-200/70 bg-slate-100/70 p-1">
            {EVENT_TYPES.map((et) => {
              const isSelected = formData.eventType === et.value
              return (
                <button
                  key={et.value}
                  type="button"
                  onClick={() => updateField("eventType", et.value)}
                  className={cn(
                    "flex-1 h-11 rounded-xl text-sm font-semibold transition-all duration-200",
                    isSelected
                      ? "bg-white text-[#037ECC] shadow-[0_2px_8px_rgba(3,126,204,0.18)] ring-1 ring-[#037ECC]/15"
                      : "text-slate-500 hover:text-slate-700",
                  )}
                >
                  {et.label}
                </button>
              )
            })}
          </div>
        </Field>

        {/* Client + Address — two columns on wide screens */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field>
            <FloatingSelect
              label="Client"
              value={formData.clientId}
              onChange={(v) => updateField("clientId", v)}
              options={clientOptions}
              hasError={!!errors.clientId}
              required
              searchable
              disabled={clientsLoading}
            />
            {clientsLoading && (
              <p className="mt-1.5 text-xs text-slate-400">Loading clients…</p>
            )}
            {clientsError && (
              <p className="mt-1.5 text-xs text-red-500">{clientsError.message}</p>
            )}
            <FieldError message={errors.clientId} />
          </Field>

          <Field>
            <FloatingSelect
              label="Address"
              value={formData.placeOfServiceAddressId}
              onChange={(v) => updateField("placeOfServiceAddressId", v)}
              options={addressOptions}
              hasError={!!errors.placeOfServiceAddressId}
              required
              disabled={
                addressesLoading ||
                (!formData.clientId && !formData.placeOfServiceAddressId)
              }
            />
            {!formData.clientId && !formData.placeOfServiceAddressId ? (
              <p className="mt-1.5 text-xs italic text-slate-400">Select a client first</p>
            ) : (
              <FieldError message={errors.placeOfServiceAddressId} />
            )}
          </Field>
        </div>

        {/* Date & Time */}
        <Field>
          <FieldLabel>Date &amp; Time</FieldLabel>
          <div className="space-y-3">
            <PremiumDatePicker
              label="Date"
              value={formData.date}
              onChange={(v) => updateField("date", v)}
              onClear={() => updateField("date", "")}
              hasError={!!errors.date}
              errorMessage={errors.date}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <FloatingTimePicker
                  label="Start Time"
                  value={formData.startTime}
                  onChange={(v) => updateField("startTime", v)}
                  hasError={!!errors.startTime || !!validationError}
                  required
                  allowManualInput
                />
                <FieldError message={errors.startTime} />
              </div>
              <div>
                <FloatingTimePicker
                  label="End Time"
                  value={formData.endTime}
                  onChange={(v) => updateField("endTime", v)}
                  hasError={!!errors.endTime || !!validationError}
                  required
                  allowManualInput
                />
                <FieldError message={errors.endTime} />
              </div>
            </div>

            <FieldError message={validationError || errors.timeRange} />

            {/* Duration & Units — read-only summary */}
            {durationMinutes > 0 && (
              <div className="flex flex-wrap items-center gap-4 rounded-xl border border-[#037ECC]/15 bg-gradient-to-br from-[#037ECC]/[0.06] to-[#079CFB]/[0.04] px-4 py-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#037ECC]" />
                  <span className="text-sm text-slate-600">
                    Duration:{" "}
                    <span className="font-semibold text-slate-900">
                      {formatDuration(durationMinutes)}
                    </span>
                  </span>
                </div>
                <div className="h-4 w-px bg-[#037ECC]/20" />
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-[#037ECC]" />
                  <span className="text-sm text-slate-600">
                    Units:{" "}
                    <span className="font-semibold text-[#037ECC]">
                      {isValidatingMain ? "…" : billableUnits}
                    </span>
                  </span>
                </div>
              </div>
            )}
          </div>
        </Field>

        {/* Billing Code */}
        <Field>
          <FloatingSelect
            label="Billing Code"
            value={formData.billingCodeId}
            onChange={(v) => updateField("billingCodeId", v)}
            options={billingCodeOptions}
            hasError={!!errors.billingCodeId}
            required
            searchable
            dropdownPosition="bottom"
            disabled={!formData.clientId || mainBillingCodesLoading}
          />
          {mainBillingCodesLoading && (
            <p className="mt-1.5 text-xs text-slate-400">Loading billing codes…</p>
          )}
          {mainBillingCodesError && (
            <p className="mt-1.5 text-xs text-red-500">{mainBillingCodesError.message}</p>
          )}
          <FieldError message={errors.billingCodeId} />
        </Field>

        {/* Prior Authorization — populated after validation */}
        <Field>
          <FloatingSelect
            label="Prior Authorization"
            value={formData.priorAuthorizationId}
            onChange={() => {}}
            options={priorAuthorizationOptions}
            disabled
            dropdownPosition="bottom"
          />
          {isValidatingMain && (
            <p className="mt-1.5 text-xs text-slate-400">Validating prior authorization…</p>
          )}
          {!isValidatingMain && !formData.priorAuthorizationId && !validationError && (
            <p className="mt-1.5 text-xs text-slate-400">
              Assigned automatically after billing code and time are validated
            </p>
          )}
        </Field>

        {/* Supervision — compact card + secondary modal */}
        {!isRbt && formData.eventType === "service_plan" && (
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 space-y-3">
            <PremiumSwitch
              label="Add Supervision"
              description="Schedule a supervision session alongside this Service Plan event"
              checked={formData.addSupervision}
              onCheckedChange={(v) => {
                updateField("addSupervision", v)
                if (v) setShowSupervisionModal(true)
              }}
            />

            {formData.addSupervision && (
              <div
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors",
                  isSupervisionConfigured
                    ? "border-[#037ECC]/20 bg-white"
                    : "border-amber-200/80 bg-amber-50/50",
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                    isSupervisionConfigured
                      ? "bg-[#037ECC]/10 text-[#037ECC]"
                      : "bg-amber-100 text-amber-700",
                  )}
                >
                  <Users className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">
                    {isSupervisionConfigured ? "Supervision configured" : "Supervision details needed"}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {isSupervisionConfigured
                      ? supervisionSummary
                      : "Set RBT, schedule, and billing code for the supervision session"}
                  </p>
                  {supervisionValidationError && (
                    <p className="mt-1 text-xs text-red-500">{supervisionValidationError}</p>
                  )}
                  <FieldError message={errors.supervisionConfig} />
                </div>

                <Button
                  type="button"
                  variant={isSupervisionConfigured ? "secondary" : "primary"}
                  className="h-9 shrink-0 gap-1.5 text-sm"
                  onClick={() => setShowSupervisionModal(true)}
                >
                  {isSupervisionConfigured ? (
                    <>
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </>
                  ) : (
                    <>
                      Configure
                      <ChevronRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </form>

      {/* Footer */}
      <div className="space-y-3 border-t border-slate-200/80 bg-white/70 px-7 py-4 rounded-b-2xl">
        {/* Status actions — only when editing an active appointment */}
        {showStatusActions && appointment && onStatusChange && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="primary"
              className="h-9 flex-1 gap-1.5 text-sm"
              onClick={() => {
                alert.confirm({
                  title: "Complete Appointment",
                  description:
                    "Mark this appointment as completed? The session note will be activated.",
                  confirmText: "Complete",
                  cancelText: "Go Back",
                  onConfirm: async () => {
                    onStatusChange(appointment.id, "Completed")
                    onClose()
                  },
                })
              }}
            >
              <CheckCircle className="h-4 w-4" />
              Complete
            </Button>
            <Button
              type="button"
              variant="danger"
              className="h-9 flex-1 gap-1.5 text-sm"
              onClick={() => {
                alert.confirm({
                  title: "Cancel Appointment",
                  description:
                    "Cancel this appointment? The session note will not be activated.",
                  confirmText: "Cancel Appointment",
                  cancelText: "Go Back",
                  onConfirm: async () => {
                    onStatusChange(appointment.id, "Cancelled")
                    onClose()
                  },
                })
              }}
            >
              <XCircle className="h-4 w-4" />
              Cancel Apt.
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="h-9 flex-1 gap-1.5 text-sm"
              onClick={() => {
                alert.confirm({
                  title: "Mark as No Show",
                  description:
                    "The client did not attend. A No Show note may be generated per company policy.",
                  confirmText: "Mark No Show",
                  cancelText: "Go Back",
                  onConfirm: async () => {
                    onStatusChange(appointment.id, "NoShow")
                    onClose()
                  },
                })
              }}
            >
              <UserX className="h-4 w-4" />
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
              className="h-10 min-w-[180px]"
              onClick={handleSubmit}
            >
              {isEditing ? "Update" : "Create"} Session
            </Button>
          </div>
        </div>
      </div>
    </CustomModal>

    <SupervisionConfigModal
      open={showSupervisionModal}
      onClose={() => setShowSupervisionModal(false)}
      onSave={setSupervisionData}
      initialData={formData.supervision}
      clientId={formData.clientId}
      mainDate={formData.date}
      mainStartTime={formData.startTime}
      mainEndTime={formData.endTime}
      rbtOptions={rbtOptions}
      rbtProvidersLoading={rbtProvidersLoading}
      rbtProvidersError={rbtProvidersError}
      supervisionCodeOptions={supervisionCodeOptions}
      supervisionBillingCodesLoading={supervisionBillingCodesLoading}
      priorAuthorizationOptions={supervisionPriorAuthorizationOptions}
      isValidatingPriorAuth={isValidatingSupervision}
    />
    </>
  )
}

// ============================================
// Layout helpers
// ============================================

function Field({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </label>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1.5 text-xs text-red-500">{message}</p>
}
