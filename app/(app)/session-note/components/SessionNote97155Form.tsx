"use client"

import { useState } from "react"
import Link from "next/link"
import {
  AlertTriangle, BookOpen, Stethoscope, Eye, Wrench, FlaskConical, Users2,
  User, Building2, ClipboardList, PenTool, CheckCircle2, PenLine,
} from "lucide-react"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { AiImprovableTextarea } from "@/components/custom/AiImprovableTextarea"
import {
  buildFaceToFaceMetadata,
  buildProtocolAdjustmentsMetadata,
  buildQhpImplementationMetadata,
  buildActiveDirectionMetadata,
} from "@/lib/modules/appointment-notes/utils/ai-summary-metadata"
import { SESSION_NOTE_GUIDANCE } from "@/lib/constants/session-note-guidance"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { PremiumSwitch } from "@/components/custom/PremiumSwitch"
import { MultiSelectWithSearch } from "@/components/custom/MultiSelectWithSearch"
import { FormBottomBar } from "@/components/custom/FormBottomBar"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"
import { formatHoursAndUnits, splitBillingCodesAndUnits } from "@/lib/utils/session-note-units"
import { SignatureEditorModal } from "@/app/(app)/my-profile/manager/credentials-signature/components/SignatureEditorModal"
import { CLIENT_PARTICIPANT_ID } from "../hooks/useSessionNoteForm"
import { deriveNoteStatusInfo } from "../hooks/useNoteStatus"
import type { SessionNote97155FormData } from "@/lib/types/appointment-note-97155.types"
import type { CatalogItem } from "@/lib/types/appointment-note-97155.types"
import type { ParticipantCatalogItem, NoteStatus } from "@/lib/types/appointment-note.types"

const GUIDANCE_97155 = SESSION_NOTE_GUIDANCE["97155"]

interface SessionNote97155FormProps {
  formData: SessionNote97155FormData
  updateField: <K extends keyof SessionNote97155FormData>(field: K, value: SessionNote97155FormData[K]) => void
  isSaving: boolean
  isLoadingCatalogs: boolean
  modalityOptions: { value: string; label: string }[]
  participantCatalog: ParticipantCatalogItem[]
  protocolObservationItems: CatalogItem[]
  protocolAdjustmentItems: CatalogItem[]
  qhpImplementationItems: CatalogItem[]
  activeDirectionItems: CatalogItem[]
  recipient: { name: string; dateOfBirth: string; insuranceNumber: string; diagnosis: string } | null
  provider: { name: string; credential: string; npi: string; mpi: string; sign: string } | null
  serviceDetails: { date: string | null; placeOfService: string | null; timeInOut: string | null; hours: string | null } | null
  billingCodes: string | null
  errors?: Record<string, string>
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
}

export function SessionNote97155Form({
  formData,
  updateField,
  isSaving,
  isLoadingCatalogs,
  modalityOptions,
  participantCatalog,
  protocolObservationItems,
  protocolAdjustmentItems,
  qhpImplementationItems,
  activeDirectionItems,
  recipient,
  provider,
  serviceDetails,
  billingCodes,
  errors = {},
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
}: SessionNote97155FormProps) {
  const statusInfo = deriveNoteStatusInfo(noteStatus, false)
  const formDisabled = !statusInfo.isFormEditable
  const saveDisabled = !statusInfo.canSave

  const participantItems = participantCatalog.map((p) => ({ id: p.id, name: p.name }))

  // Las unidades llegan pegadas al string de billing codes; en Service Details
  // van junto a las horas, no junto al código.
  const { label: billingCodeLabel, units: billingCodeUnits } = splitBillingCodesAndUnits(billingCodes)

  const namesFromIds = (ids: string[], items: { id: string; name: string }[]) =>
    ids.map((id) => items.find((i) => i.id === id)?.name).filter((n): n is string => !!n)

  const generalMetadata = () => ({
    modalityName: modalityOptions.find((o) => o.value === formData.modalityId)?.label ?? "",
    reasonCaregiverNotPresent: formData.reasonCaregiverNotPresent,
    medicalConcerns: formData.medicalConcerns,
    crisisInvolved: formData.crisisInvolved,
    participantNames: namesFromIds(formData.participantIds, participantCatalog),
  })

  const buildFaceToFaceSummaryMetadata = () =>
    buildFaceToFaceMetadata({
      ...generalMetadata(),
      faceToFaceProtocolName: protocolObservationItems.find((i) => i.id === formData.faceToFaceProtocolId)?.name ?? "",
    })

  const buildAdjustmentsSummaryMetadata = () =>
    buildProtocolAdjustmentsMetadata({
      ...generalMetadata(),
      protocolAdjustmentNames: namesFromIds(formData.protocolAdjustmentIds, protocolAdjustmentItems),
    })

  const buildQhpSummaryMetadata = () =>
    buildQhpImplementationMetadata({
      ...generalMetadata(),
      qhpImplementationName: qhpImplementationItems.find((i) => i.id === formData.qhpImplementationId)?.name ?? "",
    })

  const buildActiveDirectionSummaryMetadata = () =>
    buildActiveDirectionMetadata({
      ...generalMetadata(),
      technicianNameAndCredentials: formData.technicianNameAndCredentials,
      activeDirectionActivityNames: namesFromIds(formData.activeDirectionIds, activeDirectionItems),
    })

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

      {/* ─── Modality & Participants + Session Details ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Section icon={<BookOpen className="h-4 w-4" />} title="Modality & Participants">
          <div className="space-y-4">
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

      {/* ─── ADAPTIVE BEHAVIOR TREATMENT WITH PROTOCOL MODIFICATION ─── */}

      {/* Section 1: Face-to-face Protocol Observation */}
      <Section icon={<Eye className="h-4 w-4" />} title="Face-to-face Protocol Observation">
        <div className="space-y-4">
          <PremiumSwitch
            label="Face-to-face observations"
            description="Face-to-face observations were made to determine if protocol components are functioning effectively for the client or require adjustments."
            checked={formData.faceToFaceProtocolShow}
            onCheckedChange={(v) => updateField("faceToFaceProtocolShow", v)}
            disabled={formDisabled}
            className="flex-row-reverse justify-end gap-4"
          />
          {formData.faceToFaceProtocolShow && (
            <div className="mt-4 space-y-4 pl-1 border-l-2 border-[#037ECC]/20 ml-1">
              <div className="pl-4" data-field="faceToFaceProtocolId">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 block">
                  Observation Outcome {<span className="text-[#037ECC]">*</span>}
                </span>
                <RadioGroup
                  value={formData.faceToFaceProtocolId}
                  onValueChange={(v) => updateField("faceToFaceProtocolId", v)}
                  disabled={formDisabled}
                  className="gap-3"
                >
                  {protocolObservationItems.map((item) => {
                    const selected = formData.faceToFaceProtocolId === item.id
                    return (
                      <label
                        key={item.id}
                        htmlFor={`f2f-${item.id}`}
                        className={cn(
                          "flex items-start gap-3 rounded-xl border px-4 py-3.5 cursor-pointer transition-all",
                          selected
                            ? "border-[#037ECC] bg-[#037ECC]/[0.06] shadow-sm shadow-[#037ECC]/10"
                            : "border-slate-200 hover:border-[#037ECC]/30 hover:bg-[#037ECC]/[0.02] bg-white",
                        )}
                      >
                        <RadioGroupItem
                          value={item.id}
                          id={`f2f-${item.id}`}
                          className={cn(
                            "mt-0.5 border-2",
                            selected
                              ? "border-[#037ECC] text-[#037ECC] [&_svg]:fill-[#037ECC]"
                              : "border-slate-300",
                          )}
                        />
                        <span className={cn("text-sm leading-relaxed", selected ? "text-slate-900 font-medium" : "text-slate-600")}>{item.name}</span>
                      </label>
                    )
                  })}
                </RadioGroup>
                <FieldError message={errors.faceToFaceProtocolId} />
              </div>
              <div className="pl-4" data-field="faceToFaceProtocolNarrative">
                <AiImprovableTextarea
                  label="Narrative"
                  value={formData.faceToFaceProtocolNarrative}
                  onChange={(v) => updateField("faceToFaceProtocolNarrative", v)}
                  onBlur={() => {}}
                  guidance={GUIDANCE_97155.faceToFaceProtocolNarrative}
                  rows={8}
                  showLengthCounter
                  disabled={formDisabled}
                  hasError={!!errors.faceToFaceProtocolNarrative}
                  required
                  billingCode="97155"
                  summaryType="FACE_TO_FACE_OBSERVATION"
                  buildMetadata={buildFaceToFaceSummaryMetadata}
                />
                <FieldError message={errors.faceToFaceProtocolNarrative} />
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* Section 2: Protocol Adjustments */}
      <Section icon={<Wrench className="h-4 w-4" />} title="Protocol Adjustments">
        <div className="space-y-4">
          <PremiumSwitch
            label="Protocol adjustments"
            description="Adjustments were made to the selected components of the protocol."
            checked={formData.protocolAdjustmentsShow}
            onCheckedChange={(v) => updateField("protocolAdjustmentsShow", v)}
            disabled={formDisabled}
            className="flex-row-reverse justify-end gap-4"
          />
          {formData.protocolAdjustmentsShow && (
            <div className="mt-4 space-y-4 pl-1 border-l-2 border-[#037ECC]/20 ml-1">
              <div className="pl-4" data-field="protocolAdjustmentIds">
                <MultiSelectWithSearch
                  label="Adjustments"
                  items={protocolAdjustmentItems}
                  selectedIds={formData.protocolAdjustmentIds}
                  onChange={(ids) => updateField("protocolAdjustmentIds", ids)}
                  disabled={isLoadingCatalogs || formDisabled}
                  hasError={!!errors.protocolAdjustmentIds}
                  required
                />
                <FieldError message={errors.protocolAdjustmentIds} />
              </div>
              <div className="pl-4" data-field="adjustmentsNarrative">
                <AiImprovableTextarea
                  label="Narrative"
                  value={formData.adjustmentsNarrative}
                  onChange={(v) => updateField("adjustmentsNarrative", v)}
                  onBlur={() => {}}
                  guidance={GUIDANCE_97155.adjustmentsNarrative}
                  rows={8}
                  showLengthCounter
                  disabled={formDisabled}
                  hasError={!!errors.adjustmentsNarrative}
                  required
                  billingCode="97155"
                  summaryType="PROTOCOL_ADJUSTMENTS"
                  buildMetadata={buildAdjustmentsSummaryMetadata}
                />
                <FieldError message={errors.adjustmentsNarrative} />
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* Section 3: QHP Implementation */}
      <Section icon={<FlaskConical className="h-4 w-4" />} title="QHP Implementation">
        <div className="space-y-4">
          <PremiumSwitch
            label="QHP implementation"
            description="QHP implemented one or more aspects of the protocol with the client."
            checked={formData.qhpImplementationShow}
            onCheckedChange={(v) => updateField("qhpImplementationShow", v)}
            disabled={formDisabled}
            className="flex-row-reverse justify-end gap-4"
          />
          {formData.qhpImplementationShow && (
            <div className="mt-4 space-y-4 pl-1 border-l-2 border-[#037ECC]/20 ml-1">
              <div className="pl-4" data-field="qhpImplementationId">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 block">
                  Implementation Related To {<span className="text-[#037ECC]">*</span>}
                </span>
                <RadioGroup
                  value={formData.qhpImplementationId}
                  onValueChange={(v) => updateField("qhpImplementationId", v)}
                  disabled={formDisabled}
                  className="gap-3"
                >
                  {qhpImplementationItems.map((item) => {
                    const selected = formData.qhpImplementationId === item.id
                    return (
                      <label
                        key={item.id}
                        htmlFor={`qhp-${item.id}`}
                        className={cn(
                          "flex items-start gap-3 rounded-xl border px-4 py-3.5 cursor-pointer transition-all",
                          selected
                            ? "border-[#037ECC] bg-[#037ECC]/[0.06] shadow-sm shadow-[#037ECC]/10"
                            : "border-slate-200 hover:border-[#037ECC]/30 hover:bg-[#037ECC]/[0.02] bg-white",
                        )}
                      >
                        <RadioGroupItem
                          value={item.id}
                          id={`qhp-${item.id}`}
                          className={cn(
                            "mt-0.5 border-2",
                            selected
                              ? "border-[#037ECC] text-[#037ECC] [&_svg]:fill-[#037ECC]"
                              : "border-slate-300",
                          )}
                        />
                        <span className={cn("text-sm leading-relaxed", selected ? "text-slate-900 font-medium" : "text-slate-600")}>{item.name}</span>
                      </label>
                    )
                  })}
                </RadioGroup>
                <FieldError message={errors.qhpImplementationId} />
              </div>
              <div className="pl-4" data-field="qhpNarrative">
                <AiImprovableTextarea
                  label="Narrative"
                  value={formData.qhpNarrative}
                  onChange={(v) => updateField("qhpNarrative", v)}
                  onBlur={() => {}}
                  guidance={GUIDANCE_97155.qhpNarrative}
                  rows={8}
                  showLengthCounter
                  disabled={formDisabled}
                  hasError={!!errors.qhpNarrative}
                  required
                  billingCode="97155"
                  summaryType="QHP_IMPLEMENTATION"
                  buildMetadata={buildQhpSummaryMetadata}
                />
                <FieldError message={errors.qhpNarrative} />
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* Section 4: Supervision / Active Direction */}
      <Section icon={<Users2 className="h-4 w-4" />} title="Supervision — Active Direction">
        <div className="space-y-4">
          {/* Derivado del sub-event de supervisión del appointment; el backend rechaza (422) cualquier otro valor */}
          <PremiumSwitch
            label="Active direction"
            description="Active direction (face-to-face) was given to a technician as they delivered ABA services. Set automatically from the supervision sub-event on this appointment."
            checked={formData.activeDirectionActivitiesShow}
            onCheckedChange={() => {}}
            disabled
            className="flex-row-reverse justify-end gap-4"
          />
          {formData.activeDirectionActivitiesShow && (
            <div className="mt-4 space-y-4 pl-1 border-l-2 border-[#037ECC]/20 ml-1">
              <div className="pl-4" data-field="technicianNameAndCredentials">
                <FloatingInput
                  label="Technician's Name and Credentials"
                  value={formData.technicianNameAndCredentials}
                  onChange={(v) => updateField("technicianNameAndCredentials", v)}
                  onBlur={() => {}}
                  disabled={formDisabled}
                  hasError={!!errors.technicianNameAndCredentials}
                  required
                />
                <FieldError message={errors.technicianNameAndCredentials} />
              </div>
              <div className="pl-4" data-field="activeDirectionIds">
                <MultiSelectWithSearch
                  label="Direction Activities"
                  items={activeDirectionItems}
                  selectedIds={formData.activeDirectionIds}
                  onChange={(ids) => updateField("activeDirectionIds", ids)}
                  disabled={isLoadingCatalogs || formDisabled}
                  hasError={!!errors.activeDirectionIds}
                  required
                />
                <FieldError message={errors.activeDirectionIds} />
              </div>
              <div className="pl-4" data-field="activeDirectionNarrative">
                <AiImprovableTextarea
                  label="Narrative"
                  value={formData.activeDirectionNarrative}
                  onChange={(v) => updateField("activeDirectionNarrative", v)}
                  onBlur={() => {}}
                  guidance={GUIDANCE_97155.activeDirectionNarrative}
                  rows={8}
                  showLengthCounter
                  disabled={formDisabled}
                  hasError={!!errors.activeDirectionNarrative}
                  required
                  billingCode="97155"
                  summaryType="ACTIVE_DIRECTION"
                  buildMetadata={buildActiveDirectionSummaryMetadata}
                />
                <FieldError message={errors.activeDirectionNarrative} />
              </div>
            </div>
          )}
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

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2.5 px-5 py-3 border-b border-slate-100">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#037ECC]/10 text-[#037ECC]">{icon}</div>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="px-5 py-4">{children}</div>
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
