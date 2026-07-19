"use client"

import {
  Users, BookOpen, AlertTriangle, Stethoscope,
  Target, BarChart3, User, Building2,
} from "lucide-react"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingTextarea } from "@/components/custom/FloatingTextarea"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { PremiumSwitch } from "@/components/custom/PremiumSwitch"
import { MultiSelectWithSearch } from "@/components/custom/MultiSelectWithSearch"
import { Button } from "@/components/custom/Button"
import { FormBottomBar } from "@/components/custom/FormBottomBar"
import type { RecommendationCatalogItem } from "@/lib/types/client-service-plan.types"
import type {
  AppointmentNoteCategory,
  AppointmentNoteRecipient,
  AppointmentNoteProvider,
  ParticipantCatalogItem,
} from "@/lib/types/appointment-note.types"
import { cn } from "@/lib/utils"
import type { SessionNoteFormData } from "../hooks/useSessionNoteForm"

interface SessionNoteFormProps {
  formData: SessionNoteFormData
  updateField: <K extends keyof SessionNoteFormData>(field: K, value: SessionNoteFormData[K]) => void
  updateItemValue: (itemId: string, value: number | null) => void
  updateItemEnvironmentalChange: (itemId: string, text: string) => void
  isSaving: boolean
  isLoadingCatalogs: boolean
  teachingMethodOptions: { value: string; label: string }[]
  participantCatalog: ParticipantCatalogItem[]
  antecedentItems: RecommendationCatalogItem[]
  consequenceItems: RecommendationCatalogItem[]
  categories: AppointmentNoteCategory[]
  recipient: AppointmentNoteRecipient | null
  provider: AppointmentNoteProvider | null
  billingCodes: string | null
}

export function SessionNoteForm({
  formData,
  updateField,
  updateItemValue,
  updateItemEnvironmentalChange,
  isSaving,
  isLoadingCatalogs,
  teachingMethodOptions,
  participantCatalog,
  antecedentItems,
  consequenceItems,
  categories,
  recipient,
  provider,
  billingCodes,
}: SessionNoteFormProps) {
  const categoriesWithItems = categories.filter((c) => c.items.length > 0)
  const categoriesEmpty = categories.filter((c) => c.items.length === 0)

  const participantItems = participantCatalog.map((p) => ({ id: p.id, name: p.name }))

  return (
    <div className="space-y-5 pb-24">
      {/* ─── Context Header: Recipient + Provider ─── */}
      {(recipient || provider) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {recipient && (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm px-5 py-4">
              <div className="flex items-center gap-2 mb-3">
                <User className="h-4 w-4 text-[#037ECC]" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Recipient</span>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                <div><span className="text-slate-400">Name:</span> <span className="font-medium text-slate-800">{recipient.name}</span></div>
                <div><span className="text-slate-400">DOB:</span> <span className="font-medium text-slate-800">{recipient.dateOfBirth}</span></div>
                <div><span className="text-slate-400">Insurance:</span> <span className="font-medium text-slate-800">{recipient.insuranceNumber}</span></div>
                <div><span className="text-slate-400">Diagnosis:</span> <span className="font-medium text-slate-800">{recipient.diagnosis}</span></div>
              </div>
            </div>
          )}
          {provider && (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm px-5 py-4">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="h-4 w-4 text-[#037ECC]" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Provider</span>
                {billingCodes && (
                  <span className="ml-auto inline-flex items-center rounded-full bg-[#037ECC]/10 px-2.5 py-0.5 text-[10px] font-semibold text-[#037ECC]">
                    {billingCodes}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                <div><span className="text-slate-400">Name:</span> <span className="font-medium text-slate-800">{provider.name}</span></div>
                <div><span className="text-slate-400">Credential:</span> <span className="font-medium text-slate-800">{provider.credential}</span></div>
                <div><span className="text-slate-400">NPI:</span> <span className="font-medium text-slate-800">{provider.npi}</span></div>
                <div><span className="text-slate-400">MPI:</span> <span className="font-medium text-slate-800">{provider.mpi}</span></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Row 1: Teaching Method + Session Details (side by side) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Section icon={<BookOpen className="h-4 w-4" />} title="Teaching Method">
          <FloatingSelect
            label="Teaching Method"
            value={formData.teachingMethodId}
            onChange={(val) => updateField("teachingMethodId", val)}
            options={teachingMethodOptions}
            searchable
            disabled={isLoadingCatalogs}
          />
        </Section>

        <Section icon={<Stethoscope className="h-4 w-4" />} title="Session Details">
          <div className="space-y-3">
            <FloatingInput label="Reason Caregiver Not Present" value={formData.reasonCaregiverNotPresent} onChange={(v) => updateField("reasonCaregiverNotPresent", v)} onBlur={() => {}} />
            <FloatingInput label="Medical Concerns" value={formData.medicalConcerns} onChange={(v) => updateField("medicalConcerns", v)} onBlur={() => {}} />
            <PremiumSwitch label="Crisis Involved" description="Was there a crisis during this session?" checked={formData.crisisInvolved} onCheckedChange={(v) => updateField("crisisInvolved", v)} compact />
          </div>
        </Section>
      </div>

      {/* ─── Row 2: Goals & Programs (full width) ─── */}
      <Section icon={<Target className="h-4 w-4" />} title="Goals & Programs" subtitle="Data collection values from this session">
        {categories.length === 0 ? (
          <div className="flex items-center gap-3 py-4 text-sm text-slate-400">
            <BarChart3 className="h-4 w-4" />
            <span>No goals configured for this billing code</span>
          </div>
        ) : (
          <div className="space-y-2">
            {categoriesWithItems.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {categoriesWithItems.map((category) => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    categoryItems={formData.categoryItems}
                    onValueChange={updateItemValue}
                    onEnvChangeChange={updateItemEnvironmentalChange}
                  />
                ))}
              </div>
            )}
            {categoriesEmpty.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {categoriesEmpty.map((category) => (
                  <span key={category.id} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs text-slate-400">
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
        <Section icon={<Users className="h-4 w-4" />} title="Participants">
          <MultiSelectWithSearch
            label="Participants"
            items={participantItems}
            selectedIds={formData.participantIds}
            onChange={(ids) => updateField("participantIds", ids)}
            disabled={isLoadingCatalogs}
          />
        </Section>

        <Section icon={<AlertTriangle className="h-4 w-4" />} title="Interventions">
          <div className="space-y-3">
            <MultiSelectWithSearch label="Antecedent Interventions" items={antecedentItems} selectedIds={formData.antecedentInterventionIds} onChange={(ids) => updateField("antecedentInterventionIds", ids)} disabled={isLoadingCatalogs} />
            <MultiSelectWithSearch label="Consequence Interventions" items={consequenceItems} selectedIds={formData.consequenceInterventionIds} onChange={(ids) => updateField("consequenceInterventionIds", ids)} disabled={isLoadingCatalogs} />
          </div>
        </Section>
      </div>

      {/* ─── Row 4: Session Summary (full width) ─── */}
      <Section icon={<BookOpen className="h-4 w-4" />} title="Session Summary">
        <FloatingTextarea label="Session Summary" value={formData.sessionSummary} onChange={(v) => updateField("sessionSummary", v)} onBlur={() => {}} rows={4} />
      </Section>

      <FormBottomBar isSubmitting={isSaving} onCancel={() => window.history.back()} submitText="Save Session Note" />
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Section({ icon, title, subtitle, children }: { icon: React.ReactNode; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2.5 px-5 py-3 border-b border-slate-100">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#037ECC]/10 text-[#037ECC]">{icon}</div>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {subtitle && <span className="text-xs text-slate-400">{subtitle}</span>}
        </div>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  )
}

function CategoryCard({ category, categoryItems, onValueChange, onEnvChangeChange }: {
  category: AppointmentNoteCategory
  categoryItems: Record<string, { value: number | null; environmentalChange: string }>
  onValueChange: (itemId: string, value: number | null) => void
  onEnvChangeChange: (itemId: string, text: string) => void
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-white border-b border-slate-100">
        <BarChart3 className="h-3.5 w-3.5 text-[#037ECC]" />
        <span className="text-xs font-semibold text-slate-800 flex-1">{category.name}</span>
        <span className="inline-flex items-center justify-center rounded-full bg-[#037ECC]/10 text-[#037ECC] text-[10px] font-bold h-5 min-w-[20px] px-1.5">{category.items.length}</span>
      </div>
      <div className="divide-y divide-slate-100">
        {category.items.map((item) => {
          const edited = categoryItems[item.id]
          const currentValue = edited?.value ?? item.value
          const currentEnv = edited?.environmentalChange ?? item.environmentalChange ?? ""
          return (
            <div key={item.id} className="px-4 py-3 space-y-2">
              <span className="text-sm font-medium text-slate-700 block">{item.name}</span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold uppercase text-slate-400">Value</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={currentValue ?? ""}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9.]/g, "")
                      onValueChange(item.id, raw === "" ? null : parseFloat(raw))
                    }}
                    placeholder="—"
                    className="h-7 w-16 rounded-lg border border-slate-200 bg-white text-center text-sm font-semibold tabular-nums text-slate-800 outline-none focus:border-[#037ECC] focus:ring-2 focus:ring-[#037ECC]/15 transition-all"
                  />
                </div>
                <div className="flex-1 flex items-center gap-1.5 min-w-0">
                  <span className="text-[10px] font-semibold uppercase text-slate-400 shrink-0">Env.</span>
                  <input
                    type="text"
                    value={currentEnv}
                    onChange={(e) => onEnvChangeChange(item.id, e.target.value)}
                    placeholder="Environmental change..."
                    className="h-7 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-[#037ECC] focus:ring-2 focus:ring-[#037ECC]/15 transition-all placeholder:text-slate-300"
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

