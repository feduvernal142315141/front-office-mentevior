"use client"

import { Plus, Trash2, Users, BookOpen, AlertTriangle, Stethoscope } from "lucide-react"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingTextarea } from "@/components/custom/FloatingTextarea"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { PremiumSwitch } from "@/components/custom/PremiumSwitch"
import { MultiSelectWithSearch } from "@/components/custom/MultiSelectWithSearch"
import { Button } from "@/components/custom/Button"
import type { RecommendationCatalogItem } from "@/lib/types/client-service-plan.types"
import { cn } from "@/lib/utils"
import type { SessionNoteFormData } from "../hooks/useSessionNoteForm"
import type { AppointmentNoteParticipantPayload } from "@/lib/types/appointment-note.types"

interface SessionNoteFormProps {
  formData: SessionNoteFormData
  updateField: <K extends keyof SessionNoteFormData>(field: K, value: SessionNoteFormData[K]) => void
  addParticipant: (catalogId: string, catalogType: "Member User Type" | "Relationship") => void
  removeParticipant: (index: number) => void
  updateParticipantCatalogId: (index: number, catalogId: string) => void
  onSubmit: () => void
  isSaving: boolean
  isLoadingCatalogs: boolean
  teachingMethodItems: RecommendationCatalogItem[]
  memberUserTypeOptions: { value: string; label: string }[]
  relationshipOptions: { value: string; label: string }[]
  antecedentItems: RecommendationCatalogItem[]
  consequenceItems: RecommendationCatalogItem[]
}

export function SessionNoteForm({
  formData,
  updateField,
  addParticipant,
  removeParticipant,
  updateParticipantCatalogId,
  onSubmit,
  isSaving,
  isLoadingCatalogs,
  teachingMethodItems,
  memberUserTypeOptions,
  relationshipOptions,
  antecedentItems,
  consequenceItems,
}: SessionNoteFormProps) {
  return (
    <div className="space-y-8">
      {/* Teaching Methods */}
      <Section
        icon={<BookOpen className="h-5 w-5" />}
        title="Teaching Methods"
        description="Methods preconfigured from the client's service plan"
      >
        <MultiSelectWithSearch
          label="Teaching Methods"
          items={teachingMethodItems}
          selectedIds={formData.teachingMethodIds}
          onChange={(ids) => updateField("teachingMethodIds", ids)}
          disabled={isLoadingCatalogs}
        />
      </Section>

      {/* Participants */}
      <Section
        icon={<Users className="h-5 w-5" />}
        title="Participants"
        description="People present during the session"
      >
        <div className="space-y-3">
          {formData.participants.map((p, idx) => (
            <ParticipantRow
              key={idx}
              participant={p}
              index={idx}
              memberUserTypeOptions={memberUserTypeOptions}
              relationshipOptions={relationshipOptions}
              onChangeCatalogId={(catalogId) => updateParticipantCatalogId(idx, catalogId)}
              onRemove={() => removeParticipant(idx)}
            />
          ))}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              className="gap-1.5 text-sm h-9"
              onClick={() => addParticipant("", "Member User Type")}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Staff
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="gap-1.5 text-sm h-9"
              onClick={() => addParticipant("", "Relationship")}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Caregiver/Relation
            </Button>
          </div>
        </div>
      </Section>

      {/* Caregiver & Medical */}
      <Section
        icon={<Stethoscope className="h-5 w-5" />}
        title="Session Details"
        description="Caregiver presence, medical concerns, and crisis information"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FloatingInput
            label="Reason Caregiver Not Present"
            value={formData.reasonCaregiverNotPresent}
            onChange={(v) => updateField("reasonCaregiverNotPresent", v)}
            onBlur={() => {}}
          />
          <FloatingInput
            label="Medical Concerns"
            value={formData.medicalConcerns}
            onChange={(v) => updateField("medicalConcerns", v)}
            onBlur={() => {}}
          />
        </div>

        <div className="mt-4">
          <PremiumSwitch
            label="Crisis Involved"
            description="Was there a crisis during this session?"
            checked={formData.crisisInvolved}
            onCheckedChange={(v) => updateField("crisisInvolved", v)}
          />
        </div>
      </Section>

      {/* Interventions */}
      <Section
        icon={<AlertTriangle className="h-5 w-5" />}
        title="Interventions"
        description="Antecedent and consequence-based interventions used during the session"
      >
        <div className="space-y-4">
          <MultiSelectWithSearch
            label="Antecedent Interventions"
            items={antecedentItems}
            selectedIds={formData.antecedentInterventionIds}
            onChange={(ids) => updateField("antecedentInterventionIds", ids)}
            disabled={isLoadingCatalogs}
          />
          <MultiSelectWithSearch
            label="Consequence Interventions"
            items={consequenceItems}
            selectedIds={formData.consequenceInterventionIds}
            onChange={(ids) => updateField("consequenceInterventionIds", ids)}
            disabled={isLoadingCatalogs}
          />
        </div>
      </Section>

      {/* Session Summary */}
      <Section
        icon={<BookOpen className="h-5 w-5" />}
        title="Session Summary"
        description="Provide a detailed summary of the session"
      >
        <FloatingTextarea
          label="Session Summary"
          value={formData.sessionSummary}
          onChange={(v) => updateField("sessionSummary", v)}
          onBlur={() => {}}
          rows={6}
        />
      </Section>

      {/* Save button */}
      <div className="flex justify-end border-t border-slate-200 pt-6">
        <Button
          type="button"
          variant="primary"
          loading={isSaving}
          className="h-11 min-w-[200px]"
          onClick={onSubmit}
        >
          Save Session Note
        </Button>
      </div>
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Section({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#037ECC]/10 text-[#037ECC]">
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  )
}

function ParticipantRow({
  participant,
  index,
  memberUserTypeOptions,
  relationshipOptions,
  onChangeCatalogId,
  onRemove,
}: {
  participant: AppointmentNoteParticipantPayload
  index: number
  memberUserTypeOptions: { value: string; label: string }[]
  relationshipOptions: { value: string; label: string }[]
  onChangeCatalogId: (catalogId: string) => void
  onRemove: () => void
}) {
  const isMemberUserType = participant.catalogType === "Member User Type"
  const options = isMemberUserType ? memberUserTypeOptions : relationshipOptions
  const label = isMemberUserType ? "Staff Role" : "Relationship"

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <FloatingSelect
          label={`${label} #${index + 1}`}
          value={participant.catalogId}
          onChange={onChangeCatalogId}
          options={options}
          searchable
        />
      </div>
      <button
        type="button"
        onClick={onRemove}
        className={cn(
          "rounded-lg p-2 text-red-400 transition-colors",
          "hover:bg-red-50 hover:text-red-600",
        )}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}
