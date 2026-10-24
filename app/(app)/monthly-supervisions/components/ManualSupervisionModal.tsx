"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/custom/Button"
import { CustomModal } from "@/components/custom/CustomModal"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { FloatingTextarea } from "@/components/custom/FloatingTextarea"
import { FloatingTimePicker } from "@/components/custom/FloatingTimePicker"
import { PremiumDatePicker } from "@/components/custom/PremiumDatePicker"
import type { SupervisionAppointment } from "@/lib/types/monthly-supervision.types"
import {
  SUPERVISION_EVALUATIONS,
  SUPERVISION_MODES,
  SUPERVISION_STRUCTURES,
  toSelectOptions,
} from "@/lib/constants/monthly-supervision-options"

export type ManualSupervisionDraft = Pick<
  SupervisionAppointment,
  "date" | "timeStart" | "timeEnd" | "mode" | "structure" | "evaluation" | "observedWithClient" | "supervisionNotes"
> & { id?: string }

interface ManualSupervisionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  draft: ManualSupervisionDraft | null
  onSave: (draft: ManualSupervisionDraft) => void
  disabled?: boolean
}

const emptyDraft = (): ManualSupervisionDraft => ({
  date: "",
  timeStart: "",
  timeEnd: "",
  mode: "",
  structure: "",
  evaluation: "",
  observedWithClient: undefined,
  supervisionNotes: "",
})

export function ManualSupervisionModal({
  open,
  onOpenChange,
  draft,
  onSave,
  disabled,
}: ManualSupervisionModalProps) {
  const [value, setValue] = useState<ManualSupervisionDraft>(() => draft ?? emptyDraft())
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!open) return
    setValue(draft ?? emptyDraft())
    setSubmitted(false)
  }, [draft, open])

  const hasTimeError = !!value.timeStart && !!value.timeEnd && value.timeEnd <= value.timeStart
  const errors = {
    date: !value.date,
    time: !value.timeStart || !value.timeEnd || hasTimeError,
    mode: !value.mode,
    structure: !value.structure,
    evaluation: !value.evaluation,
    observedWithClient: value.observedWithClient === undefined,
  }
  const hasErrors = Object.values(errors).some(Boolean)

  const update = <K extends keyof ManualSupervisionDraft>(field: K, next: ManualSupervisionDraft[K]) => {
    setValue((current) => ({ ...current, [field]: next }))
  }

  const save = () => {
    setSubmitted(true)
    if (hasErrors) return
    onSave(value)
  }

  const hasError = (field: keyof typeof errors) => submitted && errors[field]

  return (
    <CustomModal
      open={open}
      onOpenChange={(next) => { if (!disabled) onOpenChange(next) }}
      title={draft?.id ? "Edit Manual Supervision" : "Add Manual Supervision"}
      description="Complete the supervision details. The note is optional."
      maxWidthClassName="sm:max-w-[860px]"
      contentClassName="!overflow-visible"
    >
      <div className="space-y-4 px-6 py-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <PremiumDatePicker
            label="Date"
            value={value.date}
            onChange={(next) => update("date", next)}
            onClear={() => update("date", "")}
            disabled={disabled}
            required
            hasError={hasError("date")}
          />
          <FloatingTimePicker
            label="Start time"
            value={value.timeStart ?? ""}
            onChange={(next) => update("timeStart", next)}
            allowManualInput
            disabled={disabled}
            required
            hasError={hasError("time")}
          />
          <FloatingTimePicker
            label="End time"
            value={value.timeEnd ?? ""}
            onChange={(next) => update("timeEnd", next)}
            allowManualInput
            defaultPeriod="PM"
            disabled={disabled}
            required
            hasError={hasError("time")}
          />
        </div>

        {hasError("time") && (
          <p className="-mt-2 text-xs font-medium text-red-500">Enter both times and make sure the end time is later.</p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FloatingSelect
            label="Mode"
            value={value.mode ?? ""}
            onChange={(next) => update("mode", next)}
            options={toSelectOptions(SUPERVISION_MODES, value.mode)}
            disabled={disabled}
            hasError={hasError("mode")}
            required
          />
          <FloatingSelect
            label="Structure"
            value={value.structure ?? ""}
            onChange={(next) => update("structure", next)}
            options={toSelectOptions(SUPERVISION_STRUCTURES, value.structure)}
            disabled={disabled}
            hasError={hasError("structure")}
            required
          />
          <FloatingSelect
            label="Evaluation"
            value={value.evaluation ?? ""}
            onChange={(next) => update("evaluation", next)}
            options={toSelectOptions(SUPERVISION_EVALUATIONS, value.evaluation)}
            disabled={disabled}
            hasError={hasError("evaluation")}
            required
          />
          <FloatingSelect
            label="Observed with client"
            value={value.observedWithClient === undefined ? "" : value.observedWithClient ? "yes" : "no"}
            onChange={(next) => update("observedWithClient", next === "yes")}
            options={[{ value: "", label: "Select" }, { value: "yes", label: "Yes" }, { value: "no", label: "No" }]}
            disabled={disabled}
            hasError={hasError("observedWithClient")}
            required
          />
        </div>

        <FloatingTextarea
          label="Supervision note"
          value={value.supervisionNotes ?? ""}
          onChange={(next) => update("supervisionNotes", next)}
          onBlur={() => {}}
          rows={4}
          disabled={disabled}
        />
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
        <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={disabled}>
          Cancel
        </Button>
        <Button type="button" onClick={save} loading={disabled}>
          {draft?.id ? "Update" : "Add"}
        </Button>
      </div>
    </CustomModal>
  )
}

