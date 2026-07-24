"use client"

import { useRouter } from "next/navigation"
import { CustomModal } from "@/components/custom/CustomModal"
import { Button } from "@/components/custom/Button"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { FloatingTimePicker } from "@/components/custom/FloatingTimePicker"
import { PremiumDatePicker } from "@/components/custom/PremiumDatePicker"
import { PremiumSwitch } from "@/components/custom/PremiumSwitch"
import {
  Clock,
  Shield,
  ExternalLink,
  UserCog,
} from "lucide-react"
import type { Appointment, AppointmentStatus, EventType } from "@/lib/types/appointment.types"
import { useAppointmentForm } from "../hooks/useAppointmentForm"
import { formatDuration } from "@/lib/utils/unit-calculation"
import { cn } from "@/lib/utils"

const EVENT_TYPES: Array<{ value: EventType; label: string }> = [
  { value: "session_note", label: "Session" },
  { value: "service_plan", label: "Service Plan" },
]

interface AppointmentModalProps {
  open: boolean
  onClose: () => void
  appointment?: Appointment | null
  /** Parent appointment for "Add New Session" flow (from 97153/97152 context menu) */
  parentAppointment?: Appointment | null
  defaultDate?: string
  defaultTime?: string
  rbtId: string
  scope?: "provider" | "agency"
  onStatusChange?: (appointmentId: string, status: AppointmentStatus) => void
  onSaved?: () => void
}

export function AppointmentModal({
  open,
  onClose,
  appointment,
  parentAppointment,
  defaultDate,
  defaultTime,
  rbtId,
  scope = "provider",
  onStatusChange,
  onSaved,
}: AppointmentModalProps) {
  const router = useRouter()

  const {
    formData,
    updateField,
    updateSupervisionField,
    errors,
    validationError,
    isValidatingMain,
    pendingValidation,
    clientOptions,
    clientsLoading,
    clientsError,
    addressOptions,
    addressesLoading,
    billingCodeOptions,
    mainBillingCodesLoading,
    mainBillingCodesError,
    priorAuthorizationOptions,
    durationMinutes,
    supervisionCodeOptions,
    supervisionBillingCodesLoading,
    rbtOptions,
    rbtProvidersLoading,
    showSupervisionSwitch,
    isNewSessionMode,
    isRbt,
    isAdmin,
    isEditing,
    assignToOther,
    setAssignToOther,
    selectedProviderId,
    setSelectedProviderId,
    providerOptions,
    providerOptionsLoading,
    handleSubmit,
    isSubmitting,
    hasPriorAuthWithoutCodes,
    billableUnits,
  } = useAppointmentForm({
    open,
    appointment,
    parentAppointment,
    defaultDate,
    defaultTime,
    rbtId,
    scope,
    onSuccess: onSaved ?? onClose,
  })

  const isLockedStatus = isEditing && (
    appointment?.status === "Completed" ||
    appointment?.status === "Cancelled" ||
    appointment?.status === "NoShow"
  )

  return (
    <CustomModal
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      title={isEditing ? "Edit Session" : isNewSessionMode ? "New Session" : "New Session"}
      description={isNewSessionMode ? `New session for ${parentAppointment?.clientName ?? "client"}` : "Complete the details to schedule this session"}
      maxWidthClassName="sm:max-w-[760px]"
      allowSelectOverflow
      contentClassName="!overflow-visible"
    >
      {/* Body */}
      <form onSubmit={handleSubmit} className="px-7 py-6 space-y-5">

        {/* Event Type — segmented control (hidden in new session mode) */}
        {!isNewSessionMode && (
          <div>
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
          </div>
        )}

        {/* Client + Address */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FloatingSelect
              label="Client"
              value={formData.clientId}
              onChange={(v) => updateField("clientId", v)}
              options={clientOptions}
              hasError={!!errors.clientId}
              required
              searchable
              disabled={isNewSessionMode || clientsLoading}
            />
            {!isNewSessionMode && clientsLoading && <Hint>Loading clients…</Hint>}
            {!isNewSessionMode && clientsError && <HintError>{clientsError.message}</HintError>}
            <FieldError message={errors.clientId} />
          </div>

          <div>
            <FloatingSelect
              label="Address"
              value={formData.placeOfServiceAddressId}
              onChange={(v) => updateField("placeOfServiceAddressId", v)}
              options={addressOptions}
              hasError={!!errors.placeOfServiceAddressId}
              required
              disabled={isNewSessionMode || addressesLoading || (!formData.clientId && !formData.placeOfServiceAddressId)}
            />
            {!isNewSessionMode && !formData.clientId && !formData.placeOfServiceAddressId
              ? <Hint className="italic">Select a client first</Hint>
              : <FieldError message={errors.placeOfServiceAddressId} />
            }
          </div>
        </div>

        {/* ─── Assign to another provider (admin only) ─── */}
        {isAdmin && formData.clientId && (
          <div className="rounded-2xl border border-blue-200/60 bg-blue-50/30 p-4 space-y-4">
            <PremiumSwitch
              label="Assign to another provider"
              description="Create this session on behalf of another provider"
              checked={assignToOther}
              onCheckedChange={(v) => {
                setAssignToOther(v)
                if (!v) setSelectedProviderId("")
              }}
              disabled={isLockedStatus}
            />

            {assignToOther && (
              <div className="pt-1">
                {providerOptionsLoading && <Hint>Loading providers…</Hint>}

                {!providerOptionsLoading && providerOptions.length === 0 && formData.clientId && (
                  <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3">
                    <UserCog className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-amber-800">
                        No providers assigned to this client
                      </p>
                      <p className="mt-0.5 text-xs text-amber-600">
                        You need to assign providers to this client before you can create a session on their behalf.
                      </p>
                      <button
                        type="button"
                        className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-200"
                        onClick={() => router.push(`/clients/${formData.clientId}/configuration`)}
                      >
                        Go to Client Configuration
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}

                {!providerOptionsLoading && providerOptions.length > 0 && (
                  <>
                    <FloatingSelect
                      label="Provider"
                      value={selectedProviderId}
                      onChange={(v) => setSelectedProviderId(v)}
                      options={providerOptions}
                      hasError={!!errors.assignedProviderId}
                      required
                      searchable
                      disabled={!formData.clientId || isLockedStatus}
                    />
                    <FieldError message={errors.assignedProviderId} />
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Date + Billing Code — side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PremiumDatePicker
            label="Date"
            value={formData.date}
            onChange={(v) => updateField("date", v)}
            onClear={isNewSessionMode ? undefined : () => updateField("date", "")}
            hasError={!!errors.date}
            errorMessage={errors.date}
            required
            disabled={isNewSessionMode}
          />
          <div>
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
            {mainBillingCodesLoading && <Hint>Loading billing codes…</Hint>}
            {mainBillingCodesError && <HintError>{mainBillingCodesError.message}</HintError>}
            {hasPriorAuthWithoutCodes && (
              <Hint className="text-amber-600">
                No billing codes available. The provider may not have billing codes configured or is not associated with this client.
              </Hint>
            )}
            {!hasPriorAuthWithoutCodes && formData.clientId && !mainBillingCodesLoading && !mainBillingCodesError && billingCodeOptions.length === 0 && (
              <Hint className="text-amber-600">
                No billing codes available. Verify that the provider has billing codes configured and is associated with this client.
              </Hint>
            )}
            <FieldError message={errors.billingCodeId} />
          </div>
        </div>

        {/* Start Time + End Time — each 50% */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              defaultPeriod="PM"
            />
            <FieldError message={errors.endTime} />
          </div>
        </div>
        <FieldError message={validationError || errors.timeRange} />

        {/* Summary bar: Session Duration | Prior Authorization */}
        {durationMinutes > 0 && (
          <SummaryBar
            label="Session Duration"
            duration={formatDuration(durationMinutes)}
            units={billableUnits}
            priorAuth={
              priorAuthorizationOptions.length > 0
                ? priorAuthorizationOptions[0].label
                : isValidatingMain
                  ? "Validating…"
                  : undefined
            }
          />
        )}

        {/* ─── SUPERVISION (inline, only for 97155 codes) ─── */}
        {showSupervisionSwitch && (
          <div className="rounded-2xl border border-indigo-200/60 bg-indigo-50/30 p-4 space-y-4">
            <PremiumSwitch
              label="Add Supervision"
              checked={formData.addSupervision}
              onCheckedChange={(v) => updateField("addSupervision", v)}
            />

            {formData.addSupervision && (
              <div className="space-y-4 pt-1">
                {/* Provider + Supervision Billing Code */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <FloatingSelect
                      label="Provider (Supervisee)"
                      value={formData.supervision.providerId}
                      onChange={(v) => updateSupervisionField("providerId", v)}
                      options={rbtOptions}
                      hasError={!!errors.supervisionRbtId}
                      required
                      searchable
                      disabled={!formData.clientId || rbtProvidersLoading}
                    />
                    <FieldError message={errors.supervisionRbtId} />
                  </div>
                  <div>
                    <FloatingSelect
                      label="Supervision Billing Code"
                      value={formData.supervision.billingCodeId}
                      onChange={(v) => updateSupervisionField("billingCodeId", v)}
                      options={supervisionCodeOptions}
                      searchable
                      dropdownPosition="bottom"
                      disabled={supervisionBillingCodesLoading}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </form>

      {/* Footer */}
      <div className="border-t border-slate-200/80 bg-white/70 px-7 py-4 rounded-b-2xl space-y-2">
        {isLockedStatus && (
          <p className="text-xs font-medium text-amber-600 text-right">
            This appointment cannot be edited because it is {appointment?.status === "NoShow" ? "No Show" : appointment?.status}.
          </p>
        )}
        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose} className="h-10">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            disabled={isLockedStatus || isValidatingMain || pendingValidation || !!validationError}
            className="h-10 min-w-[180px]"
            onClick={handleSubmit}
          >
            {isEditing ? "Update" : "Create"} Session
          </Button>
        </div>
      </div>
    </CustomModal>
  )
}

// ============================================
// Shared sub-components
// ============================================

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

function Hint({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("mt-1.5 text-xs text-slate-400", className)}>{children}</p>
}

function HintError({ children }: { children: React.ReactNode }) {
  return <p className="mt-1.5 text-xs text-red-500">{children}</p>
}

function SummaryBar({
  label,
  duration,
  units,
  priorAuth,
  variant = "blue",
}: {
  label: string
  duration: string
  units?: number | null
  priorAuth?: string
  variant?: "blue" | "indigo"
}) {
  const colors = variant === "indigo"
    ? { border: "border-indigo-200/40", bg: "from-indigo-500/[0.06] to-indigo-400/[0.04]", accent: "text-indigo-600", divider: "bg-indigo-300/30", label: "text-indigo-500" }
    : { border: "border-[#037ECC]/15", bg: "from-[#037ECC]/[0.06] to-[#079CFB]/[0.04]", accent: "text-[#037ECC]", divider: "bg-[#037ECC]/20", label: "text-[#037ECC]/70" }

  return (
    <div className={cn("flex flex-wrap items-center gap-4 rounded-xl border px-4 py-2.5", colors.border, `bg-gradient-to-br ${colors.bg}`)}>
      <span className={cn("text-[10px] font-semibold uppercase tracking-wider", colors.label)}>{label}</span>
      <div className={cn("h-3.5 w-px", colors.divider)} />
      <div className="flex items-center gap-1.5">
        <Clock className={cn("h-3.5 w-3.5", colors.accent)} />
        <span className="text-xs font-semibold text-slate-800">{duration}</span>
      </div>
      {units != null && (
        <>
          <div className={cn("h-3.5 w-px", colors.divider)} />
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-800">{units} units</span>
          </div>
        </>
      )}
      {priorAuth && (
        <>
          <div className={cn("h-3.5 w-px", colors.divider)} />
          <div className="flex items-center gap-1.5">
            <Shield className={cn("h-3.5 w-3.5", colors.accent)} />
            <span className="text-xs text-slate-600 truncate max-w-[200px]">
              {priorAuth}
            </span>
          </div>
        </>
      )}
    </div>
  )
}
