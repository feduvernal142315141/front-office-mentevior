"use client"

import { Pill, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/custom/Button"
import { FloatingInput } from "@/components/custom/FloatingInput"
import type { AssessmentMedicationInput } from "@/lib/types/assessment.types"

interface MedicationsSectionProps {
  medications: AssessmentMedicationInput[]
  disabled?: boolean
  onAdd: () => void
  onRemove: (index: number) => void
  onUpdate: (index: number, field: keyof AssessmentMedicationInput, value: string) => void
}

export function MedicationsSection({
  medications,
  disabled,
  onAdd,
  onRemove,
  onUpdate,
}: MedicationsSectionProps) {
  return (
    <div className="space-y-4">
      {medications.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 py-8">
          <Pill className="h-6 w-6 text-slate-300" />
          <p className="text-sm text-slate-500">No current medications added</p>
        </div>
      )}

      {medications.map((medication, index) => (
        <div
          key={index}
          data-field={`medication-${index}`}
          className="rounded-xl border border-slate-200 bg-slate-50/40 p-4"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_140px_140px_1fr_auto]">
            <FloatingInput
              label="Medication name"
              value={medication.name}
              onChange={(v) => onUpdate(index, "name", v)}
              onBlur={() => {}}
              disabled={disabled}
            />
            <FloatingInput
              label="Dosage"
              value={medication.dosage}
              onChange={(v) => onUpdate(index, "dosage", v)}
              onBlur={() => {}}
              disabled={disabled}
            />
            <FloatingInput
              label="Frequency"
              value={medication.frequency}
              onChange={(v) => onUpdate(index, "frequency", v)}
              onBlur={() => {}}
              disabled={disabled}
            />
            <FloatingInput
              label="Details"
              value={medication.details}
              onChange={(v) => onUpdate(index, "details", v)}
              onBlur={() => {}}
              disabled={disabled}
            />
            <button
              type="button"
              onClick={() => onRemove(index)}
              disabled={disabled}
              className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center self-start rounded-xl border border-red-200/60 bg-gradient-to-b from-red-50 to-red-100/80 text-red-600 transition-all hover:from-red-100 hover:to-red-200/90 disabled:opacity-50"
              title="Remove medication"
              aria-label="Remove medication"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}

      <Button type="button" variant="secondary" onClick={onAdd} disabled={disabled} className="gap-2 flex items-center">
        <Plus className="h-4 w-4" />
        Add medication
      </Button>
    </div>
  )
}
