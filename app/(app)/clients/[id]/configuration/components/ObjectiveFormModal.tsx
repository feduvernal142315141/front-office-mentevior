"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "@/lib/compat/sonner"

import { CustomModal } from "@/components/custom/CustomModal"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { FloatingTextarea } from "@/components/custom/FloatingTextarea"
import { PremiumDatePicker } from "@/components/custom/PremiumDatePicker"
import { Button } from "@/components/custom/Button"

import {
  deleteClientCategoryObjective,
  deleteClientItemObjective,
} from "@/lib/modules/client-service-plan/services/client-data-collection.service"
import { OPERATOR_SMART_CRITERIA_OPTIONS } from "@/lib/types/data-collection.types"

export interface ObjectiveRow {
  localId: string
  recordId?: string
  name: string
  startDate: string
  estimatedEndDate: string
  endDate: string
  operatorSmartCriteria: string
  valueSmartCriteria: string
  periodSmartCriteriaCatalogId: string
  valueDuration: string
  periodDurationCatalogId: string
}

export function createEmptyObjective(): ObjectiveRow {
  return {
    localId: crypto.randomUUID(),
    name: "",
    startDate: "",
    estimatedEndDate: "",
    endDate: "",
    operatorSmartCriteria: "LTE",
    valueSmartCriteria: "",
    periodSmartCriteriaCatalogId: "",
    valueDuration: "",
    periodDurationCatalogId: "",
  }
}

interface ObjectiveFormModalProps {
  open: boolean
  onClose: () => void
  objective: ObjectiveRow | null
  mode: "category" | "item"
  onSave: (objective: ObjectiveRow) => void
  onDelete: (objective: ObjectiveRow) => void
  periodSelectOptions: { value: string; label: string }[]
}

export function ObjectiveFormModal({
  open,
  onClose,
  objective,
  mode,
  onSave,
  onDelete,
  periodSelectOptions,
}: ObjectiveFormModalProps) {
  const isEdit = !!objective?.recordId

  const [form, setForm] = useState<ObjectiveRow>(objective ?? createEmptyObjective())
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(objective ?? createEmptyObjective())
    }
  }, [open, objective])

  const update = useCallback(
    (field: keyof ObjectiveRow, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }))
    },
    []
  )

  const handleSave = useCallback(() => {
    if (!form.name.trim()) {
      toast.error("Name is required")
      return
    }
    if (!form.startDate) {
      toast.error("Start date is required")
      return
    }
    if (!form.operatorSmartCriteria || !form.valueSmartCriteria || !form.periodSmartCriteriaCatalogId) {
      toast.error("Smart Criteria fields are required")
      return
    }
    if (!form.valueDuration || !form.periodDurationCatalogId) {
      toast.error("Duration fields are required")
      return
    }
    onSave(form)
    onClose()
  }, [form, onSave, onClose])

  const handleDelete = useCallback(async () => {
    if (!objective) return
    if (objective.recordId) {
      setIsDeleting(true)
      try {
        if (mode === "item") {
          await deleteClientItemObjective(objective.recordId)
        } else {
          await deleteClientCategoryObjective(objective.recordId)
        }
        toast.success("Objective removed")
      } catch {
        toast.error("Failed to delete objective")
        setIsDeleting(false)
        return
      }
      setIsDeleting(false)
    }
    onDelete(objective)
    onClose()
  }, [objective, mode, onDelete, onClose])

  const handleClear = useCallback(() => {
    setForm((prev) => ({
      ...createEmptyObjective(),
      localId: prev.localId,
      recordId: prev.recordId,
    }))
  }, [])

  return (
    <CustomModal
      open={open}
      onOpenChange={(next) => { if (!next) onClose() }}
      title={isEdit ? "Edit Objective" : "New Objective"}
      maxWidthClassName="sm:max-w-[720px]"
      allowSelectOverflow
      contentClassName="!overflow-visible"
    >
      <div className="px-6 py-5 space-y-5">
        {/* Name */}
        <FloatingTextarea
          label="Name"
          value={form.name}
          onChange={(v) => update("name", v)}
          onBlur={() => {}}
          rows={2}
          hasError={false}
        />

        {/* Dates */}
        <div className="grid grid-cols-3 gap-4">
          <PremiumDatePicker
            label="Start Date"
            value={form.startDate}
            onChange={(v) => update("startDate", v)}
            required
          />
          <PremiumDatePicker
            label="Estimated End Date"
            value={form.estimatedEndDate}
            onChange={(v) => update("estimatedEndDate", v)}
          />
          <PremiumDatePicker
            label="End Date"
            value={form.endDate}
            onChange={(v) => update("endDate", v)}
          />
        </div>

        {/* Smart Criteria */}
        <div>
          <label className="text-sm font-medium text-slate-600 mb-2 block">Smart Criteria</label>
          <div className="grid grid-cols-[100px_1fr_1fr] gap-3">
            <FloatingSelect
              label="Op"
              value={form.operatorSmartCriteria}
              onChange={(v) => update("operatorSmartCriteria", v)}
              options={OPERATOR_SMART_CRITERIA_OPTIONS}
            />
            <FloatingInput
              label="Value"
              value={form.valueSmartCriteria}
              onChange={(v) => update("valueSmartCriteria", v.replace(/[^0-9.-]/g, ""))}
              onBlur={() => {}}
              inputMode="numeric"
            />
            <FloatingSelect
              label="Period"
              value={form.periodSmartCriteriaCatalogId}
              onChange={(v) => update("periodSmartCriteriaCatalogId", v)}
              options={periodSelectOptions}
            />
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="text-sm font-medium text-slate-600 mb-2 block">Duration</label>
          <div className="grid grid-cols-2 gap-3">
            <FloatingInput
              label="Value"
              value={form.valueDuration}
              onChange={(v) => update("valueDuration", v.replace(/[^0-9.-]/g, ""))}
              onBlur={() => {}}
              inputMode="numeric"
            />
            <FloatingSelect
              label="Period"
              value={form.periodDurationCatalogId}
              onChange={(v) => update("periodDurationCatalogId", v)}
              options={periodSelectOptions}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
        <div>
          {isEdit ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => void handleDelete()}
              loading={isDeleting}
              className="!text-red-600 !border-red-200 hover:!bg-red-50"
            >
              Delete
            </Button>
          ) : (
            <Button type="button" variant="secondary" onClick={handleClear} className="!text-red-600 !border-red-200 hover:!bg-red-50">
              Clear
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            {isEdit ? "Update" : "Create"}
          </Button>
        </div>
      </div>
    </CustomModal>
  )
}
