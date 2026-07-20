"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { CustomModal } from "@/components/custom/CustomModal"
import { Button } from "@/components/custom/Button"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import type { Appointment } from "@/lib/types/appointment.types"
import {
  calculateBillableUnits,
  calculateDurationMinutes,
} from "@/lib/utils/unit-calculation"
import { toApiTime } from "@/lib/modules/schedules/utils/appointment-api.mapper"
import { useBillingCodes } from "@/lib/modules/billing-codes/hooks/use-billing-codes"
import { useProvidersExcludingLoggedUser } from "@/lib/modules/providers/hooks/use-providers-excluding-logged-user"
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
  /** Supervision billing code → POST supervisionBillingCodeId */
  supervisionBillingCodeId: string
}

function createEmptyForm(): SupervisionFormData {
  return {
    providerId: "",
    supervisionBillingCodeId: "",
  }
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
  const parentBillingCodeLabel = appointment ? getAppointmentBillingCodeLabel(appointment) : ""
  const isSessionSupervision = !!appointment?.billingCodeId && !canHaveInlineSupervision(parentBillingCodeLabel)

  // ─── Data fetching ───

  const {
    billingCodes: supervisionBillingCodesRaw,
    isLoading: supervisionBillingCodesLoading,
  } = useBillingCodes({ page: 0, pageSize: 0, filters: ["type__EQ__Supervision__AND"] })

  const {
    providers: clientProviders,
    isLoading: rbtProvidersLoading,
  } = useProvidersExcludingLoggedUser(open && clientId ? clientId : null)

  const rbtOptions = useMemo(
    () =>
      clientProviders
        .filter((p) => p.active && !p.terminated && p.userId)
        .map((p) => ({ value: p.userId, label: p.fullName })),
    [clientProviders],
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
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ─── Initialize form when modal opens ───
  useEffect(() => {
    if (!open || !appointment) return

    if (isEditing && appointment.supervision) {
      const sup = appointment.supervision
      setLocalData({
        providerId: sup.providerId ?? "",
        supervisionBillingCodeId: sup.supervisionBillingCodeId ?? "",
      })
    } else {
      setLocalData(createEmptyForm())
    }

    setErrors({})
  }, [open, appointment, isEditing])

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

  // ─── Field update ───
  const updateField = useCallback(
    <K extends keyof SupervisionFormData>(field: K, value: SupervisionFormData[K]) => {
      setLocalData((prev) => ({ ...prev, [field]: value }))
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    },
    [],
  )

  // ─── Validation ───
  const validate = useCallback((): boolean => {
    const next: Record<string, string> = {}
    if (!localData.providerId) next.providerId = "Select a provider"
    setErrors(next)
    return Object.keys(next).length === 0
  }, [localData])

  // ─── Submit ───
  const handleSave = async () => {
    if (!validate() || !appointment) return

    const durationMinutes = calculateDurationMinutes(
      appointment.timeInit?.slice(0, 5) ?? "",
      appointment.timeEnd?.slice(0, 5) ?? "",
    )
    const units = calculateBillableUnits(durationMinutes)

    setIsSubmitting(true)
    try {
      const payload = {
        appointmentId: appointment.id,
        timeInit: toApiTime(appointment.timeInit?.slice(0, 5) ?? ""),
        timeEnd: toApiTime(appointment.timeEnd?.slice(0, 5) ?? ""),
        date: appointment.date ?? "",
        billingCodeId: appointment.billingCodeId ?? "",
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
        {/* Provider */}
        <FloatingSelect
          label="Provider (Supervisor)"
          value={localData.providerId}
          onChange={(v) => updateField("providerId", v)}
          options={rbtOptions}
          hasError={!!errors.providerId}
          required
          searchable
          disabled={rbtProvidersLoading}
        />
        <FieldError message={errors.providerId} />

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

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1.5 text-xs text-red-500">{message}</p>
}
