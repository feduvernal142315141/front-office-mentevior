"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { CustomModal } from "@/components/custom/CustomModal"
import { Button } from "@/components/custom/Button"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingTimePicker } from "@/components/custom/FloatingTimePicker"
import { PremiumDatePicker } from "@/components/custom/PremiumDatePicker"
import { Clock, Zap } from "lucide-react"
import type { AppointmentFormData } from "@/lib/types/appointment.types"
import {
  calculateBillableUnits,
  calculateDurationMinutes,
  formatDuration,
} from "@/lib/utils/unit-calculation"
import { createEmptySupervisionForm } from "@/lib/modules/schedules/utils/appointment-api.mapper"

interface SupervisionConfigModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: AppointmentFormData["supervision"]) => void
  initialData: AppointmentFormData["supervision"]
  mainDate: string
  mainStartTime: string
  mainEndTime: string
  rbtOptions: Array<{ value: string; label: string }>
  supervisionCodeOptions: Array<{ value: string; label: string }>
  supervisionBillingCodesLoading: boolean
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
  mainDate,
  mainStartTime,
  mainEndTime,
  rbtOptions,
  supervisionCodeOptions,
  supervisionBillingCodesLoading,
}: SupervisionConfigModalProps) {
  const [localData, setLocalData] = useState<AppointmentFormData["supervision"]>(
    createEmptySupervisionForm(),
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) {
      setLocalData(withDefaults(initialData, mainDate, mainStartTime, mainEndTime))
      setErrors({})
    }
  }, [open, initialData, mainDate, mainStartTime, mainEndTime])

  const updateField = useCallback(
    <K extends keyof AppointmentFormData["supervision"]>(
      field: K,
      value: AppointmentFormData["supervision"][K],
    ) => {
      setLocalData((prev) => ({ ...prev, [field]: value }))
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        if (field === "startTime" || field === "endTime" || field === "date") {
          delete next.timeRange
        }
        return next
      })
    },
    [],
  )

  const durationMinutes = useMemo(
    () => calculateDurationMinutes(localData.startTime, localData.endTime),
    [localData.startTime, localData.endTime],
  )

  const billableUnits = localData.validatedUnits ?? calculateBillableUnits(durationMinutes)

  const validate = useCallback((): boolean => {
    const next: Record<string, string> = {}

    if (!localData.title.trim()) next.title = "Enter a title"
    if (!localData.providerId) next.providerId = "Select an RBT"
    if (!localData.date) next.date = "Select a date"
    if (!localData.startTime) next.startTime = "Select a start time"
    if (!localData.endTime) next.endTime = "Select an end time"
    if (localData.startTime && localData.endTime && durationMinutes <= 0) {
      next.endTime = "End time must be after start time"
    }
    if (!localData.billingCodeId) next.billingCodeId = "Select a billing code"

    setErrors(next)
    return Object.keys(next).length === 0
  }, [localData, durationMinutes])

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
      description="Configure the supervision sub-event for this Service Plan"
      maxWidthClassName="sm:max-w-[560px]"
      allowSelectOverflow
      contentClassName="!overflow-visible"
    >
      <div className="px-7 py-6 space-y-4">
        <FloatingInput
          label="Title"
          value={localData.title}
          onChange={(v) => updateField("title", v)}
          onBlur={() => {}}
          hasError={!!errors.title}
          required
        />
        {errors.title && <FieldError message={errors.title} />}

        <FloatingSelect
          label="RBT (Provider being supervised)"
          value={localData.providerId}
          onChange={(v) => updateField("providerId", v)}
          options={rbtOptions}
          hasError={!!errors.providerId}
          required
          searchable
        />
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
              hasError={!!errors.startTime}
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
              hasError={!!errors.endTime}
              required
              allowManualInput
            />
            <FieldError message={errors.endTime} />
          </div>
        </div>
        <FieldError message={errors.timeRange} />

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
                <span className="font-semibold text-[#037ECC]">{billableUnits}</span>
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
