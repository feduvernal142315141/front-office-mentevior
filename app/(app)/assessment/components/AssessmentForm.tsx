"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import {
  BookOpenText,
  CalendarClock,
  ClipboardList,
  Contact,
  Eye,
  FileDown,
  GraduationCap,
  Home,
  Info,
  ListTree,
  Loader2,
  Pill,
  Receipt,
  Stethoscope,
  Target,
  User,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/custom/Button"
import { Checkbox } from "@/components/custom/Checkbox"
import { DocumentViewer } from "@/components/custom/DocumentViewer"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingNumberStepper } from "@/components/custom/FloatingNumberStepper"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { FloatingTextarea } from "@/components/custom/FloatingTextarea"
import { FloatingTimePicker } from "@/components/custom/FloatingTimePicker"
import { FormBottomBar } from "@/components/custom/FormBottomBar"
import { MultiSelectWithSearch } from "@/components/custom/MultiSelectWithSearch"
import {
  ASSESSMENT_BACKGROUND_FIELDS,
  HOUSING_TYPE_OPTIONS,
  TYPE_OF_BIRTH_OPTIONS,
} from "@/lib/constants/assessment.constants"
import {
  ASSESSMENT_BACKGROUND_GUIDANCE,
  ASSESSMENT_BACKGROUND_SUMMARY_GUIDANCE,
} from "@/lib/constants/assessment-guidance"
import { getAssessmentPdfUrl } from "@/lib/modules/assessments/services/assessments.service"
import { useAssessmentForm } from "../hooks/useAssessmentForm"
import { AbcDataSection } from "./sections/AbcDataSection"
import { BillingCodesSection } from "./sections/BillingCodesSection"
import { CategoryItemsSection } from "./sections/CategoryItemsSection"
import { MedicationsSection } from "./sections/MedicationsSection"
import { ObservationsSection } from "./sections/ObservationsSection"
import { PdfNarrativesSections } from "./sections/PdfNarrativesSections"
import { PdfSectionsVisibility } from "./sections/PdfSectionsVisibility"
import { ProposedScheduleSection } from "./sections/ProposedScheduleSection"
import { ProviderFilesSection } from "./sections/ProviderFilesSection"

interface AssessmentFormProps {
  /** Presente al editar un assessment existente */
  assessmentId?: string
}

/**
 * Sólo `clientId` es requerido (confirmado por backend 2026-08-17); el resto de
 * las validaciones son por fila y viven en `useAssessmentForm.validate`.
 */
export function AssessmentForm({ assessmentId }: AssessmentFormProps) {
  const router = useRouter()
  const [previewId, setPreviewId] = useState<string | null>(null)

  const {
    formData,
    updateField,
    errors,
    isEditing,
    assessment,
    detailLoading,
    detailError,
    clientOptions,
    clientsLoading,
    grades,
    conductedOptions,
    relationships,
    categories,
    categoriesLoading,
    billingCodeOptions,
    credentialOptions,
    isLoadingCatalogs,
    billingCodesLoading,
    credentialsLoading,
    addMedication,
    removeMedication,
    updateMedication,
    addObservation,
    removeObservation,
    updateObservation,
    updateCategoryItem,
    clearCategoryItem,
    addBillingCode,
    removeBillingCode,
    updateBillingCode,
    addScheduleRow,
    removeScheduleRow,
    updateScheduleCredential,
    updateScheduleHours,
    addAbcRow,
    removeAbcRow,
    updateAbcRow,
    addProviderFile,
    removeProviderFile,
    updateProviderFile,
    updatePdfText,
    updatePdfFlag,
    handleSubmit,
    isSaving,
  } = useAssessmentForm({ assessmentId })

  const onSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault()
      const id = await handleSubmit()
      if (!id) return
      toast.success(isEditing ? "Assessment updated" : "Assessment created")
      router.push("/assessment")
    },
    [handleSubmit, isEditing, router],
  )

  // Generar el PDF exige que el registro exista, así que previsualizar guarda
  // primero (el hook de guardado recuerda el id: no se duplican registros)
  const handlePreview = useCallback(async () => {
    const id = await handleSubmit()
    if (id) setPreviewId(id)
  }, [handleSubmit])

  if (isEditing && detailLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[#037ECC] animate-spin" />
      </div>
    )
  }

  if (isEditing && (detailError || !assessment)) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <p className="text-red-600 font-medium">Failed to load the assessment</p>
        <p className="text-red-500 text-sm mt-1">{detailError?.message || "Assessment not found"}</p>
      </div>
    )
  }

  const gradeOptions = grades.map((g) => ({ value: g.id, label: g.name }))

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5 pb-32">
      {/* ─── Preview: exige guardar antes, el PDF sale de un registro existente ─── */}
      <div className="flex justify-end">
        <Button
          type="button"
          variant="secondary"
          onClick={handlePreview}
          disabled={isSaving}
          className="gap-2 flex items-center"
        >
          <FileDown className="h-4 w-4" />
          Save &amp; Preview PDF
        </Button>
      </div>

      {/* ─── Client ─── */}
      <Section icon={<User className="h-4 w-4" />} title="Client" subtitle="Who this assessment is for">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div data-field="clientId">
            <FloatingSelect
              label="Client"
              value={formData.clientId}
              onChange={(v) => updateField("clientId", v)}
              options={clientOptions}
              disabled={clientsLoading || isEditing}
              hasError={!!errors.clientId}
              searchable
              required
            />
            <FieldError message={errors.clientId} />
            {isEditing && (
              <p className="mt-2 text-xs text-slate-400">
                The client cannot be changed on an existing assessment.
              </p>
            )}
          </div>
        </div>
      </Section>

      {/* ─── School Information ─── */}
      <Section icon={<GraduationCap className="h-4 w-4" />} title="School Information">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <FloatingInput
              label="School name"
              value={formData.schoolName}
              onChange={(v) => updateField("schoolName", v)}
              onBlur={() => {}}
            />
          </div>
          <FloatingSelect
            label="Grade"
            value={formData.gradeCatalogId}
            onChange={(v) => updateField("gradeCatalogId", v)}
            options={gradeOptions}
            disabled={isLoadingCatalogs}
          />
          <FloatingTimePicker
            label="School start time"
            value={formData.timeInit}
            onChange={(v) => updateField("timeInit", v)}
          />
          <div data-field="timeEnd">
            <FloatingTimePicker
              label="School end time"
              value={formData.timeEnd}
              onChange={(v) => updateField("timeEnd", v)}
              hasError={!!errors.timeEnd}
              defaultPeriod="PM"
            />
            <FieldError message={errors.timeEnd} />
          </div>
          <div className="lg:col-span-3">
            <FloatingInput
              label="School address"
              value={formData.schoolAddress}
              onChange={(v) => updateField("schoolAddress", v)}
              onBlur={() => {}}
            />
          </div>
        </div>
      </Section>

      {/* ─── Housing & Family ─── */}
      <Section icon={<Home className="h-4 w-4" />} title="Housing & Family">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <FloatingSelect
            label="Housing type"
            value={formData.housingType}
            onChange={(v) => updateField("housingType", v as typeof formData.housingType)}
            options={HOUSING_TYPE_OPTIONS}
          />
          <FloatingNumberStepper
            label="Number of rooms"
            value={formData.housingNumberRooms}
            onChange={(v) => updateField("housingNumberRooms", v)}
            min={0}
          />
          <FloatingNumberStepper
            label="Number of bathrooms"
            value={formData.housingNumberBathrooms}
            onChange={(v) => updateField("housingNumberBathrooms", v)}
            min={0}
          />
        </div>
        <div className="mt-4">
          <MultiSelectWithSearch
            label="Household members"
            items={relationships}
            selectedIds={formData.housingMemberRelationshipCatalogIds}
            onChange={(ids) => updateField("housingMemberRelationshipCatalogIds", ids)}
            isLoading={isLoadingCatalogs}
          />
        </div>
        <div className="mt-4">
          <FloatingTextarea
            label="Housing / family information"
            value={formData.housingInformation}
            onChange={(v) => updateField("housingInformation", v)}
            onBlur={() => {}}
            rows={4}
          />
        </div>
      </Section>

      {/* ─── Medical History ─── */}
      <Section icon={<Stethoscope className="h-4 w-4" />} title="Medical History">
        {/* El dx primario lo captura el backend como snapshot al crear; acá solo se informa */}
        <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-[#037ECC]/20 bg-[#037ECC]/[0.04] px-4 py-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#037ECC]" />
          <p className="text-sm text-slate-600">
            {isEditing ? (
              <>
                Primary diagnosis (snapshot):{" "}
                <span className="font-medium text-slate-800">
                  {assessment?.medicalHistoryPrimaryDiagnosisName || "—"}
                </span>
              </>
            ) : (
              "The client's current primary diagnosis is captured automatically when the assessment is created."
            )}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FloatingInput
            label="Other diagnosis"
            value={formData.medicalHistoryOtherDiagnosis}
            onChange={(v) => updateField("medicalHistoryOtherDiagnosis", v)}
            onBlur={() => {}}
          />
          <FloatingInput
            label="Morbidities"
            value={formData.medicalHistoryMorbidities}
            onChange={(v) => updateField("medicalHistoryMorbidities", v)}
            onBlur={() => {}}
          />
          <FloatingInput
            label="Allergies"
            value={formData.medicalHistoryAllergies}
            onChange={(v) => updateField("medicalHistoryAllergies", v)}
            onBlur={() => {}}
          />
          <FloatingSelect
            label="Type of birth"
            value={formData.medicalHistoryTypeOfBirth}
            onChange={(v) => updateField("medicalHistoryTypeOfBirth", v as typeof formData.medicalHistoryTypeOfBirth)}
            options={TYPE_OF_BIRTH_OPTIONS}
          />
        </div>
      </Section>

      {/* ─── Background ─── */}
      <Section
        icon={<BookOpenText className="h-4 w-4" />}
        title="Background"
        subtitle="Current functioning, strengths and skills"
      >
        <FloatingTextarea
          label="Summary"
          value={formData.backgroundSummary}
          onChange={(v) => updateField("backgroundSummary", v)}
          onBlur={() => {}}
          guidance={ASSESSMENT_BACKGROUND_SUMMARY_GUIDANCE}
          rows={6}
        />
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {ASSESSMENT_BACKGROUND_FIELDS.map(({ key, label }) => (
            <FloatingTextarea
              key={key}
              label={label}
              value={formData[key]}
              onChange={(v) => updateField(key, v)}
              onBlur={() => {}}
              guidance={ASSESSMENT_BACKGROUND_GUIDANCE[key]}
              rows={4}
            />
          ))}
        </div>
      </Section>

      {/* ─── Current Medications ─── */}
      <Section icon={<Pill className="h-4 w-4" />} title="Current Medications">
        <MedicationsSection
          medications={formData.currentMedications}
          disabled={isSaving}
          onAdd={addMedication}
          onRemove={removeMedication}
          onUpdate={updateMedication}
        />
      </Section>

      {/* ─── Observations ─── */}
      <Section icon={<Eye className="h-4 w-4" />} title="Observations">
        <ObservationsSection
          observations={formData.observations}
          errors={errors}
          disabled={isSaving}
          onAdd={addObservation}
          onRemove={removeObservation}
          onUpdate={updateObservation}
        />
      </Section>

      {/* ─── Assessment Conducted ─── */}
      <Section
        icon={<ClipboardList className="h-4 w-4" />}
        title="Assessment Conducted"
        subtitle="Instruments and procedures used during this assessment"
      >
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {conductedOptions.map((option) => {
            const checked = formData.assessmentConductedCatalogIds.includes(option.id)
            return (
              <label
                key={option.id}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-all ${
                  checked
                    ? "border-[#037ECC] bg-[#037ECC]/[0.06]"
                    : "border-slate-200 bg-white hover:border-[#037ECC]/30 hover:bg-[#037ECC]/[0.02]"
                }`}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(isChecked) =>
                    updateField(
                      "assessmentConductedCatalogIds",
                      isChecked
                        ? [...formData.assessmentConductedCatalogIds, option.id]
                        : formData.assessmentConductedCatalogIds.filter((id) => id !== option.id),
                    )
                  }
                />
                <span className={`text-sm leading-snug ${checked ? "font-medium text-slate-900" : "text-slate-600"}`}>
                  {option.name}
                </span>
              </label>
            )
          })}
          {conductedOptions.length === 0 && !isLoadingCatalogs && (
            <p className="text-sm text-slate-500 md:col-span-2">No assessment options available</p>
          )}
        </div>
      </Section>

      {/* ─── Categories & Items ─── */}
      <Section
        icon={<Target className="h-4 w-4" />}
        title="Categories & Items"
        subtitle="Evaluate each item of the client's active service plan"
      >
        <CategoryItemsSection
          clientSelected={!!formData.clientId}
          categories={categories}
          isLoading={categoriesLoading}
          values={formData.categoryItems}
          disabled={isSaving}
          onUpdate={updateCategoryItem}
          onClear={clearCategoryItem}
        />
      </Section>

      {/* ─── Billing Codes ─── */}
      <Section
        icon={<Receipt className="h-4 w-4" />}
        title="Billing Codes"
        subtitle="Proposed billing codes and units for this assessment"
      >
        <BillingCodesSection
          rows={formData.billingCodes}
          options={billingCodeOptions}
          optionsLoading={billingCodesLoading}
          errors={errors}
          disabled={isSaving}
          onAdd={addBillingCode}
          onRemove={removeBillingCode}
          onUpdate={updateBillingCode}
        />
      </Section>

      {/* ─── Proposed Schedule ─── */}
      <Section
        icon={<CalendarClock className="h-4 w-4" />}
        title="Proposed Schedule"
        subtitle="Weekly hours proposed per credential"
      >
        <ProposedScheduleSection
          rows={formData.proposedSchedule}
          options={credentialOptions}
          optionsLoading={credentialsLoading}
          errors={errors}
          disabled={isSaving}
          onAdd={addScheduleRow}
          onRemove={removeScheduleRow}
          onUpdateCredential={updateScheduleCredential}
          onUpdateHours={updateScheduleHours}
        />
      </Section>

      {/* ─── ABC Data ─── */}
      <Section
        icon={<ListTree className="h-4 w-4" />}
        title="ABC Data"
        subtitle="Antecedent, behavior and consequence observations"
      >
        <AbcDataSection
          rows={formData.abcData}
          disabled={isSaving}
          onAdd={addAbcRow}
          onRemove={removeAbcRow}
          onUpdate={updateAbcRow}
        />
      </Section>

      {/* ─── Providers ─── */}
      <Section
        icon={<Contact className="h-4 w-4" />}
        title="Providers"
        subtitle="Other providers involved with the client"
      >
        <ProviderFilesSection
          rows={formData.providerFiles}
          disabled={isSaving}
          onAdd={addProviderFile}
          onRemove={removeProviderFile}
          onUpdate={updateProviderFile}
        />
      </Section>

      {/* ─── PDF: narrativas editables + visibilidad de secciones ─── */}
      <PdfNarrativesSections
        values={formData.pdfTexts}
        isEditing={isEditing}
        disabled={isSaving}
        onUpdate={updatePdfText}
      />

      <PdfSectionsVisibility flags={formData.pdfFlags} disabled={isSaving} onUpdate={updatePdfFlag} />

      <FormBottomBar
        isSubmitting={isSaving}
        onCancel={() => router.push("/assessment")}
        submitText={isEditing ? "Update Assessment" : "Create Assessment"}
        disabled={isSaving}
      />

      {previewId && (
        <DocumentViewer
          open
          onClose={() => setPreviewId(null)}
          documentUrl={getAssessmentPdfUrl(previewId)}
          fileName="Behavior Analysis Assessment and Support Plan.pdf"
        />
      )}
    </form>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1.5 text-xs font-medium text-red-500">{message}</p>
}

function Section({ icon, title, subtitle, children }: {
  icon: React.ReactNode
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
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
