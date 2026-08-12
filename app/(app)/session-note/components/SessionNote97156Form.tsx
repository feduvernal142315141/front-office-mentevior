"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import {
  AlertTriangle, BookOpen, Stethoscope, Users2, User, Building2, ClipboardList,
  PenTool, CheckCircle2, PenLine, FileText, Heart, Target, BarChart3,
} from "lucide-react"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingTextarea } from "@/components/custom/FloatingTextarea"
import { AiImprovableTextarea } from "@/components/custom/AiImprovableTextarea"
import { buildSessionSummaryMetadata97156 } from "@/lib/modules/appointment-notes/utils/ai-summary-metadata"
import { SESSION_NOTE_GUIDANCE } from "@/lib/constants/session-note-guidance"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { PremiumSwitch } from "@/components/custom/PremiumSwitch"
import { MultiSelectWithSearch } from "@/components/custom/MultiSelectWithSearch"
import { FormBottomBar } from "@/components/custom/FormBottomBar"
import { cn } from "@/lib/utils"
import { formatHoursAndUnits, splitBillingCodesAndUnits } from "@/lib/utils/session-note-units"
import { SignatureEditorModal } from "@/app/(app)/my-profile/manager/credentials-signature/components/SignatureEditorModal"
import { CLIENT_PARTICIPANT_ID } from "../hooks/useSessionNoteForm"
import { deriveNoteStatusInfo } from "../hooks/useNoteStatus"
import type { SessionNote97156FormData } from "@/lib/types/appointment-note-97156.types"
import type { InterventionCatalog97156Item } from "@/lib/modules/appointment-notes/services/97156-intervention-catalog.service"
import type { AppointmentNoteCategory, ParticipantCatalogItem, NoteStatus } from "@/lib/types/appointment-note.types"
import { SessionItemChartPanel } from "./SessionItemChartPanel"

interface CaregiverOption {
  id: string
  name: string
  relationship: string
}

interface SessionNote97156FormProps {
  formData: SessionNote97156FormData
  updateField: <K extends keyof SessionNote97156FormData>(field: K, value: SessionNote97156FormData[K]) => void
  updateItemValue: (itemId: string, value: number | null) => void
  updateItemEnvironmentalChange: (itemId: string, text: string) => void
  isSaving: boolean
  isLoadingCatalogs: boolean
  teachingMethodOptions: { value: string; label: string }[]
  modalityOptions: { value: string; label: string }[]
  participantCatalog: ParticipantCatalogItem[]
  interventionCatalog: InterventionCatalog97156Item[]
  caregiverOptions: CaregiverOption[]
  categories: AppointmentNoteCategory[]
  recipient: { name: string; dateOfBirth: string; insuranceNumber: string; diagnosis: string } | null
  provider: { name: string; credential: string; npi: string; mpi: string; sign: string } | null
  serviceDetails: { date: string | null; placeOfService: string | null; timeInOut: string | null; hours: string | null } | null
  billingCodes: string | null
  errors?: Record<string, string>
  itemErrors?: Set<string>
  providerSignatureUrl?: string | null
  onProviderSignatureChange?: (base64: string | null) => void
  useCheckmarkSignature?: boolean
  caregiverSignatureChecked?: boolean
  onCaregiverCheckedChange?: (checked: boolean) => void
  onCaregiverSignatureChange?: (base64: string | null) => void
  caregiverSignatureImage?: string | null
  caregiverSignatureOptions?: { value: string; label: string }[]
  clientCaregiverId?: string
  onClientCaregiverChange?: (id: string) => void
  caregiversClientId?: string | null
  caregiversLoading?: boolean
  noteStatus?: NoteStatus
  appointmentId?: string | null
}

export function SessionNote97156Form({
  formData,
  updateField,
  updateItemValue,
  updateItemEnvironmentalChange,
  isSaving,
  isLoadingCatalogs,
  teachingMethodOptions,
  modalityOptions,
  participantCatalog,
  interventionCatalog,
  caregiverOptions,
  categories,
  recipient,
  provider,
  serviceDetails,
  billingCodes,
  errors = {},
  itemErrors,
  providerSignatureUrl,
  onProviderSignatureChange,
  useCheckmarkSignature,
  caregiverSignatureChecked,
  onCaregiverCheckedChange,
  onCaregiverSignatureChange,
  caregiverSignatureImage,
  caregiverSignatureOptions,
  clientCaregiverId,
  onClientCaregiverChange,
  caregiversClientId,
  caregiversLoading,
  noteStatus = "read",
  appointmentId,
}: SessionNote97156FormProps) {
  const statusInfo = deriveNoteStatusInfo(noteStatus, false)
  const formDisabled = !statusInfo.isFormEditable
  const dataCollectionDisabled = !statusInfo.isDataCollectionEditable
  const saveDisabled = !statusInfo.canSave

  const categoriesWithItems = categories.filter((c) => c.items.length > 0)
  const categoriesEmpty = categories.filter((c) => c.items.length === 0)

  const [activeChartItems, setActiveChartItems] = useState<Record<string, string>>({})
  const handleItemFocus = useCallback((categoryId: string, itemId: string) => {
    setActiveChartItems((prev) => ({ ...prev, [categoryId]: itemId }))
  }, [])

  const participantItems = participantCatalog.map((p) => ({ id: p.id, name: p.name }))

  // Las unidades llegan pegadas al string de billing codes; en Service Details
  // van junto a las horas, no junto al código.
  const { label: billingCodeLabel, units: billingCodeUnits } = splitBillingCodesAndUnits(billingCodes)
  const caregiverItems = caregiverOptions.map((c) => ({
    id: c.id,
    name: c.relationship ? `${c.name} (${c.relationship})` : c.name,
  }))

  const buildSummaryMetadata = () => {
    const namesFromIds = (ids: string[], items: { id: string; name: string }[]) =>
      ids.map((id) => items.find((i) => i.id === id)?.name).filter((n): n is string => !!n)
    // El ejemplo del backend manda la relación ("Parent"), no el nombre del cuidador — evita PII innecesaria.
    const caregiverNames = formData.caregiverIds
      .map((id) => caregiverOptions.find((c) => c.id === id))
      .filter((c): c is CaregiverOption => !!c)
      .map((c) => c.relationship || c.name)

    return buildSessionSummaryMetadata97156({
      teachingMethodName: teachingMethodOptions.find((o) => o.value === formData.teachingMethodId)?.label ?? "",
      modalityName: modalityOptions.find((o) => o.value === formData.modalityId)?.label ?? "",
      reasonCaregiverNotPresent: formData.reasonCaregiverNotPresent,
      medicalConcerns: formData.medicalConcerns,
      crisisInvolved: formData.crisisInvolved,
      caregiverNames,
      clientPresent: formData.clientPresent,
      interventionNames: namesFromIds(formData.interventionIds, interventionCatalog),
      goals: formData.goals,
      participantNames: namesFromIds(formData.participantIds, participantCatalog),
      categories,
      categoryItems: formData.categoryItems,
    })
  }

  const toggleIntervention = (id: string) => {
    const current = formData.interventionIds
    if (current.includes(id)) {
      updateField("interventionIds", current.filter((i) => i !== id))
    } else {
      updateField("interventionIds", [...current, id])
    }
  }

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
      {(serviceDetails || billingCodes) && (
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
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Hours / Units</span>
              <span className="text-sm font-medium text-slate-800">{formatHoursAndUnits(serviceDetails?.hours, billingCodeUnits)}</span>
            </div>
            <div>
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Billing Codes</span>
              <span className="text-sm font-medium text-slate-800">{billingCodeLabel || "—"}</span>
            </div>
          </div>
        </Section>
      )}

      {/* ─── Teaching Method, Modality & Participants + Session Details ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Section icon={<BookOpen className="h-4 w-4" />} title="Teaching Method, Modality & Participants">
          <div className="space-y-4">
            <div data-field="teachingMethodId">
              <FloatingSelect
                label="Teaching Method"
                value={formData.teachingMethodId}
                onChange={(val) => updateField("teachingMethodId", val)}
                options={teachingMethodOptions}
                searchable
                disabled={isLoadingCatalogs || formDisabled}
                hasError={!!errors.teachingMethodId}
                required
              />
              <FieldError message={errors.teachingMethodId} />
            </div>
            <div data-field="modalityId">
              <FloatingSelect
                label="Modality"
                value={formData.modalityId}
                onChange={(val) => updateField("modalityId", val)}
                options={modalityOptions}
                disabled={isLoadingCatalogs || formDisabled}
                hasError={!!errors.modalityId}
                required
              />
              <FieldError message={errors.modalityId} />
            </div>
            <div data-field="participantIds">
              <MultiSelectWithSearch
                label="Participants"
                items={participantItems}
                selectedIds={formData.participantIds}
                onChange={(ids) => updateField("participantIds", ids)}
                disabled={isLoadingCatalogs || formDisabled}
                hasError={!!errors.participantIds}
                required
                lockedIds={[CLIENT_PARTICIPANT_ID]}
              />
              <FieldError message={errors.participantIds} />
            </div>
          </div>
        </Section>

        <Section icon={<Stethoscope className="h-4 w-4" />} title="Session Details">
          <div className="space-y-3">
            <div data-field="reasonCaregiverNotPresent">
              <FloatingInput label="Reason Caregiver Not Present" value={formData.reasonCaregiverNotPresent} onChange={(v) => updateField("reasonCaregiverNotPresent", v)} onBlur={() => {}} disabled={formDisabled} hasError={!!errors.reasonCaregiverNotPresent} required />
              <FieldError message={errors.reasonCaregiverNotPresent} />
            </div>
            <div data-field="medicalConcerns">
              <FloatingInput label="Medical Concerns" value={formData.medicalConcerns} onChange={(v) => updateField("medicalConcerns", v)} onBlur={() => {}} disabled={formDisabled} hasError={!!errors.medicalConcerns} required />
              <FieldError message={errors.medicalConcerns} />
            </div>
            <PremiumSwitch label="Crisis Involved" description="Was there a crisis during this session?" checked={formData.crisisInvolved} onCheckedChange={(v) => updateField("crisisInvolved", v)} compact disabled={formDisabled} />
          </div>
        </Section>
      </div>

      {/* ─── Goals & Programs (Data Collection) ─── */}
      <Section icon={<Target className="h-4 w-4" />} title="Goals & Programs" subtitle="Data collection values from this session">
        {categories.length === 0 ? (
          <div className="flex items-center gap-3 py-4 text-sm text-slate-400">
            <BarChart3 className="h-4 w-4" />
            <span>No goals configured for this billing code</span>
          </div>
        ) : (
          <div className="space-y-4">
            {categoriesWithItems.length > 0 && (
              <div className="space-y-4">
                {categoriesWithItems.map((category) => (
                  <div key={category.id} className="grid grid-cols-1 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)] gap-4 items-start">
                    <CategoryCard
                      category={category}
                      categoryItems={formData.categoryItems}
                      onValueChange={updateItemValue}
                      onEnvChangeChange={updateItemEnvironmentalChange}
                      itemErrors={itemErrors}
                      disabled={dataCollectionDisabled}
                      activeItemId={activeChartItems[category.id]}
                      onItemFocus={(itemId) => handleItemFocus(category.id, itemId)}
                    />
                    <SessionItemChartPanel
                      category={category}
                      categoryItems={formData.categoryItems}
                      appointmentDate={serviceDetails?.date ?? null}
                      appointmentId={appointmentId ?? null}
                      activeItemId={activeChartItems[category.id]}
                      onActiveItemChange={(itemId) => handleItemFocus(category.id, itemId)}
                    />
                  </div>
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

      {/* ─── Session Participants: Caregivers + Client Present ─── */}
      <Section icon={<Heart className="h-4 w-4" />} title="Session Participants">
        <div className="space-y-4">
          <div data-field="caregiverIds">
            <MultiSelectWithSearch
              label="Parent(s)/Caregiver(s) Present"
              items={caregiverItems}
              selectedIds={formData.caregiverIds}
              onChange={(ids) => updateField("caregiverIds", ids)}
              disabled={isLoadingCatalogs || formDisabled}
              hasError={!!errors.caregiverIds}
              required
            />
            <FieldError message={errors.caregiverIds} />
          </div>
          <PremiumSwitch
            label="Client Present"
            description="Was the client present during this session?"
            checked={formData.clientPresent}
            onCheckedChange={(v) => updateField("clientPresent", v)}
            compact
            disabled={formDisabled}
          />
        </div>
      </Section>

      {/* ─── Interventions (checkboxes) ─── */}
      <Section icon={<Users2 className="h-4 w-4" />} title="Interventions">
        <div data-field="interventionIds">
          <p className="text-sm text-slate-600 mb-4">
            The interventions used to implement the protocol during the session are indicated by the checked boxes below:
          </p>
          <div className="space-y-2.5">
            {interventionCatalog.map((item) => {
              const checked = formData.interventionIds.includes(item.id)
              return (
                <label
                  key={item.id}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-all",
                    checked
                      ? "border-[#037ECC] bg-[#037ECC]/[0.06] shadow-sm shadow-[#037ECC]/10"
                      : "border-slate-200 hover:border-[#037ECC]/30 hover:bg-[#037ECC]/[0.02] bg-white",
                    formDisabled && "opacity-60 cursor-not-allowed",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => !formDisabled && toggleIntervention(item.id)}
                    disabled={formDisabled}
                    className="h-4 w-4 rounded border-slate-300 text-[#037ECC] focus:ring-[#037ECC]/20 cursor-pointer disabled:opacity-50"
                  />
                  <span className={cn("text-sm", checked ? "text-slate-900 font-medium" : "text-slate-600")}>
                    {item.name}
                  </span>
                </label>
              )
            })}
          </div>
          <FieldError message={errors.interventionIds} />
        </div>
      </Section>

      {/* ─── Session Summary ─── */}
      <Section icon={<FileText className="h-4 w-4" />} title="Session Summary">
        <div className="space-y-4">
          <div data-field="goals">
            <FloatingTextarea
              label="Goals"
              value={formData.goals}
              onChange={(v) => updateField("goals", v)}
              onBlur={() => {}}
              rows={4}
              disabled={formDisabled}
              hasError={!!errors.goals}
              required
            />
            <FieldError message={errors.goals} />
          </div>
          <div data-field="sessionSummary">
            <AiImprovableTextarea
              label="Summary"
              value={formData.sessionSummary}
              onChange={(v) => updateField("sessionSummary", v)}
              onBlur={() => {}}
              guidance={SESSION_NOTE_GUIDANCE["97156"].sessionSummary}
              rows={14}
              showLengthCounter
              disabled={formDisabled}
              hasError={!!errors.sessionSummary}
              required
              billingCode="97156"
              buildMetadata={buildSummaryMetadata}
            />
            <FieldError message={errors.sessionSummary} />
          </div>
        </div>
      </Section>

      {/* ─── Signatures ─── */}
      <SignatureSection
        provider={provider}
        providerSignatureUrl={providerSignatureUrl}
        onProviderSignatureChange={onProviderSignatureChange}
        serviceDate={serviceDetails?.date}
        useCheckmarkSignature={useCheckmarkSignature}
        caregiverChecked={caregiverSignatureChecked}
        onCaregiverCheckedChange={onCaregiverCheckedChange}
        onCaregiverSignatureChange={onCaregiverSignatureChange}
        caregiverSignatureImage={caregiverSignatureImage}
        caregiverOptions={caregiverSignatureOptions}
        clientCaregiverId={clientCaregiverId}
        onClientCaregiverChange={onClientCaregiverChange}
        clientCaregiverError={errors.clientCaregiverId}
        caregiversEmpty={!caregiversLoading && caregiverSignatureOptions != null && caregiverSignatureOptions.length === 0}
        caregiversProfileHref={caregiversClientId ? `/clients/${caregiversClientId}/profile?step=caregivers` : undefined}
        notCanEdit={formDisabled}
      />

      <FormBottomBar isSubmitting={isSaving} onCancel={() => window.history.back()} submitText={noteStatus === "read" ? "Save Data" : "Save Session Note"} disabled={saveDisabled} />
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1.5 text-xs text-red-500">{message}</p>
}

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

function CategoryCard({ category, categoryItems, onValueChange, onEnvChangeChange, itemErrors, disabled, activeItemId, onItemFocus }: {
  category: AppointmentNoteCategory
  categoryItems: Record<string, { value: number | null; environmentalChange: string }>
  onValueChange: (itemId: string, value: number | null) => void
  onEnvChangeChange: (itemId: string, text: string) => void
  itemErrors?: Set<string>
  disabled?: boolean
  activeItemId?: string
  onItemFocus?: (itemId: string) => void
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden self-start">
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
          const isActive = activeItemId === item.id
          return (
            <div
              key={item.id}
              className={cn(
                "px-4 py-3 space-y-2 transition-colors cursor-pointer",
                isActive && "bg-[#037ECC]/[0.03] border-l-2 border-l-[#037ECC]",
              )}
              onClick={() => onItemFocus?.(item.id)}
            >
              <span className={cn("text-sm font-medium block", isActive ? "text-[#037ECC]" : "text-slate-700")}>{item.name}</span>
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold uppercase text-slate-400">Value <span className="text-[#037ECC]">*</span></span>
                    <input
                      type="text"
                      inputMode="numeric"
                      data-item-value={item.id}
                      disabled={disabled}
                      value={currentValue ?? ""}
                      onFocus={() => onItemFocus?.(item.id)}
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
                    onFocus={() => onItemFocus?.(item.id)}
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

function SignatureSection({ provider, providerSignatureUrl, onProviderSignatureChange, serviceDate, useCheckmarkSignature, caregiverChecked, onCaregiverCheckedChange, onCaregiverSignatureChange, caregiverSignatureImage, caregiverOptions, clientCaregiverId, onClientCaregiverChange, clientCaregiverError, caregiversEmpty, caregiversProfileHref, notCanEdit }: {
  provider: { name: string; credential: string; npi: string; mpi: string; sign: string } | null
  providerSignatureUrl?: string | null
  onProviderSignatureChange?: (base64: string | null) => void
  serviceDate?: string | null
  useCheckmarkSignature?: boolean
  caregiverChecked?: boolean
  onCaregiverCheckedChange?: (checked: boolean) => void
  onCaregiverSignatureChange?: (base64: string | null) => void
  caregiverSignatureImage?: string | null
  caregiverOptions?: { value: string; label: string }[]
  clientCaregiverId?: string
  onClientCaregiverChange?: (id: string) => void
  clientCaregiverError?: string
  caregiversEmpty?: boolean
  caregiversProfileHref?: string
  notCanEdit?: boolean
}) {
  const [editorOpen, setEditorOpen] = useState(false)
  const [providerEditorOpen, setProviderEditorOpen] = useState(false)

  const handleSaveSignature = (base64: string) => {
    onCaregiverSignatureChange?.(`data:image/png;base64,${base64}`)
  }

  const handleSaveProviderSignature = (base64: string) => {
    onProviderSignatureChange?.(`data:image/png;base64,${base64}`)
    setProviderEditorOpen(false)
  }

  return (
    <Section icon={<PenTool className="h-4 w-4" />} title="Signatures">
      <div className="space-y-4">
        <p className="text-sm italic text-slate-600">
          By signing below, I certify that I provided the above services following all applicable policies and procedures
        </p>

        <div className="rounded-2xl border border-[#037ECC]/20 bg-white overflow-hidden">
          {/* Row 1 — Provider */}
          <div className="grid grid-cols-2 border-b border-[#037ECC]/10">
            <div className="px-6 py-5 border-r border-[#037ECC]/10">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#037ECC]/70 mb-2">Provider Name / Credential</span>
              <p className="text-sm font-semibold text-slate-800">{provider?.name ?? "—"}</p>
              {provider?.credential && <p className="text-xs text-slate-500 mt-0.5">{provider.credential}</p>}
            </div>
            <div className="px-6 py-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#037ECC]/70">Signature</span>
                {!notCanEdit && (
                  <button type="button" onClick={() => setProviderEditorOpen(true)} className={cn("h-7 w-7 rounded-lg border border-slate-200 bg-white inline-flex items-center justify-center", "text-slate-500 hover:text-[#037ECC] hover:border-[#037ECC]/40 transition-all duration-150")} title="Edit signature" aria-label="Edit provider signature">
                    <PenLine className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="relative min-h-[64px] flex items-end pb-3">
                {providerSignatureUrl ? (
                  <img src={providerSignatureUrl} alt="Provider signature" className="max-h-[52px] max-w-full object-contain contrast-150 brightness-50" />
                ) : (
                  <button type="button" onClick={() => !notCanEdit && setProviderEditorOpen(true)} disabled={notCanEdit} className="text-xs text-slate-300 italic hover:text-[#037ECC] transition-colors disabled:hover:text-slate-300">Click to sign</button>
                )}
                <div className="absolute bottom-0 left-0 right-0 border-b border-[#037ECC]/20" />
              </div>
            </div>
          </div>

          {/* Row 2 — Caregiver */}
          <div className="grid grid-cols-2 border-b border-[#037ECC]/10">
            <div className="px-6 py-5 border-r border-[#037ECC]/10">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#037ECC]/70 mb-2">Caregiver</span>
              <div className="mb-3" data-field="clientCaregiverId">
                {caregiversEmpty ? (
                  <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <p className="text-sm text-amber-800">
                      This client has no caregivers configured.{" "}
                      {caregiversProfileHref ? (
                        <Link href={caregiversProfileHref} className="font-semibold underline hover:text-amber-900">
                          Add them in the client profile
                        </Link>
                      ) : (
                        "Add them in the client profile to enable the caregiver signature."
                      )}
                    </p>
                  </div>
                ) : (
                  <FloatingSelect
                    label="Caregiver Name"
                    value={clientCaregiverId ?? ""}
                    onChange={(id) => onClientCaregiverChange?.(id)}
                    options={caregiverOptions ?? []}
                    searchable
                    disabled={notCanEdit}
                    hasError={!!clientCaregiverError}
                    required={useCheckmarkSignature ? !!caregiverChecked : !!caregiverSignatureImage}
                  />
                )}
                <FieldError message={clientCaregiverError} />
              </div>
              {useCheckmarkSignature ? (
                <label className="flex items-start gap-2.5 cursor-pointer group mt-1">
                  <input type="checkbox" checked={caregiverChecked ?? false} onChange={(e) => onCaregiverCheckedChange?.(e.target.checked)} disabled={notCanEdit} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#037ECC] focus:ring-[#037ECC]/20 cursor-pointer disabled:opacity-50" />
                  <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">Caregiver confirms participation in this session</span>
                </label>
              ) : (
                <p className="text-sm text-slate-600 mt-1">Caregiver Signature</p>
              )}
            </div>
            <div className="px-6 py-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#037ECC]/70">{useCheckmarkSignature ? "Confirmation" : "Signature"}</span>
                {!useCheckmarkSignature && !notCanEdit && (
                  <button type="button" onClick={() => setEditorOpen(true)} className={cn("h-7 w-7 rounded-lg border border-slate-200 bg-white inline-flex items-center justify-center", "text-slate-500 hover:text-[#037ECC] hover:border-[#037ECC]/40 transition-all duration-150")} title="Edit signature" aria-label="Edit caregiver signature">
                    <PenLine className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="relative min-h-[64px] flex items-end pb-3">
                {useCheckmarkSignature ? (
                  caregiverChecked ? (
                    <div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-500" /><span className="text-sm font-medium text-emerald-700">Confirmed</span></div>
                  ) : (
                    <span className="text-xs text-slate-300 italic">Pending confirmation</span>
                  )
                ) : caregiverSignatureImage ? (
                  <img src={caregiverSignatureImage} alt="Caregiver signature" className="max-h-[52px] max-w-full object-contain contrast-150 brightness-50" />
                ) : (
                  <button type="button" onClick={() => !notCanEdit && setEditorOpen(true)} disabled={notCanEdit} className="text-xs text-slate-300 italic hover:text-[#037ECC] transition-colors disabled:hover:text-slate-300">Click to sign</button>
                )}
                {!useCheckmarkSignature && <div className="absolute bottom-0 left-0 right-0 border-b border-[#037ECC]/20" />}
              </div>
            </div>
          </div>

          {/* Row 3 — Date */}
          <div className="px-6 py-4">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#037ECC]/70 mb-1">Date</span>
            <p className="text-sm font-semibold text-slate-800">{serviceDate ?? "—"}</p>
          </div>
        </div>

        <SignatureEditorModal open={providerEditorOpen} onOpenChange={setProviderEditorOpen} onSave={handleSaveProviderSignature} />
        {!useCheckmarkSignature && <SignatureEditorModal open={editorOpen} onOpenChange={setEditorOpen} onSave={handleSaveSignature} />}
      </div>
    </Section>
  )
}
