"use client"

import { useState } from "react"
import {
  Users, BookOpen, AlertTriangle, Stethoscope,
  Target, BarChart3, User, Building2, ClipboardList, PenTool, CheckCircle2,
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
  AppointmentNoteServiceDetails,
  AppointmentNoteModality,
  ParticipantCatalogItem,
} from "@/lib/types/appointment-note.types"
import { cn } from "@/lib/utils"
import { useSignaturePad } from "@/components/custom/SignaturePad"
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
}: SessionNoteFormProps) {
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
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
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Modality</span>
              <span className="text-sm font-medium text-slate-800">{modality?.name ?? "—"}</span>
            </div>
            <div>
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Billing Codes</span>
              <span className="text-sm font-medium text-slate-800">{billingCodes ?? "—"}</span>
            </div>
          </div>
        </Section>
      )}

      {/* ─── Row 1: Teaching Method + Modality + Session Details ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
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

        <Section icon={<ClipboardList className="h-4 w-4" />} title="Modality">
          <FloatingSelect
            label="Modality"
            value={formData.modalityId}
            onChange={(val) => updateField("modalityId", val)}
            options={modalityOptions}
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
                    itemErrors={itemErrors}
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
        <FloatingTextarea label="Session Summary" value={formData.sessionSummary} onChange={(v) => updateField("sessionSummary", v)} onBlur={() => {}} rows={20} />
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
      />

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

function CategoryCard({ category, categoryItems, onValueChange, onEnvChangeChange, itemErrors }: {
  category: AppointmentNoteCategory
  categoryItems: Record<string, { value: number | null; environmentalChange: string }>
  onValueChange: (itemId: string, value: number | null) => void
  onEnvChangeChange: (itemId: string, text: string) => void
  itemErrors?: Set<string>
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
                      value={currentValue ?? ""}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9.]/g, "")
                        onValueChange(item.id, raw === "" ? null : parseFloat(raw))
                      }}
                      placeholder="—"
                      className={cn(
                        "h-7 w-16 rounded-lg border bg-white text-center text-sm font-semibold tabular-nums text-slate-800 outline-none transition-all",
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
                    onChange={(e) => onEnvChangeChange(item.id, e.target.value)}
                    placeholder="Environmental change..."
                    className="h-7 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-[#037ECC] focus:ring-2 focus:ring-[#037ECC]/15 transition-all placeholder:text-slate-300"
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

function SignatureSection({ provider, providerSignatureUrl, serviceDate, useCheckmarkSignature, caregiverChecked, onCaregiverCheckedChange, onCaregiverSignatureChange, caregiverSignatureImage }: {
  provider: AppointmentNoteProvider | null
  providerSignatureUrl?: string | null
  serviceDate?: string | null
  useCheckmarkSignature?: boolean
  caregiverChecked?: boolean
  onCaregiverCheckedChange?: (checked: boolean) => void
  onCaregiverSignatureChange?: (base64: string | null) => void
  caregiverSignatureImage?: string | null
}) {
  return (
    <Section icon={<PenTool className="h-4 w-4" />} title="Signatures">
      <div className="space-y-6">
        {/* Certification text */}
        <p className="text-sm italic text-slate-600">
          By signing below, I certify that I provided the above services following all applicable policies and procedures
        </p>

        {/* Provider signature — read only */}
        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="min-h-[60px] flex flex-col justify-end">
              <p className="text-sm font-semibold text-slate-800">{provider?.name ?? "—"}</p>
              <p className="text-xs text-slate-500">{provider?.credential ?? ""}</p>
            </div>
            <div className="border-t border-slate-300" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Provider Name / Credential</span>
          </div>
          <div className="space-y-2">
            <div className="min-h-[60px] flex items-end justify-center">
              {providerSignatureUrl ? (
                <img src={providerSignatureUrl} alt="Provider signature" className="max-h-[56px] max-w-full object-contain" />
              ) : (
                <span className="text-xs text-slate-400 italic">No signature on file</span>
              )}
            </div>
            <div className="border-t border-slate-300" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Signature</span>
          </div>
          <div className="space-y-2">
            <div className="min-h-[60px] flex flex-col justify-end">
              <p className="text-sm font-semibold text-slate-800">{serviceDate ?? "—"}</p>
            </div>
            <div className="border-t border-slate-300" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Date</span>
          </div>
        </div>

        {/* Caregiver — checkmark mode */}
        {useCheckmarkSignature && (
          <div className="border-t border-slate-100 pt-5">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="h-4 w-4 text-[#037ECC]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Caregiver Confirmation</span>
            </div>
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={caregiverChecked ?? false}
                onChange={(e) => onCaregiverCheckedChange?.(e.target.checked)}
                className="mt-0.5 h-5 w-5 rounded border-slate-300 text-[#037ECC] focus:ring-[#037ECC]/20 cursor-pointer"
              />
              <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">
                Caregiver confirms participation in this session
              </span>
            </label>
          </div>
        )}

        {/* Caregiver — electronic signature mode */}
        {!useCheckmarkSignature && (
          <CaregiverSignaturePad savedImage={caregiverSignatureImage} onSignatureChange={onCaregiverSignatureChange} />
        )}
      </div>
    </Section>
  )
}

function CaregiverSignaturePad({ savedImage, onSignatureChange }: { savedImage?: string | null; onSignatureChange?: (base64: string | null) => void }) {
  const [forceRedraw, setForceRedraw] = useState(false)
  const showPad = forceRedraw || !savedImage
  const pad = useSignaturePad({
    onDrawEnd: () => {
      setTimeout(() => {
        onSignatureChange?.(pad.toDataURL("image/png"))
      }, 0)
    },
  })

  const handleClear = () => {
    pad.clear()
    onSignatureChange?.(null)
  }

  const handleReDraw = () => {
    setForceRedraw(true)
    onSignatureChange?.(null)
  }

  return (
    <div className="border-t border-slate-100 pt-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <PenTool className="h-4 w-4 text-[#037ECC]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Caregiver Signature</span>
        </div>
        <div className="flex items-center gap-3">
          {!showPad && savedImage && (
            <button type="button" onClick={handleReDraw} className="text-xs font-medium text-[#037ECC] hover:text-[#037ECC]/80 transition-colors">
              Re-sign
            </button>
          )}
          {showPad && pad.hasDrawn && (
            <button type="button" onClick={handleClear} className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Saved signature preview */}
      {!showPad && savedImage && (
        <div className="flex items-center justify-center rounded-2xl border-2 border-emerald-200 bg-white p-6" style={{ minHeight: "280px" }}>
          <img src={savedImage} alt="Caregiver signature" className="max-h-[240px] max-w-full object-contain" />
        </div>
      )}

      {/* Draw pad */}
      {showPad && (
        <div className="relative">
          <canvas
            ref={pad.canvasRef}
            className={cn(
              "rounded-2xl border-2 bg-white touch-none select-none cursor-crosshair transition-colors w-full",
              pad.hasDrawn ? "border-emerald-200" : "border-slate-200 hover:border-[#037ECC]/30",
            )}
            style={{ height: "280px" }}
          />
          {/* Signature line */}
          <div className="absolute bottom-12 left-10 right-10 border-b border-slate-300/50" />
          <div className="absolute bottom-8 left-10">
            <span className="text-[10px] text-slate-300 uppercase tracking-wider">Caregiver signature</span>
          </div>
          {!pad.hasDrawn && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-base text-slate-200 select-none tracking-wide">Sign here</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
