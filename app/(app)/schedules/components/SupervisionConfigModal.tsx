"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { CustomModal } from "@/components/custom/CustomModal"
import { Button } from "@/components/custom/Button"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { FloatingTimePicker } from "@/components/custom/FloatingTimePicker"
import { PremiumDatePicker } from "@/components/custom/PremiumDatePicker"
import { Clock, Zap } from "lucide-react"
import type { AppointmentFormData } from "@/lib/types/appointment.types"
import {
  calculateBillableUnits,
  calculateDurationMinutes,
  formatDuration,
} from "@/lib/utils/unit-calculation"
import {
  createEmptySupervisionForm,
  buildSupervisionValidateKey,
  toValidateTime,
} from "@/lib/modules/schedules/utils/appointment-api.mapper"
import { validateAppointmentEventData } from "@/lib/modules/schedules/services/appointment-validate.service"
import { usePriorAuthorizationLabel } from "@/lib/modules/schedules/hooks/use-prior-authorization-label"
import { useApprovedBillingCodes } from "@/lib/modules/schedules/hooks/use-approved-billing-codes"

interface SupervisionConfigModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: AppointmentFormData["supervision"]) => void
  initialData: AppointmentFormData["supervision"]
  clientId: string
  mainDate: string
  mainStartTime: string
  mainEndTime: string
  rbtOptions: Array<{ value: string; label: string }>
  rbtProvidersLoading?: boolean
  rbtProvidersError?: Error | null
}

function withDefaults(
  data: AppointmentFormData["supervision"],
  mainDate: string,
  mainStartTime: string,
  mainEndTime: string,
): AppointmentFormData["supervision"] {
  return {
    ...createEmptySupervisionForm(),
    ...data,
    date: data.date || mainDate,
    startTime: data.startTime || mainStartTime,
    endTime: data.endTime || mainEndTime,
  }
}

export function SupervisionConfigModal({
  open,
  onClose,
  onSave,
  initialData,
  clientId,
  mainDate,
  mainStartTime,
  mainEndTime,
  rbtOptions,
  rbtProvidersLoading = false,
  rbtProvidersError = null,
}: SupervisionConfigModalProps) {
  // Fetch supervision billing codes + prior auth directly for this client
  const {
    billingCodes: supervisionBillingCodes,
    priorAuthorization: supervisionPriorAuth,
    isLoading: supervisionBillingCodesLoading,
  } = useApprovedBillingCodes(open && clientId ? clientId : null, "Supervision")

  const supervisionCodeOptions = useMemo(
    () => supervisionBillingCodes.map((bc) => ({ value: bc.id, label: bc.label })),
    [supervisionBillingCodes],
  )
  const [localData, setLocalData] = useState<AppointmentFormData["supervision"]>(
    createEmptySupervisionForm(),
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isValidatingLocal, setIsValidatingLocal] = useState(false)
  const validateKey = useRef("")

  const { label: localPriorAuthLabel, isLoading: isLoadingLocalPriorAuthLabel } =
    usePriorAuthorizationLabel(localData.priorAuthorizationId, clientId)

  // Initialize form when modal opens
  useEffect(() => {
    if (open) {
      const data = withDefaults(initialData, mainDate, mainStartTime, mainEndTime)
      setLocalData(data)
      setErrors({})
      setValidationError(null)
      if (data.validatedUnits != null && clientId) {
        validateKey.current = buildSupervisionValidateKey(clientId, data)
      } else {
        validateKey.current = ""
      }
    }
  }, [open, initialData, mainDate, mainStartTime, mainEndTime, clientId])

  // Auto-select billing code when options load (single option)
  useEffect(() => {
    if (!open || supervisionBillingCodesLoading) return
    if (supervisionCodeOptions.length === 1) {
      setLocalData((prev) => {
        if (prev.billingCodeId) return prev
        return { ...prev, billingCodeId: supervisionCodeOptions[0].value }
      })
    }
  }, [open, supervisionCodeOptions, supervisionBillingCodesLoading])

  // Auto-select RBT provider when only one available
  useEffect(() => {
    if (!open || rbtProvidersLoading) return
    if (rbtOptions.length === 1) {
      setLocalData((prev) => {
        if (prev.providerId) return prev
        return { ...prev, providerId: rbtOptions[0].value }
      })
    }
  }, [open, rbtOptions, rbtProvidersLoading])

  // Auto-assign prior authorization from the supervision PA
  useEffect(() => {
    if (!open || !supervisionPriorAuth?.id) return
    setLocalData((prev) => {
      if (prev.priorAuthorizationId) return prev
      return { ...prev, priorAuthorizationId: supervisionPriorAuth.id }
    })
  }, [open, supervisionPriorAuth])

  const updateField = useCallback(
    <K extends keyof AppointmentFormData["supervision"]>(
      field: K,
      value: AppointmentFormData["supervision"][K],
    ) => {
      setLocalData((prev) => {
        const next = { ...prev, [field]: value }
        if (
          field === "billingCodeId" ||
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
      if (field === "startTime" || field === "endTime" || field === "date" || field === "billingCodeId") {
        setValidationError(null)
      }
    },
    [],
  )

  useEffect(() => {
    if (!open || !clientId) return

    const { billingCodeId, startTime, endTime, date } = localData
    if (!billingCodeId || !startTime || !endTime || !date) return

    const key = buildSupervisionValidateKey(clientId, {
      billingCodeId,
      startTime,
      endTime,
      date,
    })
    if (key === validateKey.current) return
    validateKey.current = key

    let cancelled = false
    const run = async () => {
      try {
        setIsValidatingLocal(true)
        setValidationError(null)
        const result = await validateAppointmentEventData({
          clientId,
          billingCodeId,
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
        if (!cancelled) setIsValidatingLocal(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [open, clientId, localData.billingCodeId, localData.startTime, localData.endTime, localData.date])

  const durationMinutes = useMemo(
    () => calculateDurationMinutes(localData.startTime, localData.endTime),
    [localData.startTime, localData.endTime],
  )

  const billableUnits = localData.validatedUnits ?? calculateBillableUnits(durationMinutes)

  const isValidatingPriorAuth = isValidatingLocal

  const priorAuthorizationOptions = useMemo(() => {
    if (localData.priorAuthorizationId) {
      return [
        {
          value: localData.priorAuthorizationId,
          label: isLoadingLocalPriorAuthLabel
            ? "Loading prior authorization…"
            : localPriorAuthLabel ||
              (supervisionPriorAuth?.authNumber ? `# ${supervisionPriorAuth.authNumber}` : "Prior authorization"),
        },
      ]
    }
    // Show the PA from the approved billing codes fetch if available
    if (supervisionPriorAuth?.id) {
      return [
        {
          value: supervisionPriorAuth.id,
          label: supervisionPriorAuth.authNumber
            ? `# ${supervisionPriorAuth.authNumber}`
            : "Prior authorization",
        },
      ]
    }
    return []
  }, [
    localData.priorAuthorizationId,
    localPriorAuthLabel,
    isLoadingLocalPriorAuthLabel,
    supervisionPriorAuth,
  ])

  const validate = useCallback((): boolean => {
    const next: Record<string, string> = {}

    if (!localData.providerId) next.providerId = "Select an RBT"
    if (!localData.date) next.date = "Select a date"
    if (!localData.startTime) next.startTime = "Select a start time"
    if (!localData.endTime) next.endTime = "Select an end time"
    if (localData.startTime && localData.endTime && durationMinutes <= 0) {
      next.endTime = "End time must be after start time"
    }
    if (!localData.billingCodeId) next.billingCodeId = "Select a billing code"
    if (validationError) next.timeRange = validationError

    setErrors(next)
    return Object.keys(next).length === 0
  }, [localData, durationMinutes, validationError])

  const handleSave = () => {
    if (!validate()) return
    onSave(localData)
    onClose()
  }

  return (
    <CustomModal
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      title="Supervision Session"
      description="Configure the supervision sub-event for this session"
      maxWidthClassName="sm:max-w-[560px]"
      allowSelectOverflow
      contentClassName="!overflow-visible"
    >
      <div className="px-7 py-6 space-y-4">
        <FloatingSelect
          label="RBT (Provider being supervised)"
          value={localData.providerId}
          onChange={(v) => updateField("providerId", v)}
          options={rbtOptions}
          hasError={!!errors.providerId}
          required
          searchable
          disabled={!clientId || rbtProvidersLoading}
        />
        {rbtProvidersLoading && (
          <p className="mt-1.5 text-xs text-slate-400">Loading providers…</p>
        )}
        {rbtProvidersError && (
          <p className="mt-1.5 text-xs text-red-500">{rbtProvidersError.message}</p>
        )}
        {!rbtProvidersLoading && clientId && rbtOptions.length === 0 && (
          <p className="mt-1.5 text-xs text-slate-400">No providers assigned to this client</p>
        )}
        <FieldError message={errors.providerId} />

        <PremiumDatePicker
          label="Supervision Date"
          value={localData.date}
          onChange={(v) => updateField("date", v)}
          hasError={!!errors.date}
          errorMessage={errors.date}
          required
        />

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
                  {isValidatingPriorAuth ? "…" : billableUnits}
                </span>
              </span>
            </div>
          </div>
        )}

        <FloatingSelect
          label="Supervision Billing Code"
          value={localData.billingCodeId}
          onChange={(v) => updateField("billingCodeId", v)}
          options={supervisionCodeOptions}
          hasError={!!errors.billingCodeId}
          required
          searchable
          dropdownPosition="bottom"
          disabled={supervisionBillingCodesLoading}
        />
        <FieldError message={errors.billingCodeId} />

        <FloatingSelect
          label="Prior Authorization"
          value={localData.priorAuthorizationId}
          onChange={() => {}}
          options={priorAuthorizationOptions}
          disabled
          dropdownPosition="bottom"
        />
        {isValidatingPriorAuth && (
          <p className="mt-1.5 text-xs text-slate-400">Validating prior authorization…</p>
        )}
        {!isValidatingPriorAuth && !localData.priorAuthorizationId && !validationError && (
          <p className="mt-1.5 text-xs text-slate-400">
            Assigned automatically after billing code and time are validated
          </p>
        )}
      </div>

      <div className="flex justify-end gap-3 border-t border-slate-200/80 bg-white/70 px-7 py-4 rounded-b-2xl">
        <Button type="button" variant="secondary" onClick={onClose} className="h-10">
          Cancel
        </Button>
        <Button type="button" variant="primary" onClick={handleSave} className="h-10 min-w-[120px]">
          Save Supervision
        </Button>
      </div>
    </CustomModal>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1.5 text-xs text-red-500">{message}</p>
}
