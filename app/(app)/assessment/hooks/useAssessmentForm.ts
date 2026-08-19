"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  ASSESSMENT_PDF_FLAG_KEYS,
  ASSESSMENT_PDF_TEXT_KEYS,
  type AssessmentPdfFlagKey,
  type AssessmentPdfFlags,
  type AssessmentPdfTextKey,
  type AssessmentPdfTexts,
  type AssessmentPdfTextsPayload,
} from "@/lib/types/assessment.types"
import type {
  AssessmentAbcInput,
  AssessmentBackgroundFields,
  AssessmentBillingCodeInput,
  AssessmentCategoryItemInput,
  AssessmentIntensityKey,
  AssessmentMedicationInput,
  AssessmentObservationInput,
  AssessmentProposedScheduleInput,
  AssessmentProviderFileInput,
  HousingType,
  HypothesizedFunction,
  MedicalHistoryTypeOfBirth,
  SaveAssessmentDto,
} from "@/lib/types/assessment.types"
import {
  ASSESSMENT_BACKGROUND_FIELDS,
  ASSESSMENT_PDF_GENERAL_NARRATIVES,
  ASSESSMENT_PDF_STRATEGY_GROUPS,
} from "@/lib/constants/assessment.constants"
import { useAssessmentById } from "@/lib/modules/assessments/hooks/use-assessment-by-id"
import { useAssessmentCatalogs } from "@/lib/modules/assessments/hooks/use-assessment-catalogs"
import { useClientCategoryItems } from "@/lib/modules/assessments/hooks/use-client-category-items"
import { useSaveAssessment } from "@/lib/modules/assessments/hooks/use-save-assessment"
import {
  EMPTY_SCHEDULE_HOURS,
  normalizeBillingCodeSettings,
  parseProposedSchedule,
  SCHEDULE_DAY_KEYS,
  serializeProposedSchedule,
  type ScheduleHours,
} from "@/lib/modules/assessments/utils/assessment-json-fields"
import { useBillingCodes } from "@/lib/modules/billing-codes/hooks/use-billing-codes"
import { useClientsByLoggedUser } from "@/lib/modules/clients/hooks/use-clients-by-logged-user"
import { useCredentials } from "@/lib/modules/credentials/hooks/use-credentials"
import { useRelationshipCatalog } from "@/lib/modules/relationships/hooks/use-relationship-catalog"

/** Evaluación por item del SP; "" = sin capturar */
export interface CategoryItemFormValue {
  intensityKey: AssessmentIntensityKey | ""
  intensityDescription: string
  hypothesizedFunction: HypothesizedFunction | ""
  prevalentSetting: string
  preventiveStrategies: string
  managementStrategies: string
}

/** Fila de billing code; unidades como texto de input, settings texto plano */
export interface BillingCodeRow {
  billingCodeId: string
  unitsPeriod: string
  unitsWeek: string
  settings: string
}

export interface ScheduleRow {
  credentialId: string
  hours: ScheduleHours
}

export interface AssessmentFormData extends AssessmentBackgroundFields {
  clientId: string
  // School
  schoolName: string
  /** HH:mm (el payload agrega los segundos) */
  timeInit: string
  timeEnd: string
  gradeCatalogId: string
  schoolAddress: string
  // Housing & family
  housingType: HousingType | ""
  housingNumberRooms: number
  housingNumberBathrooms: number
  housingMemberRelationshipCatalogIds: string[]
  housingInformation: string
  // Medical history (el dx primario es snapshot del backend, no viaja)
  medicalHistoryOtherDiagnosis: string
  medicalHistoryMorbidities: string
  medicalHistoryAllergies: string
  medicalHistoryTypeOfBirth: MedicalHistoryTypeOfBirth | ""
  // Collections
  currentMedications: AssessmentMedicationInput[]
  observations: AssessmentObservationInput[]
  assessmentConductedCatalogIds: string[]
  /** Por id de item del SP; solo los items "tocados" van al payload */
  categoryItems: Record<string, CategoryItemFormValue>
  billingCodes: BillingCodeRow[]
  proposedSchedule: ScheduleRow[]
  abcData: AssessmentAbcInput[]
  providerFiles: AssessmentProviderFileInput[]
  // PDF
  pdfTexts: AssessmentPdfTexts
  pdfFlags: AssessmentPdfFlags
}

function buildEmptyPdfTexts(): AssessmentPdfTexts {
  const texts = {} as AssessmentPdfTexts
  for (const key of ASSESSMENT_PDF_TEXT_KEYS) texts[key] = ""
  return texts
}

/** Todas las secciones del PDF parten visibles (null equivale a true en backend) */
function buildDefaultPdfFlags(): AssessmentPdfFlags {
  const flags = {} as AssessmentPdfFlags
  for (const key of ASSESSMENT_PDF_FLAG_KEYS) flags[key] = true
  return flags
}

const EMPTY_MEDICATION: AssessmentMedicationInput = { name: "", dosage: "", frequency: "", details: "" }
const EMPTY_OBSERVATION: AssessmentObservationInput = { date: "", setting: "", summary: "" }
const EMPTY_BILLING_CODE: BillingCodeRow = { billingCodeId: "", unitsPeriod: "", unitsWeek: "", settings: "" }
const EMPTY_ABC: AssessmentAbcInput = { antecedent: "", behavior: "", consequence: "" }
const EMPTY_PROVIDER_FILE: AssessmentProviderFileInput = { type: "", name: "", contactIformation: "" }
export const EMPTY_CATEGORY_ITEM: CategoryItemFormValue = {
  intensityKey: "",
  intensityDescription: "",
  hypothesizedFunction: "",
  prevalentSetting: "",
  preventiveStrategies: "",
  managementStrategies: "",
}

/** Los textos clínicos parten en "N/A" (convención del ejemplo del contrato; nada es requerido) */
const EMPTY_FORM: AssessmentFormData = {
  clientId: "",
  schoolName: "",
  timeInit: "",
  timeEnd: "",
  gradeCatalogId: "",
  schoolAddress: "",
  housingType: "",
  housingNumberRooms: 0,
  housingNumberBathrooms: 0,
  housingMemberRelationshipCatalogIds: [],
  housingInformation: "",
  medicalHistoryOtherDiagnosis: "N/A",
  medicalHistoryMorbidities: "N/A",
  medicalHistoryAllergies: "N/A",
  medicalHistoryTypeOfBirth: "",
  backgroundSummary: "",
  backgroundStrengths: "",
  backgroundWeaknesses: "",
  backgroundInterest: "",
  backgroundCommunicationSkills: "",
  backgroundAcademicSkills: "",
  backgroundSelfCareSkills: "",
  backgroundSocialSkills: "",
  backgroundSafetySkills: "",
  backgroundSelfAdvocacy: "",
  backgroundSelfPreservationSkills: "",
  backgroundMotorSkills: "",
  currentMedications: [],
  observations: [],
  assessmentConductedCatalogIds: [],
  categoryItems: {},
  billingCodes: [],
  proposedSchedule: [],
  abcData: [],
  providerFiles: [],
  pdfTexts: buildEmptyPdfTexts(),
  pdfFlags: buildDefaultPdfFlags(),
}

function isMedicationEmpty(m: AssessmentMedicationInput): boolean {
  return !m.name.trim() && !m.dosage.trim() && !m.frequency.trim() && !m.details.trim()
}

function isObservationEmpty(o: AssessmentObservationInput): boolean {
  return !o.date && !o.setting.trim() && !o.summary.trim()
}

function isCategoryItemTouched(v: CategoryItemFormValue): boolean {
  return (
    !!v.intensityKey ||
    !!v.intensityDescription.trim() ||
    !!v.hypothesizedFunction ||
    !!v.prevalentSetting.trim() ||
    !!v.preventiveStrategies.trim() ||
    !!v.managementStrategies.trim()
  )
}

function isBillingCodeEmpty(row: BillingCodeRow): boolean {
  return !row.billingCodeId && !row.unitsPeriod.trim() && !row.unitsWeek.trim() && !row.settings.trim()
}

function isScheduleEmpty(row: ScheduleRow): boolean {
  return !row.credentialId && SCHEDULE_DAY_KEYS.every((day) => !row.hours[day].trim())
}

function isAbcEmpty(row: AssessmentAbcInput): boolean {
  return !row.antecedent.trim() && !row.behavior.trim() && !row.consequence.trim()
}

function isProviderFileEmpty(row: AssessmentProviderFileInput): boolean {
  return !row.type.trim() && !row.name.trim() && !row.contactIformation.trim()
}

/** "" es válido (el payload lo vuelve 0); con contenido debe ser un número ≥ 0 */
function isInvalidNonNegative(value: string): boolean {
  if (!value.trim()) return false
  const parsed = Number.parseFloat(value)
  return !Number.isFinite(parsed) || parsed < 0
}

interface UseAssessmentFormProps {
  /** Presente al editar un assessment existente */
  assessmentId?: string
}

export function useAssessmentForm({ assessmentId }: UseAssessmentFormProps) {
  const isEditing = !!assessmentId

  const { assessment, isLoading: detailLoading, error: detailError } = useAssessmentById(assessmentId)
  const { save, isSaving } = useSaveAssessment({ assessmentId })

  const { clients, isLoading: clientsLoading } = useClientsByLoggedUser({ page: 0, pageSize: 200 })
  const { grades, conductedOptions, isLoading: catalogsLoading } = useAssessmentCatalogs()
  const { relationships, isLoading: relationshipsLoading } = useRelationshipCatalog()
  const { billingCodes: companyBillingCodes, isLoading: billingCodesLoading } = useBillingCodes({ page: 0, pageSize: 200 })
  const { credentials: companyCredentials, isLoading: credentialsLoading } = useCredentials({ page: 0, pageSize: 200 })

  const [formData, setFormData] = useState<AssessmentFormData>(EMPTY_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { categories, isLoading: categoriesLoading } = useClientCategoryItems(formData.clientId || null)

  const clientOptions = useMemo(
    () => clients.filter((c) => c.fullName).map((c) => ({ value: c.id, label: c.fullName })),
    [clients],
  )

  const billingCodeOptions = useMemo(
    () =>
      companyBillingCodes
        .filter((b) => b.active)
        .map((b) => ({ value: b.id, label: b.description ? `${b.code} — ${b.description}` : b.code })),
    [companyBillingCodes],
  )

  const credentialOptions = useMemo(
    () => companyCredentials.filter((c) => c.active).map((c) => ({ value: c.id, label: c.name })),
    [companyCredentials],
  )

  // Con un solo cliente no tiene sentido hacer elegir (mismo criterio que Clinical Monthly)
  useEffect(() => {
    if (isEditing || clients.length !== 1) return
    setFormData((prev) => (prev.clientId ? prev : { ...prev, clientId: clients[0].id }))
  }, [clients, isEditing])

  // Precarga al editar
  useEffect(() => {
    if (!assessment) return

    const categoryItems: Record<string, CategoryItemFormValue> = {}
    for (const entry of assessment.categoriesItems) {
      if (!entry.clientServicePlanCategoryItemId) continue
      categoryItems[entry.clientServicePlanCategoryItemId] = {
        intensityKey: entry.intensityKey ?? "",
        intensityDescription: entry.intensityDescription,
        hypothesizedFunction: entry.hypothesizedFunction ?? "",
        prevalentSetting: entry.prevalentSetting,
        preventiveStrategies: entry.preventiveStrategies,
        managementStrategies: entry.managementStrategies,
      }
    }

    setFormData({
      clientId: assessment.clientId,
      schoolName: assessment.schoolName,
      timeInit: assessment.timeInit,
      timeEnd: assessment.timeEnd,
      gradeCatalogId: assessment.gradeCatalogId,
      schoolAddress: assessment.schoolAddress,
      housingType: assessment.housingType,
      housingNumberRooms: assessment.housingNumberRooms,
      housingNumberBathrooms: assessment.housingNumberBathrooms,
      housingMemberRelationshipCatalogIds: assessment.housingMembers
        .map((m) => m.relationshipCatalogId)
        .filter(Boolean),
      housingInformation: assessment.housingInformation,
      medicalHistoryOtherDiagnosis: assessment.medicalHistoryOtherDiagnosis,
      medicalHistoryMorbidities: assessment.medicalHistoryMorbidities,
      medicalHistoryAllergies: assessment.medicalHistoryAllergies,
      medicalHistoryTypeOfBirth: assessment.medicalHistoryTypeOfBirth,
      backgroundSummary: assessment.backgroundSummary,
      backgroundStrengths: assessment.backgroundStrengths,
      backgroundWeaknesses: assessment.backgroundWeaknesses,
      backgroundInterest: assessment.backgroundInterest,
      backgroundCommunicationSkills: assessment.backgroundCommunicationSkills,
      backgroundAcademicSkills: assessment.backgroundAcademicSkills,
      backgroundSelfCareSkills: assessment.backgroundSelfCareSkills,
      backgroundSocialSkills: assessment.backgroundSocialSkills,
      backgroundSafetySkills: assessment.backgroundSafetySkills,
      backgroundSelfAdvocacy: assessment.backgroundSelfAdvocacy,
      backgroundSelfPreservationSkills: assessment.backgroundSelfPreservationSkills,
      backgroundMotorSkills: assessment.backgroundMotorSkills,
      currentMedications: assessment.currentMedications,
      observations: assessment.observations,
      assessmentConductedCatalogIds: assessment.assessmentConductedList
        .map((c) => c.assessmentConductedCatalogId)
        .filter(Boolean),
      categoryItems,
      billingCodes: assessment.billingCodes.map((b) => ({
        billingCodeId: b.billingCodeId,
        unitsPeriod: b.unitsPeriod ? String(b.unitsPeriod) : "",
        unitsWeek: b.unitsWeek ? String(b.unitsWeek) : "",
        settings: normalizeBillingCodeSettings(b.settings),
      })),
      proposedSchedule: assessment.proposedSchedule.map((s) => ({
        credentialId: s.credentialId,
        hours: parseProposedSchedule(s.schedule),
      })),
      abcData: assessment.abcData,
      providerFiles: assessment.providerFiles,
      pdfTexts: Object.fromEntries(
        ASSESSMENT_PDF_TEXT_KEYS.map((key) => [key, assessment[key]]),
      ) as AssessmentPdfTexts,
      pdfFlags: Object.fromEntries(
        ASSESSMENT_PDF_FLAG_KEYS.map((key) => [key, assessment[key]]),
      ) as AssessmentPdfFlags,
    })
  }, [assessment])

  const updateField = useCallback(
    <K extends keyof AssessmentFormData>(field: K, value: AssessmentFormData[K]) => {
      setFormData((prev) => {
        // Cambiar de cliente invalida la evaluación por item: son items de otro SP
        if (field === "clientId" && value !== prev.clientId) {
          return { ...prev, clientId: value as string, categoryItems: {} }
        }
        return { ...prev, [field]: value }
      })
      setErrors((prev) => {
        if (!prev[field as string]) return prev
        const next = { ...prev }
        delete next[field as string]
        return next
      })
    },
    [],
  )

  const clearRowError = useCallback((key: string) => {
    setErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }, [])

  // ── Medications ──
  const addMedication = useCallback(() => {
    setFormData((prev) => ({ ...prev, currentMedications: [...prev.currentMedications, { ...EMPTY_MEDICATION }] }))
  }, [])

  const removeMedication = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      currentMedications: prev.currentMedications.filter((_, i) => i !== index),
    }))
  }, [])

  const updateMedication = useCallback(
    (index: number, field: keyof AssessmentMedicationInput, value: string) => {
      setFormData((prev) => ({
        ...prev,
        currentMedications: prev.currentMedications.map((m, i) => (i === index ? { ...m, [field]: value } : m)),
      }))
      clearRowError(`medication-${index}`)
    },
    [clearRowError],
  )

  // ── Observations ──
  const addObservation = useCallback(() => {
    setFormData((prev) => ({ ...prev, observations: [...prev.observations, { ...EMPTY_OBSERVATION }] }))
  }, [])

  const removeObservation = useCallback((index: number) => {
    setFormData((prev) => ({ ...prev, observations: prev.observations.filter((_, i) => i !== index) }))
  }, [])

  const updateObservation = useCallback(
    (index: number, field: keyof AssessmentObservationInput, value: string) => {
      setFormData((prev) => ({
        ...prev,
        observations: prev.observations.map((o, i) => (i === index ? { ...o, [field]: value } : o)),
      }))
      clearRowError(`observation-${index}`)
    },
    [clearRowError],
  )

  // ── Category items ──
  const updateCategoryItem = useCallback(
    (itemId: string, field: keyof CategoryItemFormValue, value: string) => {
      setFormData((prev) => ({
        ...prev,
        categoryItems: {
          ...prev.categoryItems,
          [itemId]: { ...(prev.categoryItems[itemId] ?? EMPTY_CATEGORY_ITEM), [field]: value },
        },
      }))
      clearRowError(`category-item-${itemId}`)
    },
    [clearRowError],
  )

  const clearCategoryItem = useCallback((itemId: string) => {
    setFormData((prev) => {
      const next = { ...prev.categoryItems }
      delete next[itemId]
      return { ...prev, categoryItems: next }
    })
    clearRowError(`category-item-${itemId}`)
  }, [clearRowError])

  // ── Billing codes ──
  const addBillingCode = useCallback(() => {
    setFormData((prev) => ({ ...prev, billingCodes: [...prev.billingCodes, { ...EMPTY_BILLING_CODE }] }))
  }, [])

  const removeBillingCode = useCallback((index: number) => {
    setFormData((prev) => ({ ...prev, billingCodes: prev.billingCodes.filter((_, i) => i !== index) }))
  }, [])

  const updateBillingCode = useCallback(
    (index: number, field: keyof BillingCodeRow, value: string) => {
      setFormData((prev) => ({
        ...prev,
        billingCodes: prev.billingCodes.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
      }))
      clearRowError(`billing-code-${index}`)
    },
    [clearRowError],
  )

  // ── Proposed schedule ──
  const addScheduleRow = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      proposedSchedule: [...prev.proposedSchedule, { credentialId: "", hours: { ...EMPTY_SCHEDULE_HOURS } }],
    }))
  }, [])

  const removeScheduleRow = useCallback((index: number) => {
    setFormData((prev) => ({ ...prev, proposedSchedule: prev.proposedSchedule.filter((_, i) => i !== index) }))
  }, [])

  const updateScheduleCredential = useCallback(
    (index: number, credentialId: string) => {
      setFormData((prev) => ({
        ...prev,
        proposedSchedule: prev.proposedSchedule.map((row, i) => (i === index ? { ...row, credentialId } : row)),
      }))
      clearRowError(`schedule-${index}`)
    },
    [clearRowError],
  )

  const updateScheduleHours = useCallback(
    (index: number, day: keyof ScheduleHours, value: string) => {
      setFormData((prev) => ({
        ...prev,
        proposedSchedule: prev.proposedSchedule.map((row, i) =>
          i === index ? { ...row, hours: { ...row.hours, [day]: value } } : row,
        ),
      }))
      clearRowError(`schedule-${index}`)
    },
    [clearRowError],
  )

  // ── ABC data ──
  const addAbcRow = useCallback(() => {
    setFormData((prev) => ({ ...prev, abcData: [...prev.abcData, { ...EMPTY_ABC }] }))
  }, [])

  const removeAbcRow = useCallback((index: number) => {
    setFormData((prev) => ({ ...prev, abcData: prev.abcData.filter((_, i) => i !== index) }))
  }, [])

  const updateAbcRow = useCallback(
    (index: number, field: keyof AssessmentAbcInput, value: string) => {
      setFormData((prev) => ({
        ...prev,
        abcData: prev.abcData.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
      }))
    },
    [],
  )

  // ── PDF texts & section flags ──
  const updatePdfText = useCallback((key: AssessmentPdfTextKey, value: string) => {
    setFormData((prev) => ({ ...prev, pdfTexts: { ...prev.pdfTexts, [key]: value } }))
  }, [])

  const updatePdfFlag = useCallback((key: AssessmentPdfFlagKey, value: boolean) => {
    setFormData((prev) => ({ ...prev, pdfFlags: { ...prev.pdfFlags, [key]: value } }))
    // Encender/apagar una sección cambia qué es requerido: los errores visibles
    // quedan obsoletos y se recalculan completos en el próximo submit
    setErrors({})
  }, [])

  // ── Provider files ──
  const addProviderFile = useCallback(() => {
    setFormData((prev) => ({ ...prev, providerFiles: [...prev.providerFiles, { ...EMPTY_PROVIDER_FILE }] }))
  }, [])

  const removeProviderFile = useCallback((index: number) => {
    setFormData((prev) => ({ ...prev, providerFiles: prev.providerFiles.filter((_, i) => i !== index) }))
  }, [])

  const updateProviderFile = useCallback(
    (index: number, field: keyof AssessmentProviderFileInput, value: string) => {
      setFormData((prev) => ({
        ...prev,
        providerFiles: prev.providerFiles.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
      }))
    },
    [],
  )

  /**
   * Reglas de backend (2026-08-17): sólo `clientId` es requerido a nivel
   * registro; por fila, los ids/fechas y los no-negativos. Encima, regla de
   * producto (2026-08-19): una sección marcada "Include in PDF" no puede ir
   * vacía — sus campos son requeridos y sus colecciones exigen al menos una
   * fila. Con el switch apagado nada de esa sección se valida.
   */
  const validate = useCallback((): Record<string, string> => {
    const newErrors: Record<string, string> = {}
    const flags = formData.pdfFlags
    const required = "This field is required"

    if (!formData.clientId) newErrors.clientId = "Select a client"

    if (formData.timeInit && formData.timeEnd && formData.timeEnd <= formData.timeInit) {
      newErrors.timeEnd = "End time must be after start time"
    }

    if (flags.showSchoolInformation) {
      if (!formData.schoolName.trim()) newErrors.schoolName = required
      if (!formData.gradeCatalogId) newErrors.gradeCatalogId = "Select a grade"
      if (!formData.timeInit) newErrors.timeInit = required
      if (!formData.timeEnd && !newErrors.timeEnd) newErrors.timeEnd = required
      if (!formData.schoolAddress.trim()) newErrors.schoolAddress = required
    }

    if (flags.showHousingFamily) {
      if (!formData.housingType) newErrors.housingType = "Select a housing type"
      if (!formData.housingInformation.trim()) newErrors.housingInformation = required
    }

    if (flags.showMedicalHistory) {
      if (!formData.medicalHistoryOtherDiagnosis.trim()) newErrors.medicalHistoryOtherDiagnosis = required
      if (!formData.medicalHistoryMorbidities.trim()) newErrors.medicalHistoryMorbidities = required
      if (!formData.medicalHistoryAllergies.trim()) newErrors.medicalHistoryAllergies = required
      if (!formData.medicalHistoryTypeOfBirth) newErrors.medicalHistoryTypeOfBirth = "Select the type of birth"
    }

    if (flags.showBackgroundInformation) {
      if (!formData.backgroundSummary.trim()) newErrors.backgroundSummary = required
      for (const { key } of ASSESSMENT_BACKGROUND_FIELDS) {
        if (!formData[key].trim()) newErrors[key] = required
      }
    }

    if (flags.showCurrentMedications && !formData.currentMedications.some((m) => !isMedicationEmpty(m))) {
      newErrors.currentMedications = "Add at least one medication, or turn the section off"
    }

    if (flags.showObservations && !formData.observations.some((o) => !isObservationEmpty(o))) {
      newErrors.observations = "Add at least one observation, or turn the section off"
    }

    if (flags.showAssessmentConducted && formData.assessmentConductedCatalogIds.length === 0) {
      newErrors.assessmentConductedCatalogIds = "Select at least one assessment, or turn the section off"
    }

    if (
      flags.showAssessmentCategories &&
      !Object.values(formData.categoryItems).some((v) => isCategoryItemTouched(v))
    ) {
      newErrors.categoriesItems = "Evaluate at least one item, or turn the section off"
    }

    if (flags.showRecommendedServices && !formData.billingCodes.some((row) => !isBillingCodeEmpty(row))) {
      newErrors.billingCodesSection = "Add at least one billing code, or turn the section off"
    }

    if (flags.showProposedSchedule && !formData.proposedSchedule.some((row) => !isScheduleEmpty(row))) {
      newErrors.proposedScheduleSection = "Add at least one schedule, or turn the section off"
    }

    if (flags.showAbcDataRecording && !formData.abcData.some((row) => !isAbcEmpty(row))) {
      newErrors.abcData = "Add at least one ABC row, or turn the section off"
    }

    if (flags.showProvidersOnFile && !formData.providerFiles.some((row) => !isProviderFileEmpty(row))) {
      newErrors.providerFiles = "Add at least one provider, or turn the section off"
    }

    // Narrativas: en create un texto vacío es válido (el backend aplica su
    // texto estándar); en edit ya no hay defaults, así que sección encendida
    // exige contenido.
    if (isEditing) {
      for (const { key, flagKey, label } of ASSESSMENT_PDF_GENERAL_NARRATIVES) {
        if (flags[flagKey] && !formData.pdfTexts[key].trim()) {
          newErrors[key] = `${label} cannot be empty while included in the PDF`
        }
      }
      for (const group of ASSESSMENT_PDF_STRATEGY_GROUPS) {
        if (flags[group.flagKey] && group.fields.every(({ key }) => !formData.pdfTexts[key].trim())) {
          newErrors[group.flagKey] = "Fill at least one strategy, or turn the section off"
        }
      }
    }

    formData.observations.forEach((o, index) => {
      if (isObservationEmpty(o)) return
      if (!o.date) newErrors[`observation-${index}`] = "Date is required for each observation"
    })

    formData.billingCodes.forEach((row, index) => {
      if (isBillingCodeEmpty(row)) return
      if (!row.billingCodeId) {
        newErrors[`billing-code-${index}`] = "Select a billing code"
      } else if (isInvalidNonNegative(row.unitsPeriod) || isInvalidNonNegative(row.unitsWeek)) {
        newErrors[`billing-code-${index}`] = "Units must be zero or a positive number"
      }
    })

    formData.proposedSchedule.forEach((row, index) => {
      if (isScheduleEmpty(row)) return
      if (!row.credentialId) {
        newErrors[`schedule-${index}`] = "Select a credential"
      } else if (SCHEDULE_DAY_KEYS.some((day) => isInvalidNonNegative(row.hours[day]))) {
        newErrors[`schedule-${index}`] = "Hours must be zero or a positive number"
      }
    })

    return newErrors
  }, [formData, isEditing])

  const buildPayload = useCallback((): SaveAssessmentDto => {
    const categoriesItems: AssessmentCategoryItemInput[] = Object.entries(formData.categoryItems)
      .filter(([, value]) => isCategoryItemTouched(value))
      .map(([itemId, value]) => ({
        clientServicePlanCategoryItemId: itemId,
        intensityKey: value.intensityKey || null,
        intensityDescription: value.intensityDescription.trim(),
        hypothesizedFunction: value.hypothesizedFunction || null,
        prevalentSetting: value.prevalentSetting.trim(),
        preventiveStrategies: value.preventiveStrategies.trim(),
        managementStrategies: value.managementStrategies.trim(),
      }))

    const billingCodes: AssessmentBillingCodeInput[] = formData.billingCodes
      .filter((row) => !isBillingCodeEmpty(row))
      .map((row) => ({
        billingCodeId: row.billingCodeId,
        unitsPeriod: Number.parseFloat(row.unitsPeriod) || 0,
        unitsWeek: Number.parseFloat(row.unitsWeek) || 0,
        settings: row.settings.trim(),
      }))

    const proposedSchedule: AssessmentProposedScheduleInput[] = formData.proposedSchedule
      .filter((row) => !isScheduleEmpty(row))
      .map((row) => ({
        credentialId: row.credentialId,
        schedule: serializeProposedSchedule(row.hours),
      }))

    return {
      clientId: formData.clientId,
      schoolName: formData.schoolName.trim(),
      timeInit: formData.timeInit ? `${formData.timeInit}:00` : null,
      timeEnd: formData.timeEnd ? `${formData.timeEnd}:00` : null,
      gradeCatalogId: formData.gradeCatalogId || null,
      schoolAddress: formData.schoolAddress.trim(),
      housingType: formData.housingType || null,
      housingNumberRooms: formData.housingNumberRooms,
      housingNumberBathrooms: formData.housingNumberBathrooms,
      housingMemberRelationshipCatalogIds: formData.housingMemberRelationshipCatalogIds,
      housingInformation: formData.housingInformation.trim(),
      medicalHistoryOtherDiagnosis: formData.medicalHistoryOtherDiagnosis.trim(),
      medicalHistoryMorbidities: formData.medicalHistoryMorbidities.trim(),
      medicalHistoryAllergies: formData.medicalHistoryAllergies.trim(),
      medicalHistoryTypeOfBirth: formData.medicalHistoryTypeOfBirth || null,
      backgroundSummary: formData.backgroundSummary.trim(),
      backgroundStrengths: formData.backgroundStrengths.trim(),
      backgroundWeaknesses: formData.backgroundWeaknesses.trim(),
      backgroundInterest: formData.backgroundInterest.trim(),
      backgroundCommunicationSkills: formData.backgroundCommunicationSkills.trim(),
      backgroundAcademicSkills: formData.backgroundAcademicSkills.trim(),
      backgroundSelfCareSkills: formData.backgroundSelfCareSkills.trim(),
      backgroundSocialSkills: formData.backgroundSocialSkills.trim(),
      backgroundSafetySkills: formData.backgroundSafetySkills.trim(),
      backgroundSelfAdvocacy: formData.backgroundSelfAdvocacy.trim(),
      backgroundSelfPreservationSkills: formData.backgroundSelfPreservationSkills.trim(),
      backgroundMotorSkills: formData.backgroundMotorSkills.trim(),
      currentMedications: formData.currentMedications
        .filter((m) => !isMedicationEmpty(m))
        .map((m) => ({
          name: m.name.trim(),
          dosage: m.dosage.trim(),
          frequency: m.frequency.trim(),
          details: m.details.trim(),
        })),
      observations: formData.observations
        .filter((o) => !isObservationEmpty(o))
        .map((o) => ({ date: o.date, setting: o.setting.trim(), summary: o.summary.trim() })),
      assessmentConductedCatalogIds: formData.assessmentConductedCatalogIds,
      categoriesItems,
      billingCodes,
      proposedSchedule,
      abcData: formData.abcData
        .filter((row) => !isAbcEmpty(row))
        .map((row) => ({
          antecedent: row.antecedent.trim(),
          behavior: row.behavior.trim(),
          consequence: row.consequence.trim(),
        })),
      providerFiles: formData.providerFiles
        .filter((row) => !isProviderFileEmpty(row))
        .map((row) => ({
          type: row.type.trim(),
          name: row.name.trim(),
          contactIformation: row.contactIformation.trim(),
        })),
      // Un texto vacío viaja null: en create el backend aplica su texto
      // estándar; en update significa "no pintar esa subsección del PDF".
      ...(Object.fromEntries(
        ASSESSMENT_PDF_TEXT_KEYS.map((key) => [key, formData.pdfTexts[key].trim() || null]),
      ) as AssessmentPdfTextsPayload),
      ...formData.pdfFlags,
    }
  }, [formData])

  const scrollToFirstError = useCallback((newErrors: Record<string, string>) => {
    setTimeout(() => {
      const firstKey = Object.keys(newErrors)[0]
      const el = document.querySelector<HTMLElement>(`[data-field="${firstKey}"]`)
      if (!el) return
      const scrollContainer = document.getElementById("main-scroll")
      if (scrollContainer) {
        const elRect = el.getBoundingClientRect()
        const containerRect = scrollContainer.getBoundingClientRect()
        const scrollOffset = elRect.top - containerRect.top + scrollContainer.scrollTop - 100
        scrollContainer.scrollTo({ top: scrollOffset, behavior: "smooth" })
      } else {
        el.scrollIntoView({ behavior: "smooth", block: "center" })
      }
      const focusable = el.querySelector<HTMLElement>("input, textarea, select, button") ?? el
      if (focusable instanceof HTMLElement) setTimeout(() => focusable.focus(), 400)
    }, 50)
  }, [])

  /** Devuelve el id guardado, o null si la validación o el request fallaron */
  const handleSubmit = useCallback(async (): Promise<string | null> => {
    const newErrors = validate()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      scrollToFirstError(newErrors)
      return null
    }
    setErrors({})

    return save(buildPayload())
  }, [validate, buildPayload, save, scrollToFirstError])

  return {
    formData,
    updateField,
    errors,
    isEditing,
    // Detail (edit)
    assessment,
    detailLoading,
    detailError,
    // Catalogs & options
    clientOptions,
    clientsLoading,
    grades,
    conductedOptions,
    relationships,
    categories,
    categoriesLoading,
    billingCodeOptions,
    credentialOptions,
    isLoadingCatalogs: catalogsLoading || relationshipsLoading,
    billingCodesLoading,
    credentialsLoading,
    // Collections
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
    // Submit
    handleSubmit,
    isSaving,
  }
}
