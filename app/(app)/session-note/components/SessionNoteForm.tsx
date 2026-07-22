"use client"

import { useState } from "react"
import {
  BookOpen, AlertTriangle, Stethoscope,
  Target, BarChart3, User, Building2, ClipboardList, PenTool, CheckCircle2, PenLine,
} from "lucide-react"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingTextarea } from "@/components/custom/FloatingTextarea"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { PremiumSwitch } from "@/components/custom/PremiumSwitch"
import { MultiSelectWithSearch } from "@/components/custom/MultiSelectWithSearch"
import { Button } from "@/components/custom/Button"
import { FormBottomBar } from "@/components/custom/FormBottomBar"
import type { RecommendationCatalogItem } from "@/lib/types/client-service-plan.types"
import type { NoteStatus } from "@/lib/types/appointment-note.types"
import { deriveNoteStatusInfo } from "../hooks/useNoteStatus"
import type {
  AppointmentNoteCategory,
  AppointmentNoteRecipient,
  AppointmentNoteProvider,
  AppointmentNoteServiceDetails,
  AppointmentNoteModality,
  ParticipantCatalogItem,
} from "@/lib/types/appointment-note.types"
import { cn } from "@/lib/utils"
import { SignatureEditorModal } from "@/app/(app)/my-profile/manager/credentials-signature/components/SignatureEditorModal"
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
  serviceDetails: AppointmentNoteServiceDetails | null
  billingCodes: string | null
  modality: AppointmentNoteModality | null
  modalityOptions: { value: string; label: string }[]
  itemErrors?: Set<string>
  providerSignatureUrl?: string | null
  useCheckmarkSignature?: boolean
  caregiverSignatureChecked?: boolean
  onCaregiverCheckedChange?: (checked: boolean) => void
  onCaregiverSignatureChange?: (base64: string | null) => void
  caregiverSignatureImage?: string | null
  noteStatus?: NoteStatus
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
  serviceDetails,
  billingCodes,
  modality,
  modalityOptions,
  itemErrors,
  providerSignatureUrl,
  useCheckmarkSignature,
  caregiverSignatureChecked,
  onCaregiverCheckedChange,
  onCaregiverSignatureChange,
  caregiverSignatureImage,
  noteStatus = "read",
}: SessionNoteFormProps) {
  const statusInfo = deriveNoteStatusInfo(noteStatus, false)
  const formDisabled = !statusInfo.isFormEditable
  const dataCollectionDisabled = !statusInfo.isDataCollectionEditable
  const saveDisabled = !statusInfo.canSave

  const categoriesWithItems = categories.filter((c) => c.items.length > 0)
  const categoriesEmpty = categories.filter((c) => c.items.length === 0)

  const participantItems = participantCatalog.map((p) => ({ id: p.id, name: p.name }))

  return (
    <div className="space-y-5 pb-32">
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
                <div><span className="text-slate-400">Date of Birth:</span> <span className="font-medium text-slate-800">{recipient.dateOfBirth}</span></div>
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

      {/* ─── Service Details ─── */}
      {(serviceDetails || billingCodes || modality) && (
        <Section icon={<ClipboardList className="h-4 w-4" />} title="Service Details">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Date</span>
              <span className="text-sm font-medium text-slate-800">{serviceDetails?.date ?? "—"}</span>
            </div>
            <div>
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Place of Service</span>
              <span className="text-sm font-medium text-slate-800">{serviceDetails?.placeOfService ?? "—"}</span>
            </div>
            <div>
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Time In/Out</span>
              <span className="text-sm font-medium text-slate-800">{serviceDetails?.timeInOut ?? "—"}</span>
            </div>
            <div>
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Hours</span>
              <span className="text-sm font-medium text-slate-800">{serviceDetails?.hours ?? "—"}</span>
            </div>
            <div>
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Billing Codes</span>
              <span className="text-sm font-medium text-slate-800">{billingCodes ?? "—"}</span>
            </div>
          </div>
        </Section>
      )}

      {/* ─── Row 1: Teaching Method & Modality + Session Details ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Section icon={<BookOpen className="h-4 w-4" />} title="Teaching Method, Modality & Participants">
          <div className="space-y-4">
            <FloatingSelect
              label="Teaching Method"
              value={formData.teachingMethodId}
              onChange={(val) => updateField("teachingMethodId", val)}
              options={teachingMethodOptions}
              searchable
              disabled={isLoadingCatalogs || formDisabled}
            />
            <FloatingSelect
              label="Modality"
              value={formData.modalityId}
              onChange={(val) => updateField("modalityId", val)}
              options={modalityOptions}
              disabled={isLoadingCatalogs || formDisabled}
            />
            <MultiSelectWithSearch
              label="Participants"
              items={participantItems}
              selectedIds={formData.participantIds}
              onChange={(ids) => updateField("participantIds", ids)}
              disabled={isLoadingCatalogs || formDisabled}
            />
          </div>
        </Section>

        <Section icon={<Stethoscope className="h-4 w-4" />} title="Session Details">
          <div className="space-y-3">
            <FloatingInput label="Reason Caregiver Not Present" value={formData.reasonCaregiverNotPresent} onChange={(v) => updateField("reasonCaregiverNotPresent", v)} onBlur={() => {}} disabled={formDisabled} />
            <FloatingInput label="Medical Concerns" value={formData.medicalConcerns} onChange={(v) => updateField("medicalConcerns", v)} onBlur={() => {}} disabled={formDisabled} />
            <PremiumSwitch label="Crisis Involved" description="Was there a crisis during this session?" checked={formData.crisisInvolved} onCheckedChange={(v) => updateField("crisisInvolved", v)} compact disabled={formDisabled} />
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
                    itemErrors={itemErrors}
                    disabled={dataCollectionDisabled}
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

      {/* ─── Row 3: Interventions ─── */}
      <Section icon={<AlertTriangle className="h-4 w-4" />} title="Interventions">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <MultiSelectWithSearch label="Antecedent Interventions" items={antecedentItems} selectedIds={formData.antecedentInterventionIds} onChange={(ids) => updateField("antecedentInterventionIds", ids)} disabled={isLoadingCatalogs || formDisabled} />
          <MultiSelectWithSearch label="Consequence Interventions" items={consequenceItems} selectedIds={formData.consequenceInterventionIds} onChange={(ids) => updateField("consequenceInterventionIds", ids)} disabled={isLoadingCatalogs || formDisabled} />
        </div>
      </Section>

      {/* ─── Row 4: Session Summary (full width) ─── */}
      <Section icon={<BookOpen className="h-4 w-4" />} title="Session Summary">
        <FloatingTextarea label="Session Summary" value={formData.sessionSummary} onChange={(v) => updateField("sessionSummary", v)} onBlur={() => {}} rows={20} disabled={formDisabled} />
      </Section>

      {/* ─── Row 5: Signatures ─── */}
      <SignatureSection
        provider={provider}
        providerSignatureUrl={providerSignatureUrl}
        serviceDate={serviceDetails?.date}
        useCheckmarkSignature={useCheckmarkSignature}
        caregiverChecked={caregiverSignatureChecked}
        onCaregiverCheckedChange={onCaregiverCheckedChange}
        onCaregiverSignatureChange={onCaregiverSignatureChange}
        caregiverSignatureImage={caregiverSignatureImage}
        notCanEdit={formDisabled}
      />

      <FormBottomBar isSubmitting={isSaving} onCancel={() => window.history.back()} submitText={noteStatus === "read" ? "Save Data Collection" : "Save Session Note"} disabled={saveDisabled} />
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

function CategoryCard({ category, categoryItems, onValueChange, onEnvChangeChange, itemErrors, disabled }: {
  category: AppointmentNoteCategory
  categoryItems: Record<string, { value: number | null; environmentalChange: string }>
  onValueChange: (itemId: string, value: number | null) => void
  onEnvChangeChange: (itemId: string, text: string) => void
  itemErrors?: Set<string>
  disabled?: boolean
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
          const hasError = itemErrors?.has(item.id)
          return (
            <div key={item.id} className="px-4 py-3 space-y-2">
              <span className="text-sm font-medium text-slate-700 block">{item.name}</span>
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold uppercase text-slate-400">Value</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      data-item-value={item.id}
                      disabled={disabled}
                      value={currentValue ?? ""}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9.]/g, "")
                        onValueChange(item.id, raw === "" ? null : parseFloat(raw))
                      }}
                      placeholder="—"
                      className={cn(
                        "h-7 w-16 rounded-lg border bg-white text-center text-sm font-semibold tabular-nums text-slate-800 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400",
                        hasError
                          ? "border-red-400 ring-1 ring-red-200 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                          : "border-slate-200 focus:border-[#037ECC] focus:ring-2 focus:ring-[#037ECC]/15",
                      )}
                    />
                  </div>
                  {hasError && (
                    <span className="text-[10px] font-medium text-red-500">Value is required</span>
                  )}
                </div>
                <div className="flex-1 flex items-center gap-1.5 min-w-0">
                  <span className="text-[10px] font-semibold uppercase text-slate-400 shrink-0">Env.</span>
                  <input
                    type="text"
                    value={currentEnv}
                    disabled={disabled}
                    onChange={(e) => onEnvChangeChange(item.id, e.target.value)}
                    placeholder="Environmental change..."
                    className="h-7 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-[#037ECC] focus:ring-2 focus:ring-[#037ECC]/15 transition-all placeholder:text-slate-300 disabled:bg-slate-50 disabled:text-slate-400"
                  />
                </div>
                {item.type && (
                  <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700 shrink-0">
                    {item.type}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SignatureSection({ provider, providerSignatureUrl, serviceDate, useCheckmarkSignature, caregiverChecked, onCaregiverCheckedChange, onCaregiverSignatureChange, caregiverSignatureImage, notCanEdit }: {
  provider: AppointmentNoteProvider | null
  providerSignatureUrl?: string | null
  serviceDate?: string | null
  useCheckmarkSignature?: boolean
  caregiverChecked?: boolean
  onCaregiverCheckedChange?: (checked: boolean) => void
  onCaregiverSignatureChange?: (base64: string | null) => void
  caregiverSignatureImage?: string | null
  notCanEdit?: boolean
}) {
  const [editorOpen, setEditorOpen] = useState(false)

  const handleSaveSignature = (base64: string) => {
    onCaregiverSignatureChange?.(`data:image/png;base64,${base64}`)
  }

  return (
    <Section icon={<PenTool className="h-4 w-4" />} title="Signatures">
      <div className="space-y-4">
        {/* Certification text */}
        <p className="text-sm italic text-slate-600">
          By signing below, I certify that I provided the above services following all applicable policies and procedures
        </p>

        {/* ─── Document-style signature block ─── */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">

          {/* Row 1 — Provider */}
          <div className="grid grid-cols-2 border-b border-slate-100">
            {/* Provider name */}
            <div className="px-6 py-5 border-r border-slate-100">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Provider Name / Credential</span>
              <p className="text-sm font-semibold text-slate-800">{provider?.name ?? "—"}</p>
              {provider?.credential && (
                <p className="text-xs text-slate-500 mt-0.5">{provider.credential}</p>
              )}
            </div>
            {/* Provider signature */}
            <div className="px-6 py-5">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Signature</span>
              <div className="relative min-h-[64px] flex items-end pb-3">
                {providerSignatureUrl ? (
                  <img
                    src={providerSignatureUrl}
                    alt="Provider signature"
                    className="max-h-[52px] max-w-full object-contain"
                  />
                ) : (
                  <span className="text-xs text-slate-300 italic">No signature on file</span>
                )}
                <div className="absolute bottom-0 left-0 right-0 border-b border-slate-300/50" />
              </div>
            </div>
          </div>

          {/* Row 2 — Caregiver */}
          <div className="grid grid-cols-2 border-b border-slate-100">
            {/* Caregiver info */}
            <div className="px-6 py-5 border-r border-slate-100">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Caregiver</span>
              {useCheckmarkSignature ? (
                <label className="flex items-start gap-2.5 cursor-pointer group mt-1">
                  <input
                    type="checkbox"
                    checked={caregiverChecked ?? false}
                    onChange={(e) => onCaregiverCheckedChange?.(e.target.checked)}
                    disabled={notCanEdit}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#037ECC] focus:ring-[#037ECC]/20 cursor-pointer disabled:opacity-50"
                  />
                  <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">
                    Caregiver confirms participation in this session
                  </span>
                </label>
              ) : (
                <p className="text-sm text-slate-600 mt-1">Caregiver Signature</p>
              )}
            </div>
            {/* Caregiver signature */}
            <div className="px-6 py-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {useCheckmarkSignature ? "Confirmation" : "Signature"}
                </span>
                {!useCheckmarkSignature && !notCanEdit && (
                  <button
                    type="button"
                    onClick={() => setEditorOpen(true)}
                    className={cn(
                      "h-7 w-7 rounded-lg border border-slate-200 bg-white inline-flex items-center justify-center",
                      "text-slate-500 hover:text-[#037ECC] hover:border-[#037ECC]/40 transition-all duration-150",
                    )}
                    title="Edit signature"
                    aria-label="Edit caregiver signature"
                  >
                    <PenLine className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="relative min-h-[64px] flex items-end pb-3">
                {useCheckmarkSignature ? (
                  caregiverChecked ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      <span className="text-sm font-medium text-emerald-700">Confirmed</span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-300 italic">Pending confirmation</span>
                  )
                ) : caregiverSignatureImage ? (
                  <img
                    src={caregiverSignatureImage}
                    alt="Caregiver signature"
                    className="max-h-[52px] max-w-full object-contain"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => !notCanEdit && setEditorOpen(true)}
                    disabled={notCanEdit}
                    className="text-xs text-slate-300 italic hover:text-[#037ECC] transition-colors disabled:hover:text-slate-300"
                  >
                    Click to sign
                  </button>
                )}
                {!useCheckmarkSignature && (
                  <div className="absolute bottom-0 left-0 right-0 border-b border-slate-300/50" />
                )}
              </div>
            </div>
          </div>

          {/* Row 3 — Date */}
          <div className="px-6 py-4">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Date</span>
            <p className="text-sm font-semibold text-slate-800">{serviceDate ?? "—"}</p>
          </div>
        </div>

        {/* Signature Editor Modal (caregiver) */}
        {!useCheckmarkSignature && (
          <SignatureEditorModal
            open={editorOpen}
            onOpenChange={setEditorOpen}
            onSave={handleSaveSignature}
          />
        )}
      </div>
    </Section>
  )
}
