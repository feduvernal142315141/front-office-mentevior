"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { CustomModal } from "@/components/custom/CustomModal"
import { Button } from "@/components/custom/Button"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { FloatingTimePicker } from "@/components/custom/FloatingTimePicker"
import { PremiumDatePicker } from "@/components/custom/PremiumDatePicker"
import { Clock, Zap } from "lucide-react"
import type { Appointment } from "@/lib/types/appointment.types"
import {
  calculateBillableUnits,
  calculateDurationMinutes,
  formatDuration,
} from "@/lib/utils/unit-calculation"
import {
  toApiTime,
  toValidateTime,
} from "@/lib/modules/schedules/utils/appointment-api.mapper"
import { validateAppointmentEventData } from "@/lib/modules/schedules/services/appointment-validate.service"
import { usePriorAuthorizationLabel } from "@/lib/modules/schedules/hooks/use-prior-authorization-label"
import { useApprovedBillingCodes } from "@/lib/modules/schedules/hooks/use-approved-billing-codes"
import { useBillingCodes } from "@/lib/modules/billing-codes/hooks/use-billing-codes"
import { useProvidersByClient } from "@/lib/modules/providers/hooks/use-providers-by-client"
import {
  createSubEvent,
  updateSubEvent,
} from "@/lib/modules/schedules/services/appointment-sub-event.service"
import { useAlert } from "@/lib/contexts/alert-context"
import { canHaveInlineSupervision } from "@/lib/modules/schedules/utils/billing-code-supervision-rules"
import { getAppointmentBillingCodeLabel } from "@/lib/modules/schedules/utils/schedule-display"

// ============================================
// Types
// ============================================

interface SupervisionFormData {
  providerId: string
  /** Session billing code → POST billingCodeId */
  sessionBillingCodeId: string
  /** Supervision billing code → POST supervisionBillingCodeId */
  supervisionBillingCodeId: string
  date: string
  startTime: string
  endTime: string
  priorAuthorizationId: string
  approvedPriorAuthorizationBillingCodeId: string
  validatedUnits: number | null
}

function createEmptyForm(): SupervisionFormData {
  return {
    providerId: "",
    sessionBillingCodeId: "",
    supervisionBillingCodeId: "",
    date: "",
    startTime: "",
    endTime: "",
    priorAuthorizationId: "",
    approvedPriorAuthorizationBillingCodeId: "",
    validatedUnits: null,
  }
}

/** Convert HH:mm:ss → HH:mm */
function toFormTime(value?: string): string {
  if (!value) return ""
  return value.length >= 5 ? value.slice(0, 5) : value
}

// ============================================
// Component
// ============================================

interface SupervisionConfigModalProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  /** Parent appointment — used to auto-populate defaults and determine create vs edit */
  appointment: Appointment | null
}

export function SupervisionConfigModal({
  open,
  onClose,
  onSaved,
  appointment,
}: SupervisionConfigModalProps) {
  const alert = useAlert()
  const isEditing = !!appointment?.supervision
  const clientId = appointment?.clientId ?? ""
  // If the parent appointment already has a billing code, auto-use it and hide the session BC select
  const parentHasBillingCode = !!appointment?.billingCodeId
  // Parent is 97155 → true supervision; parent is 97153/97152 → session/supervision
  const parentBillingCodeLabel = appointment ? getAppointmentBillingCodeLabel(appointment) : ""
  const isSessionSupervision = parentHasBillingCode && !canHaveInlineSupervision(parentBillingCodeLabel)

  // ─── Data fetching ───

  // Session billing codes (for billingCodeId in POST) — from prior authorization
  const {
    billingCodes: sessionBillingCodes,
    priorAuthorization: sessionPriorAuth,
    isLoading: sessionBillingCodesLoading,
  } = useApprovedBillingCodes(open && clientId ? clientId : null, "Session")

  // Supervision billing codes (for supervisionBillingCodeId in POST)
  // Same endpoint as supervision config: /billing-code?page=0&pageSize=0&filters=type__EQ__Supervision__AND
  const {
    billingCodes: supervisionBillingCodesRaw,
    isLoading: supervisionBillingCodesLoading,
  } = useBillingCodes({ page: 0, pageSize: 0, filters: ["type__EQ__Supervision__AND"] })

  const {
    providers: clientProviders,
    isLoading: rbtProvidersLoading,
    error: rbtProvidersError,
  } = useProvidersByClient(open && clientId ? clientId : null)

  const rbtOptions = useMemo(
    () =>
      clientProviders
        .filter((p) => p.active && !p.terminated && p.userId)
        .map((p) => ({ value: p.userId, label: p.fullName })),
    [clientProviders],
  )

  const sessionCodeOptions = useMemo(
    () => sessionBillingCodes.map((bc) => ({ value: bc.id, label: bc.label })),
    [sessionBillingCodes],
  )

  const supervisionCodeOptions = useMemo(
    () =>
      supervisionBillingCodesRaw.map((bc) => ({
        value: bc.id,
        label: [bc.type, bc.code, bc.modifier ? `(${bc.modifier})` : ""]
          .filter(Boolean)
          .join(" "),
      })),
    [supervisionBillingCodesRaw],
  )

  // ─── Form state ───
  const [localData, setLocalData] = useState<SupervisionFormData>(createEmptyForm())
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const validateKey = useRef("")

  const { label: localPriorAuthLabel, isLoading: isLoadingPriorAuthLabel } =
    usePriorAuthorizationLabel(localData.priorAuthorizationId, clientId)

  // ─── Initialize form when modal opens ───
  useEffect(() => {
    if (!open || !appointment) return

    if (isEditing && appointment.supervision) {
      const sup = appointment.supervision
      const data: SupervisionFormData = {
        providerId: sup.providerId ?? "",
        sessionBillingCodeId: parentHasBillingCode
          ? appointment.billingCodeId ?? ""
          : sup.billingCodeId ?? "",
        supervisionBillingCodeId: sup.supervisionBillingCodeId ?? "",
        date: sup.date ?? appointment.date ?? "",
        startTime: toFormTime(sup.timeInit),
        endTime: toFormTime(sup.timeEnd),
        priorAuthorizationId: sup.priorAuthorizationId ?? "",
        approvedPriorAuthorizationBillingCodeId: "",
        validatedUnits: sup.units ?? null,
      }
      setLocalData(data)
      if (data.validatedUnits != null && clientId) {
        validateKey.current = buildKey(clientId, data)
      } else {
        validateKey.current = ""
      }
    } else {
      // Auto-populate from parent appointment
      setLocalData({
        ...createEmptyForm(),
        sessionBillingCodeId: appointment.billingCodeId ?? "",
        providerId: appointment.rbtId ?? "",
        date: appointment.date ?? "",
        startTime: toFormTime(appointment.timeInit) || "",
        endTime: toFormTime(appointment.timeEnd) || "",
      })
      validateKey.current = ""
    }

    setErrors({})
    setValidationError(null)
  }, [open, appointment, isEditing, clientId])

  // ─── Auto-select single session billing code ───
  useEffect(() => {
    if (!open || sessionBillingCodesLoading) return
    if (sessionCodeOptions.length === 1) {
      setLocalData((prev) => {
        if (prev.sessionBillingCodeId) return prev
        return { ...prev, sessionBillingCodeId: sessionCodeOptions[0].value }
      })
    }
  }, [open, sessionCodeOptions, sessionBillingCodesLoading])

  // ─── Auto-select single supervision billing code ───
  useEffect(() => {
    if (!open || supervisionBillingCodesLoading) return
    if (supervisionCodeOptions.length === 1) {
      setLocalData((prev) => {
        if (prev.supervisionBillingCodeId) return prev
        return { ...prev, supervisionBillingCodeId: supervisionCodeOptions[0].value }
      })
    }
  }, [open, supervisionCodeOptions, supervisionBillingCodesLoading])

  // ─── Auto-select single RBT provider ───
  useEffect(() => {
    if (!open || rbtProvidersLoading) return
    if (rbtOptions.length === 1) {
      setLocalData((prev) => {
        if (prev.providerId) return prev
        return { ...prev, providerId: rbtOptions[0].value }
      })
    }
  }, [open, rbtOptions, rbtProvidersLoading])

  // ─── Auto-assign prior authorization (from session PA) ───
  useEffect(() => {
    if (!open || !sessionPriorAuth?.id) return
    setLocalData((prev) => {
      if (prev.priorAuthorizationId) return prev
      return { ...prev, priorAuthorizationId: sessionPriorAuth.id }
    })
  }, [open, sessionPriorAuth])

  // ─── Field update ───
  const updateField = useCallback(
    <K extends keyof SupervisionFormData>(field: K, value: SupervisionFormData[K]) => {
      setLocalData((prev) => {
        const next = { ...prev, [field]: value }
        // Reset validation when session billing code or time changes
        if (
          field === "sessionBillingCodeId" ||
          field === "startTime" ||
          field === "endTime" ||
          field === "date"
        ) {
          next.priorAuthorizationId = ""
          next.approvedPriorAuthorizationBillingCodeId = ""
          next.validatedUnits = null
        }
        return next
      })
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        if (field === "startTime" || field === "endTime" || field === "date") {
          delete next.timeRange
        }
        return next
      })
      if (
        field === "startTime" ||
        field === "endTime" ||
        field === "date" ||
        field === "sessionBillingCodeId"
      ) {
        setValidationError(null)
      }
    },
    [],
  )

  // ─── Async validation (validates session billing code against PA) ───
  useEffect(() => {
    if (!open || !clientId) return

    const { sessionBillingCodeId, startTime, endTime, date } = localData
    if (!sessionBillingCodeId || !startTime || !endTime || !date) return

    const key = buildKey(clientId, { sessionBillingCodeId, startTime, endTime, date })
    if (key === validateKey.current) return
    validateKey.current = key

    let cancelled = false
    const run = async () => {
      try {
        setIsValidating(true)
        setValidationError(null)
        const result = await validateAppointmentEventData({
          clientId,
          billingCodeId: sessionBillingCodeId,
          startTime: toValidateTime(startTime),
          endTime: toValidateTime(endTime),
          appointmentTypeEvent: "Supervision",
        })
        if (cancelled) return
        setLocalData((prev) => ({
          ...prev,
          validatedUnits: result.unitsToUse,
          priorAuthorizationId: result.priorAuthorizationId,
          approvedPriorAuthorizationBillingCodeId:
            result.approvedPriorAuthorizationBillingCodeId,
        }))
      } catch (err) {
        if (cancelled) return
        validateKey.current = ""
        setLocalData((prev) => ({
          ...prev,
          validatedUnits: null,
          priorAuthorizationId: "",
          approvedPriorAuthorizationBillingCodeId: "",
        }))
        setValidationError(err instanceof Error ? err.message : "Validation failed")
      } finally {
        if (!cancelled) setIsValidating(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [open, clientId, localData.sessionBillingCodeId, localData.startTime, localData.endTime, localData.date])

  // ─── Computed values ───
  const durationMinutes = useMemo(
    () => calculateDurationMinutes(localData.startTime, localData.endTime),
    [localData.startTime, localData.endTime],
  )

  const billableUnits = localData.validatedUnits ?? calculateBillableUnits(durationMinutes)

  const priorAuthorizationOptions = useMemo(() => {
    if (localData.priorAuthorizationId) {
      return [
        {
          value: localData.priorAuthorizationId,
          label: isLoadingPriorAuthLabel
            ? "Loading prior authorization…"
            : localPriorAuthLabel ||
              (sessionPriorAuth?.authNumber ? `# ${sessionPriorAuth.authNumber}` : "Prior authorization"),
        },
      ]
    }
    if (sessionPriorAuth?.id) {
      return [
        {
          value: sessionPriorAuth.id,
          label: sessionPriorAuth.authNumber
            ? `# ${sessionPriorAuth.authNumber}`
            : "Prior authorization",
        },
      ]
    }
    return []
  }, [
    localData.priorAuthorizationId,
    localPriorAuthLabel,
    isLoadingPriorAuthLabel,
    sessionPriorAuth,
  ])

  // ─── Validation ───
  const validate = useCallback((): boolean => {
    const next: Record<string, string> = {}

    if (!localData.providerId) next.providerId = "Select a provider"
    if (!localData.sessionBillingCodeId) next.sessionBillingCodeId = "Select a session billing code"
    if (!localData.date) next.date = "Select a date"
    if (!localData.startTime) next.startTime = "Select a start time"
    if (!localData.endTime) next.endTime = "Select an end time"
    if (localData.startTime && localData.endTime && durationMinutes <= 0) {
      next.endTime = "End time must be after start time"
    }
    if (validationError) next.timeRange = validationError

    setErrors(next)
    return Object.keys(next).length === 0
  }, [localData, durationMinutes, validationError])

  // ─── Submit ───
  const handleSave = async () => {
    if (!validate() || !appointment) return

    setIsSubmitting(true)
    try {
      const units = localData.validatedUnits ?? calculateBillableUnits(durationMinutes)
      const payload = {
        appointmentId: appointment.id,
        timeInit: toApiTime(localData.startTime),
        timeEnd: toApiTime(localData.endTime),
        date: localData.date,
        billingCodeId: localData.sessionBillingCodeId,
        supervisionBillingCodeId: localData.supervisionBillingCodeId,
        units,
        providerId: localData.providerId,
      }

      if (isEditing && appointment.supervision?.id) {
        await updateSubEvent({ ...payload, id: appointment.supervision.id })
        alert.success("Supervision Updated", "The supervision session has been updated")
      } else {
        await createSubEvent(payload)
        alert.success("Supervision Created", "The supervision session has been added")
      }

      onSaved()
      onClose()
    } catch (err) {
      alert.error(
        "Error",
        err instanceof Error ? err.message : "Failed to save supervision",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // ─── Render ───
  return (
    <CustomModal
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      title={
        isEditing
          ? isSessionSupervision ? "Edit Session" : "Edit Supervision"
          : isSessionSupervision ? "Add Session" : "Add Supervision"
      }
      description={
        appointment?.clientName
          ? `${isSessionSupervision ? "Session" : "Supervision"} for ${appointment.clientName}`
          : "Configure the sub-event for this session"
      }
      maxWidthClassName="sm:max-w-[560px]"
      allowSelectOverflow
      contentClassName="!overflow-visible"
      onOpenAutoFocus={(e) => e.preventDefault()}
    >
      <div className="px-7 py-6 space-y-4">
        {/* Session Billing Code — hidden when parent already has one (97155) */}
        {!parentHasBillingCode && (
          <>
            <FloatingSelect
              label="Session Billing Code"
              value={localData.sessionBillingCodeId}
              onChange={(v) => updateField("sessionBillingCodeId", v)}
              options={sessionCodeOptions}
              hasError={!!errors.sessionBillingCodeId}
              required
              searchable
              disabled={sessionBillingCodesLoading}
            />
            {sessionBillingCodesLoading && <Hint>Loading session billing codes…</Hint>}
            <FieldError message={errors.sessionBillingCodeId} />
          </>
        )}

        {/* Supervision Billing Code (optional) */}
        <FloatingSelect
          label="Supervision Billing Code"
          value={localData.supervisionBillingCodeId}
          onChange={(v) => updateField("supervisionBillingCodeId", v)}
          options={supervisionCodeOptions}
          searchable
          dropdownPosition="bottom"
          disabled={supervisionBillingCodesLoading}
        />
        {supervisionBillingCodesLoading && <Hint>Loading supervision billing codes…</Hint>}

        {/* Provider */}
        <FloatingSelect
          label="Provider (Supervisor)"
          value={localData.providerId}
          onChange={() => {}}
          options={rbtOptions}
          disabled
        />

        {/* Date */}
        <PremiumDatePicker
          label="Supervision Date"
          value={localData.date}
          onChange={() => {}}
          disabled
        />

        {/* Time range — editable */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FloatingTimePicker
              label="Start Time"
              value={localData.startTime}
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
              value={localData.endTime}
              onChange={(v) => updateField("endTime", v)}
              hasError={!!errors.endTime || !!validationError}
              required
              allowManualInput
            />
            <FieldError message={errors.endTime} />
          </div>
        </div>
        <FieldError message={validationError || errors.timeRange} />

        {/* Duration + Units summary */}
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
                  {isValidating ? "…" : billableUnits}
                </span>
              </span>
            </div>
          </div>
        )}

        {/* Prior Authorization (readonly, auto-assigned) */}
        <FloatingSelect
          label="Prior Authorization"
          value={localData.priorAuthorizationId}
          onChange={() => {}}
          options={priorAuthorizationOptions}
          disabled
          dropdownPosition="bottom"
        />
        {isValidating && <Hint>Validating prior authorization…</Hint>}
        {!isValidating && !localData.priorAuthorizationId && !validationError && (
          <Hint>Assigned automatically after billing code and time are validated</Hint>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 border-t border-slate-200/80 bg-white/70 px-7 py-4 rounded-b-2xl">
        <Button type="button" variant="secondary" onClick={onClose} className="h-10">
          Cancel
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={handleSave}
          loading={isSubmitting}
          className="h-10 min-w-[160px]"
        >
          {isEditing ? "Update" : "Add"} {isSessionSupervision ? "Session" : "Supervision"}
        </Button>
      </div>
    </CustomModal>
  )
}

// ============================================
// Helpers
// ============================================

function buildKey(
  clientId: string,
  data: Pick<SupervisionFormData, "sessionBillingCodeId" | "startTime" | "endTime" | "date">,
): string {
  return `${clientId}|${data.sessionBillingCodeId}|${data.startTime}|${data.endTime}|${data.date}|supervision`
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1.5 text-xs text-red-500">{message}</p>
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="mt-1.5 text-xs text-slate-400">{children}</p>
}

function HintError({ children }: { children: React.ReactNode }) {
  return <p className="mt-1.5 text-xs text-red-500">{children}</p>
}
