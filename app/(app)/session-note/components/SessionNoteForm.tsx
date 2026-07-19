"use client"

import {
  Plus, Trash2, Users, BookOpen, AlertTriangle, Stethoscope,
  Target, BarChart3,
} from "lucide-react"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingTextarea } from "@/components/custom/FloatingTextarea"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { PremiumSwitch } from "@/components/custom/PremiumSwitch"
import { MultiSelectWithSearch } from "@/components/custom/MultiSelectWithSearch"
import { Button } from "@/components/custom/Button"
import { FormBottomBar } from "@/components/custom/FormBottomBar"
import type { RecommendationCatalogItem } from "@/lib/types/client-service-plan.types"
import type { AppointmentNoteCategory, AppointmentNoteParticipantPayload } from "@/lib/types/appointment-note.types"
import { cn } from "@/lib/utils"
import type { SessionNoteFormData } from "../hooks/useSessionNoteForm"

interface SessionNoteFormProps {
  formData: SessionNoteFormData
  updateField: <K extends keyof SessionNoteFormData>(field: K, value: SessionNoteFormData[K]) => void
  addParticipant: (type: "memberUserType" | "relationship") => void
  removeParticipant: (index: number) => void
  updateParticipantValue: (index: number, value: string) => void
  isSaving: boolean
  isLoadingCatalogs: boolean
  teachingMethodOptions: { value: string; label: string }[]
  memberUserTypeOptions: { value: string; label: string }[]
  relationshipOptions: { value: string; label: string }[]
  antecedentItems: RecommendationCatalogItem[]
  consequenceItems: RecommendationCatalogItem[]
  categories: AppointmentNoteCategory[]
}

export function SessionNoteForm({
  formData,
  updateField,
  addParticipant,
  removeParticipant,
  updateParticipantValue,
  isSaving,
  isLoadingCatalogs,
  teachingMethodOptions,
  memberUserTypeOptions,
  relationshipOptions,
  antecedentItems,
  consequenceItems,
  categories,
}: SessionNoteFormProps) {
  const categoriesWithItems = categories.filter((c) => c.items.length > 0)
  const categoriesEmpty = categories.filter((c) => c.items.length === 0)

  return (
    <div className="space-y-5">
      {/* ─── Row 1: Teaching Method + Session Details (side by side) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Teaching Method */}
        <Section
          icon={<BookOpen className="h-4 w-4" />}
          title="Teaching Method"
        >
          <FloatingSelect
            label="Teaching Method"
            value={formData.teachingMethodId}
            onChange={(val) => updateField("teachingMethodId", val)}
            options={teachingMethodOptions}
            searchable
            disabled={isLoadingCatalogs}
          />
        </Section>

        {/* Session Details */}
        <Section
          icon={<Stethoscope className="h-4 w-4" />}
          title="Session Details"
        >
          <div className="space-y-3">
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
            <PremiumSwitch
              label="Crisis Involved"
              description="Was there a crisis during this session?"
              checked={formData.crisisInvolved}
              onCheckedChange={(v) => updateField("crisisInvolved", v)}
              compact
            />
          </div>
        </Section>
      </div>

      {/* ─── Row 2: Goals & Programs (full width) ─── */}
      <Section
        icon={<Target className="h-4 w-4" />}
        title="Goals & Programs"
        subtitle="Data collection values from this session"
      >
        {categories.length === 0 ? (
          <div className="flex items-center gap-3 py-4 text-sm text-slate-400">
            <BarChart3 className="h-4 w-4" />
            <span>No goals configured for this billing code</span>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Categories WITH items — show expanded */}
            {categoriesWithItems.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {categoriesWithItems.map((category) => (
                  <CategoryCard key={category.id} category={category} defaultOpen />
                ))}
              </div>
            )}

            {/* Categories WITHOUT items — collapsed row */}
            {categoriesEmpty.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {categoriesEmpty.map((category) => (
                  <span
                    key={category.id}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs text-slate-400"
                  >
                    <BarChart3 className="h-3 w-3" />
                    {category.name}
                    <span className="text-slate-300">0</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </Section>

      {/* ─── Row 3: Participants + Interventions (side by side) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Participants */}
        <Section
          icon={<Users className="h-4 w-4" />}
          title="Participants"
        >
          <div className="space-y-2">
            {formData.participants.map((p, idx) => (
              <ParticipantRow
                key={idx}
                participant={p}
                index={idx}
                memberUserTypeOptions={memberUserTypeOptions}
                relationshipOptions={relationshipOptions}
                onChangeValue={(val) => updateParticipantValue(idx, val)}
                onRemove={() => removeParticipant(idx)}
              />
            ))}

            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="secondary"
                className="gap-1.5 text-xs h-8"
                onClick={() => addParticipant("memberUserType")}
              >
                <Plus className="h-3 w-3" />
                Staff
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="gap-1.5 text-xs h-8"
                onClick={() => addParticipant("relationship")}
              >
                <Plus className="h-3 w-3" />
                Caregiver
              </Button>
            </div>
          </div>
        </Section>

        {/* Interventions */}
        <Section
          icon={<AlertTriangle className="h-4 w-4" />}
          title="Interventions"
        >
          <div className="space-y-3">
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
      </div>

      {/* ─── Row 4: Session Summary (full width) ─── */}
      <Section
        icon={<BookOpen className="h-4 w-4" />}
        title="Session Summary"
      >
        <FloatingTextarea
          label="Session Summary"
          value={formData.sessionSummary}
          onChange={(v) => updateField("sessionSummary", v)}
          onBlur={() => {}}
          rows={4}
        />
      </Section>

      {/* Fixed Bottom Bar */}
      <FormBottomBar
        isSubmitting={isSaving}
        onCancel={() => window.history.back()}
        submitText="Save Session Note"
      />
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Section({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2.5 px-5 py-3 border-b border-slate-100">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#037ECC]/10 text-[#037ECC]">
          {icon}
        </div>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {subtitle && <span className="text-xs text-slate-400">{subtitle}</span>}
        </div>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  )
}

function CategoryCard({
  category,
  defaultOpen,
}: {
  category: AppointmentNoteCategory
  defaultOpen?: boolean
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden">
      {/* Category header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-white border-b border-slate-100">
        <BarChart3 className="h-3.5 w-3.5 text-[#037ECC]" />
        <span className="text-xs font-semibold text-slate-800 flex-1">{category.name}</span>
        <span className="inline-flex items-center justify-center rounded-full bg-[#037ECC]/10 text-[#037ECC] text-[10px] font-bold h-5 min-w-[20px] px-1.5">
          {category.items.length}
        </span>
      </div>
      {/* Items */}
      <div className="divide-y divide-slate-100">
        {category.items.map((item) => (
          <div key={item.id} className="flex items-center justify-between px-4 py-2.5">
            <span className="text-sm text-slate-700">{item.name}</span>
            {item.value !== null ? (
              <span className="inline-flex items-center justify-center rounded-full bg-[#037ECC]/10 text-[#037ECC] text-xs font-bold tabular-nums h-6 min-w-[28px] px-2">
                {item.value}
              </span>
            ) : (
              <span className="text-xs text-slate-300">{"\u2014"}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function ParticipantRow({
  participant,
  index,
  memberUserTypeOptions,
  relationshipOptions,
  onChangeValue,
  onRemove,
}: {
  participant: AppointmentNoteParticipantPayload
  index: number
  memberUserTypeOptions: { value: string; label: string }[]
  relationshipOptions: { value: string; label: string }[]
  onChangeValue: (value: string) => void
  onRemove: () => void
}) {
  const isMemberUserType = participant.memberUserTypeId !== null
  const options = isMemberUserType ? memberUserTypeOptions : relationshipOptions
  const label = isMemberUserType ? "Staff Role" : "Relationship"
  const currentValue = isMemberUserType
    ? (participant.memberUserTypeId ?? "")
    : (participant.relationshipId ?? "")

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <FloatingSelect
          label={`${label} #${index + 1}`}
          value={currentValue}
          onChange={onChangeValue}
          options={options}
          searchable
        />
      </div>
      <button
        type="button"
        onClick={onRemove}
        className={cn(
          "rounded-lg p-1.5 text-red-400 transition-colors",
          "hover:bg-red-50 hover:text-red-600",
        )}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
