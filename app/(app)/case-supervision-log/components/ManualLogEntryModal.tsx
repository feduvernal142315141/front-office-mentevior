"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/custom/Button"
import { CustomModal } from "@/components/custom/CustomModal"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { FloatingTextarea } from "@/components/custom/FloatingTextarea"
import { FloatingTimePicker } from "@/components/custom/FloatingTimePicker"
import { MultiSelect } from "@/components/custom/MultiSelect"
import { PremiumDatePicker } from "@/components/custom/PremiumDatePicker"
import {
  createEmptyManualEntry,
  getManualEntryDuration,
  getReportMonthBounds,
  validateManualEntry,
  type ManualEntryFormValue,
} from "@/lib/modules/case-supervision-log/utils/manual-entries"
import type { useManualEntryOptions } from "../hooks/useManualEntryOptions"
import { formatHours } from "./manual-entry-format"

interface ManualLogEntryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** `null` para agregar una entrada nueva */
  entry: ManualEntryFormValue | null
  /** `yyyyMM` — acota el Date of Service al mes del reporte */
  reportMonth: string
  options: ReturnType<typeof useManualEntryOptions>
  onSave: (entry: ManualEntryFormValue) => void | Promise<void>
  isSaving?: boolean
}

/**
 * Alta y edición de una entrada manual. Ningún campo es obligatorio. Total Time
 * sale de Start Time y End Time. Service Type no se muestra: se deriva del
 * billing code igual que en el backend y sólo viaja en el `PUT`.
 */
export function ManualLogEntryModal({
  open,
  onOpenChange,
  entry,
  reportMonth,
  options,
  onSave,
  isSaving,
}: ManualLogEntryModalProps) {
  const [draft, setDraft] = useState<ManualEntryFormValue>(() => entry ?? createEmptyManualEntry())
  /** Los errores se muestran recién después del primer intento de guardar */
  const [submitted, setSubmitted] = useState(false)
  const isEdit = !!entry

  // Cada apertura arranca de la entrada elegida, o de una vacía al agregar
  useEffect(() => {
    if (!open) return
    setDraft(entry ?? createEmptyManualEntry())
    setSubmitted(false)
  }, [open, entry])

  const errors = submitted ? validateManualEntry(draft) : {}

  const handleSave = () => {
    setSubmitted(true)
    if (Object.keys(validateManualEntry(draft)).length > 0) return
    void onSave(draft)
  }

  const { minDate, maxDate } = useMemo(() => getReportMonthBounds(reportMonth), [reportMonth])
  const duration = getManualEntryDuration(draft.timeStart, draft.timeEnd)

  const update = <K extends keyof ManualEntryFormValue>(field: K, value: ManualEntryFormValue[K]) => {
    setDraft((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <CustomModal
      open={open}
      onOpenChange={(next) => { if (!isSaving) onOpenChange(next) }}
      title={isEdit ? "Edit Log Entry" : "New Log Entry"}
      description="Date and times are required; everything else is optional."
      maxWidthClassName="sm:max-w-[860px]"
      allowSelectOverflow
      contentClassName="!overflow-visible"
    >
      <div className="space-y-4 px-6 py-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <PremiumDatePicker
            label="Date of Service"
            value={draft.date}
            onChange={(v) => update("date", v)}
            onClear={() => update("date", "")}
            minDate={minDate}
            maxDate={maxDate}
            disabled={isSaving}
            required
            hasError={!!errors.date}
            errorMessage={errors.date}
          />
          <FloatingTimePicker
            label="Start Time"
            value={draft.timeStart}
            onChange={(v) => update("timeStart", v)}
            allowManualInput
            disabled={isSaving}
            required
            hasError={!!errors.timeStart}
          />
          <FloatingTimePicker
            label="End Time"
            value={draft.timeEnd}
            onChange={(v) => update("timeEnd", v)}
            allowManualInput
            defaultPeriod="PM"
            disabled={isSaving}
            required
            hasError={!!errors.timeEnd}
          />
          <ReadOnlyValue label="Total Time (hrs)" value={formatHours(duration)} />
        </div>
        {(errors.timeStart || errors.timeEnd) && (
          <p className="-mt-2 text-xs font-medium text-red-500">{errors.timeEnd ?? errors.timeStart}</p>
        )}

        {/* Service Type no se pide: sale de si se eligió un billing code */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FloatingSelect
            label="Billing Code"
            value={draft.billingCodeId}
            onChange={(v) =>
              setDraft((prev) => ({ ...prev, billingCodeId: v, serviceType: options.getServiceType(v) }))
            }
            options={options.billingCodeOptions}
            disabled={isSaving}
            searchable
            clearable
          />
          <FloatingSelect
            label="Location"
            value={draft.clientAddressId}
            onChange={(v) => update("clientAddressId", v)}
            options={options.locationOptions}
            disabled={isSaving}
            searchable
          />
          <FloatingSelect
            label="Modality"
            value={draft.modalityCatalogId}
            onChange={(v) => update("modalityCatalogId", v)}
            options={options.modalityOptions}
            disabled={isSaving}
          />
        </div>

        <MultiSelect
          label="Activity Category"
          value={draft.activityCategoryIds}
          onChange={(v) => update("activityCategoryIds", v)}
          options={options.activityCategoryOptions}
          disabled={isSaving}
          tone="neutral"
          placeholder="Select all that apply"
          maxVisibleTags={6}
        />
        <MultiSelect
          label="Participants"
          value={draft.participantIds}
          onChange={(v) => update("participantIds", v)}
          options={options.participantOptions}
          disabled={isSaving}
          searchable
          tone="neutral"
          placeholder="Select all that apply"
          maxVisibleTags={6}
        />
        <FloatingTextarea
          label="Description of Activity"
          value={draft.description}
          onChange={(v) => update("description", v)}
          onBlur={() => {}}
          rows={4}
          disabled={isSaving}
        />
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
        <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isSaving}>
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          loading={isSaving}
        >
          {isEdit ? "Update" : "Add"}
        </Button>
      </div>
    </CustomModal>
  )
}

function ReadOnlyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex h-[52px] items-center justify-between rounded-[16px] border border-slate-200 bg-slate-50/60 px-4 2xl:h-[56px]">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-semibold tabular-nums text-slate-900">{value}</span>
    </div>
  )
}
