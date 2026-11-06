"use client"

import { useState } from "react"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/custom/Button"
import { CustomModal } from "@/components/custom/CustomModal"
import { Textarea } from "@/components/ui/textarea"
import type { AssessmentPreferenceRow } from "@/lib/types/assessment.types"

const FIELDS: Array<{ key: keyof AssessmentPreferenceRow; label: string }> = [
  { key: "people", label: "People" },
  { key: "tangibles", label: "Tangibles" },
  { key: "activities", label: "Activities" },
  { key: "social", label: "Social" },
  { key: "other", label: "Other" },
]

const EMPTY_ROW: AssessmentPreferenceRow = { people: "", tangibles: "", activities: "", social: "", other: "" }

interface PreferenceAssessmentSectionProps {
  rows: AssessmentPreferenceRow[]
  disabled?: boolean
  onAdd: () => void
  onRemove: (index: number) => void
  onUpdate: (index: number, field: keyof AssessmentPreferenceRow, value: string) => void
}

export function PreferenceAssessmentSection({ rows, disabled, onAdd, onRemove, onUpdate }: PreferenceAssessmentSectionProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(-1)
  const [draft, setDraft] = useState<AssessmentPreferenceRow>(EMPTY_ROW)

  const openAdd = () => {
    setEditingIndex(null)
    setDraft(EMPTY_ROW)
  }

  const openEdit = (index: number) => {
    setEditingIndex(index)
    setDraft({ ...rows[index] })
  }

  const save = () => {
    if (editingIndex === null) {
      onAdd()
      const newIndex = rows.length
      for (const field of FIELDS) onUpdate(newIndex, field.key, draft[field.key])
    } else {
      for (const field of FIELDS) onUpdate(editingIndex, field.key, draft[field.key])
    }
    setEditingIndex(-1)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" variant="secondary" onClick={openAdd} disabled={disabled} className="gap-2">
          <Plus className="h-4 w-4" /> Add record
        </Button>
      </div>

      <div className="relative overflow-x-auto rounded-2xl border border-slate-200/60 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.03),0_1px_2px_rgba(15,23,42,0.02)]">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-slate-200/80 bg-gradient-to-b from-[#037ECC]/[0.04] to-[#037ECC]/[0.02]">
              {FIELDS.map((field) => <th key={field.key} className="h-14 border-r border-slate-200/60 px-6 text-left text-xs font-semibold uppercase tracking-[0.02em] text-[#037ECC] last:border-r-0">{field.label}</th>)}
              <th className="h-14 w-24 px-4 text-center text-xs font-semibold uppercase tracking-[0.02em] text-[#037ECC]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">No preference assessment records added.</td></tr>
            ) : rows.map((row, index) => (
              <tr key={index} className="group/row border-b border-slate-100/80 align-top transition-colors last:border-b-0 hover:bg-slate-50/50">
                {FIELDS.map((field) => <td key={field.key} className="whitespace-pre-wrap border-r border-slate-100 px-6 py-4 text-sm text-slate-700 last:border-r-0">{row[field.key] || "—"}</td>)}
                <td className="px-4 py-3"><div className="flex justify-center gap-1"><button type="button" onClick={() => openEdit(index)} disabled={disabled} className="rounded-lg p-2 text-[#037ECC] transition-colors hover:bg-sky-50 disabled:opacity-50" title="Edit record" aria-label="Edit record"><Pencil className="h-4 w-4" /></button><button type="button" onClick={() => onRemove(index)} disabled={disabled} className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50" title="Delete record" aria-label="Delete record"><Trash2 className="h-4 w-4" /></button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CustomModal open={editingIndex !== -1} onOpenChange={(open) => !open && setEditingIndex(-1)} title={editingIndex === null ? "Add preference assessment record" : "Edit preference assessment record"} description="All fields are optional." maxWidthClassName="sm:max-w-[760px]">
        <div className="grid grid-cols-1 gap-4 p-6">
          {FIELDS.map((field) => <label key={field.key} className="space-y-2 text-sm font-medium text-slate-700"><span>{field.label}</span><Textarea rows={4} value={draft[field.key]} onChange={(event) => setDraft((prev) => ({ ...prev, [field.key]: event.target.value }))} placeholder={`Enter ${field.label.toLowerCase()}`} /></label>)}
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4"><Button type="button" variant="ghost" onClick={() => setEditingIndex(-1)}>Cancel</Button><Button type="button" onClick={save}>{editingIndex === null ? "Add record" : "Save changes"}</Button></div>
      </CustomModal>
    </div>
  )
}
