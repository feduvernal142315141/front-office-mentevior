"use client"

import { Pill, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/custom/Button"
import { Checkbox } from "@/components/custom/Checkbox"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { CURRENT_MEDICATIONS_DENIED_DEFAULT_NOTE } from "@/lib/constants/assessment.constants"
import type { AssessmentMedicationInput } from "@/lib/types/assessment.types"

interface MedicationsSectionProps {
  medications: AssessmentMedicationInput[]
  /** Pinta el empty state en rojo cuando la sección exige al menos una fila */
  hasError?: boolean
  disabled?: boolean
  /** Contrato 2026-09-07: con la casilla marcada el PDF imprime la nota, no la tabla */
  denied: boolean
  note: string
  onDeniedChange: (denied: boolean) => void
  onNoteChange: (note: string) => void
  onAdd: () => void
  onRemove: (index: number) => void
  onUpdate: (index: number, field: keyof AssessmentMedicationInput, value: string) => void
}

export function MedicationsSection({
  medications,
  hasError,
  disabled,
  denied,
  note,
  onDeniedChange,
  onNoteChange,
  onAdd,
  onRemove,
  onUpdate,
}: MedicationsSectionProps) {
  const savedRows = medications.filter(
    (m) => m.name.trim() || m.dosage.trim() || m.frequency.trim() || m.details.trim(),
  ).length

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
        <Checkbox
          checked={denied}
          onCheckedChange={onDeniedChange}
          disabled={disabled}
          label="Caregiver denied any medications at this time"
          description="The PDF prints this note instead of the medications table."
        />

        {denied && (
          <div className="mt-4 space-y-2">
            <FloatingInput
              label="Note to print"
              value={note}
              onChange={onNoteChange}
              onBlur={() => {}}
              disabled={disabled}
            />
            <p className="text-xs text-slate-500">
              Leave it empty to print “{CURRENT_MEDICATIONS_DENIED_DEFAULT_NOTE}”.
            </p>
          </div>
        )}
      </div>

      {/*
        Con la casilla marcada la tabla no se edita, pero lo cargado no se borra:
        se avisa que sigue guardado, así destildar la casilla lo devuelve intacto.
      */}
      {denied ? (
        savedRows > 0 && (
          <p className="text-sm text-slate-500">
            {savedRows === 1
              ? "1 medication stays saved and is not printed while this is checked."
              : `${savedRows} medications stay saved and are not printed while this is checked.`}
          </p>
        )
      ) : (
        <>
      {medications.length === 0 && (
        <div className={`flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-8 ${hasError ? "border-red-300 bg-red-50/40" : "border-slate-200 bg-slate-50/60"}`}>
          <Pill className={`h-6 w-6 ${hasError ? "text-red-300" : "text-slate-300"}`} />
          <p className={`text-sm ${hasError ? "text-red-500" : "text-slate-500"}`}>No current medications added</p>
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
        </>
      )}
    </div>
  )
}
