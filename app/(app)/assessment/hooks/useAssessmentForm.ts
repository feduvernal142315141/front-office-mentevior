"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
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
  AssessmentDraft,
  ClientCategoryWithItems,
  HousingType,
  HypothesizedFunction,
  MedicalHistoryTypeOfBirth,
  SaveAssessmentDto,
} from "@/lib/types/assessment.types"
import {
  ASSESSMENT_BACKGROUND_FIELDS,
  ASSESSMENT_PDF_GENERAL_NARRATIVES,
  ASSESSMENT_PDF_MANDATORY_FLAGS,
  ASSESSMENT_PDF_STRATEGY_GROUPS,
  CURRENT_MEDICATIONS_DENIED_DEFAULT_NOTE,
} from "@/lib/constants/assessment.constants"
import { ASSESSMENT_PDF_DEFAULT_TEXTS } from "@/lib/constants/assessment-pdf-default-texts"
import { useAssessmentById } from "@/lib/modules/assessments/hooks/use-assessment-by-id"
import { useAssessmentCatalogs } from "@/lib/modules/assessments/hooks/use-assessment-catalogs"
import { useAssessmentDataByClient } from "@/lib/modules/assessments/hooks/use-client-category-items"
import { useClientItemCollectionMethods } from "@/lib/modules/assessments/hooks/use-client-item-collection-methods"
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
  /** Vacía = el usuario no la tocó; se muestra la precarga del Service Plan */
  hypothesizedFunction: HypothesizedFunction[]
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
  // Other services (sección del PDF tras Providers on File)
  previousAbaTherapy: string
  previousAgencyName: string
  otherServicesSpeechTherapy: boolean
  otherServicesOccupationalTherapy: boolean
  otherServicesPhysicalTherapy: boolean
  otherServicesFeedingTherapy: boolean
  otherServicesOther: string
  otherServicesFacilityName: string
  // Collections
  /** Contrato 2026-09-07: el caregiver declaró que no hay medicación */
  currentMedicationsDenied: boolean
  currentMedicationsNote: string
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

/**
 * En create las narrativas parten con el texto estándar visible y editable
 * (el mismo que el backend guardaría ante un `null`), no vacías.
 */
function buildDefaultPdfTexts(): AssessmentPdfTexts {
  return { ...ASSESSMENT_PDF_DEFAULT_TEXTS }
}

/**
 * Antes de elegir cliente: sólo las obligatorias encendidas. Al cargar
 * `assessment-data` se aplican los flags del borrador (backend: casi todos
 * `true`, alineado al auto-create 97151). En edit mandan los del registro.
 */
function buildDefaultPdfFlags(): AssessmentPdfFlags {
  const flags = {} as AssessmentPdfFlags
  for (const key of ASSESSMENT_PDF_FLAG_KEYS) {
    flags[key] = ASSESSMENT_PDF_MANDATORY_FLAGS.has(key)
  }
  return flags
}

function categoryItemsFromDraft(
  categories: ClientCategoryWithItems[],
): Record<string, CategoryItemFormValue> {
  const out: Record<string, CategoryItemFormValue> = {}
  for (const category of categories) {
    for (const item of category.items) {
      const value: CategoryItemFormValue = {
        intensityKey: item.intensityKey ?? "",
        intensityDescription: item.intensityDescription,
        // La precarga de hypothesizedFunction vive en hypothesizedFunctionByItemId
        hypothesizedFunction: [],
        prevalentSetting: item.prevalentSetting,
        preventiveStrategies: item.preventiveStrategies,
        managementStrategies: item.managementStrategies,
      }
      if (
        !!value.intensityKey ||
        !!value.intensityDescription.trim() ||
        !!value.prevalentSetting.trim() ||
        !!value.preventiveStrategies.trim() ||
        !!value.managementStrategies.trim()
      ) {
        out[item.id] = value
      }
    }
  }
  return out
}

function billingRowsFromDraft(draft: AssessmentDraft): BillingCodeRow[] {
  return draft.billingCodes.map((row) => ({
    billingCodeId: row.billingCodeId,
    unitsPeriod: row.unitsPeriod ? String(row.unitsPeriod) : "",
    unitsWeek: row.unitsWeek ? String(row.unitsWeek) : "",
    settings: row.settings,
  }))
}

function scheduleRowsFromDraft(draft: AssessmentDraft): ScheduleRow[] {
  return draft.proposedSchedule
    .filter((row) => row.credentialId)
    .map((row) => ({
      credentialId: row.credentialId,
      hours: parseProposedSchedule(row.schedule),
    }))
}

/** Aplica el borrador de `assessment-data` al formulario de create. */
function applyAssessmentDraft(prev: AssessmentFormData, draft: AssessmentDraft): AssessmentFormData {
  return {
    ...prev,
    clientId: draft.clientId || prev.clientId,
    schoolName: draft.schoolName,
    timeInit: draft.timeInit,
    timeEnd: draft.timeEnd,
    gradeCatalogId: draft.gradeCatalogId,
    schoolAddress: draft.schoolAddress,
    housingType: draft.housingType,
    housingNumberRooms: draft.housingNumberRooms,
    housingNumberBathrooms: draft.housingNumberBathrooms,
    housingMemberRelationshipCatalogIds: draft.housingMemberRelationshipCatalogIds,
    housingInformation: draft.housingInformation,
    medicalHistoryOtherDiagnosis: draft.medicalHistoryOtherDiagnosis,
    medicalHistoryMorbidities: draft.medicalHistoryMorbidities,
    medicalHistoryAllergies: draft.medicalHistoryAllergies,
    medicalHistoryTypeOfBirth: draft.medicalHistoryTypeOfBirth,
    previousAbaTherapy: draft.previousAbaTherapy,
    previousAgencyName: draft.previousAgencyName,
    otherServicesSpeechTherapy: draft.otherServicesSpeechTherapy,
    otherServicesOccupationalTherapy: draft.otherServicesOccupationalTherapy,
    otherServicesPhysicalTherapy: draft.otherServicesPhysicalTherapy,
    otherServicesFeedingTherapy: draft.otherServicesFeedingTherapy,
    otherServicesOther: draft.otherServicesOther,
    otherServicesFacilityName: draft.otherServicesFacilityName,
    backgroundSummary: draft.backgroundSummary,
    backgroundStrengths: draft.backgroundStrengths,
    backgroundWeaknesses: draft.backgroundWeaknesses,
    backgroundInterest: draft.backgroundInterest,
    backgroundCommunicationSkills: draft.backgroundCommunicationSkills,
    backgroundAcademicSkills: draft.backgroundAcademicSkills,
    backgroundSelfCareSkills: draft.backgroundSelfCareSkills,
    backgroundSocialSkills: draft.backgroundSocialSkills,
    backgroundSafetySkills: draft.backgroundSafetySkills,
    backgroundSelfAdvocacy: draft.backgroundSelfAdvocacy,
    backgroundSelfPreservationSkills: draft.backgroundSelfPreservationSkills,
    backgroundMotorSkills: draft.backgroundMotorSkills,
    currentMedicationsDenied: draft.currentMedicationsDenied,
    currentMedicationsNote:
      draft.currentMedicationsNote ||
      (draft.currentMedicationsDenied ? CURRENT_MEDICATIONS_DENIED_DEFAULT_NOTE : ""),
    currentMedications: draft.currentMedications,
    observations: draft.observations,
    assessmentConductedCatalogIds: draft.assessmentConductedCatalogIds,
    categoryItems: categoryItemsFromDraft(draft.categories),
    billingCodes: billingRowsFromDraft(draft),
    proposedSchedule: scheduleRowsFromDraft(draft),
    abcData: draft.abcData,
    providerFiles: draft.providerFiles,
    pdfTexts: draft.pdfTexts,
    pdfFlags: draft.pdfFlags,
  }
}

const EMPTY_MEDICATION: AssessmentMedicationInput = { name: "", dosage: "", frequency: "", details: "" }
const EMPTY_OBSERVATION: AssessmentObservationInput = { date: "", setting: "", summary: "" }
const EMPTY_BILLING_CODE: BillingCodeRow = { billingCodeId: "", unitsPeriod: "", unitsWeek: "", settings: "" }
const EMPTY_ABC: AssessmentAbcInput = { antecedent: "", behavior: "", consequence: "" }
const EMPTY_PROVIDER_FILE: AssessmentProviderFileInput = { type: "", name: "", contactIformation: "" }
export const EMPTY_CATEGORY_ITEM: CategoryItemFormValue = {
  intensityKey: "",
  intensityDescription: "",
  hypothesizedFunction: [],
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
  previousAbaTherapy: "",
  previousAgencyName: "",
  otherServicesSpeechTherapy: false,
  otherServicesOccupationalTherapy: false,
  otherServicesPhysicalTherapy: false,
  otherServicesFeedingTherapy: false,
  otherServicesOther: "",
  otherServicesFacilityName: "",
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
  currentMedicationsDenied: false,
  currentMedicationsNote: "",
  currentMedications: [],
  observations: [],
  assessmentConductedCatalogIds: [],
  categoryItems: {},
  billingCodes: [],
  proposedSchedule: [],
  abcData: [],
  providerFiles: [],
  pdfTexts: buildDefaultPdfTexts(),
  pdfFlags: buildDefaultPdfFlags(),
}

/**
 * Hasta 2026-09-05 el switch de PDF era también la condición de obligatoriedad:
 * sección encendida = campos requeridos. Al volverse obligatorias seis secciones
 * (F9) eso habría hecho imposible guardar un assessment a medio llenar, así que
 * las dos cosas quedan separadas — se imprimen siempre, pero no bloquean el
 * guardado (decisión D4). El resto de las secciones sigue igual que antes.
 */
function sectionBlocksSave(flags: AssessmentPdfFlags, key: AssessmentPdfFlagKey): boolean {
  if (ASSESSMENT_PDF_MANDATORY_FLAGS.has(key)) return false
  return flags[key]
}

function isMedicationEmpty(m: AssessmentMedicationInput): boolean {
  return !m.name.trim() && !m.dosage.trim() && !m.frequency.trim() && !m.details.trim()
}

function isObservationEmpty(o: AssessmentObservationInput): boolean {
  return !o.date && !o.setting.trim() && !o.summary.trim()
}

/**
 * Sólo hay entrada en `categoryItems` cuando el usuario tocó el item (o cuando
 * se precargó un assessment existente): la precarga del Service Plan vive fuera
 * del form, así que no marca items como tocados por sí sola.
 */
function isCategoryItemTouched(v: CategoryItemFormValue): boolean {
  return (
    !!v.intensityKey ||
    !!v.intensityDescription.trim() ||
    v.hypothesizedFunction.length > 0 ||
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

  const { assessment, isLoading: detailLoading, error: detailError, refetch: refetchAssessment } =
    useAssessmentById(assessmentId)
  const { save, isSaving } = useSaveAssessment({ assessmentId })

  const { clients, isLoading: clientsLoading } = useClientsByLoggedUser({ page: 0, pageSize: 200 })
  const { grades, conductedOptions, isLoading: catalogsLoading } = useAssessmentCatalogs()
  const { relationships, isLoading: relationshipsLoading } = useRelationshipCatalog()
  // pageSize 0 = todos los billing codes configurados de la compañía
  const { billingCodes: companyBillingCodes, isLoading: billingCodesLoading } = useBillingCodes({ page: 0, pageSize: 0 })
  const { credentials: companyCredentials, isLoading: credentialsLoading } = useCredentials({ page: 0, pageSize: 200 })

  const [formData, setFormData] = useState<AssessmentFormData>(EMPTY_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})
  /** Evita re-aplicar el borrador si el usuario ya lo recibió para ese cliente. */
  const hydratedDraftClientIdRef = useRef<string | null>(null)

  const {
    draft: clientDraft,
    categories,
    isLoading: categoriesLoading,
  } = useAssessmentDataByClient(formData.clientId || null)
  // Método de colección por item: decide si se muestran los campos de intensidad
  const { methodByItemId: collectionMethodByItemId, isLoading: collectionMethodsLoading } =
    useClientItemCollectionMethods(formData.clientId || null, categories)

  /**
   * Valor inicial de la función hipotetizada por item, tal como lo configura el
   * Client Service Plan (contrato 2026-09-03). Es sólo la precarga: en cuanto el
   * usuario elige algo, manda `formData.categoryItems[itemId]`.
   */
  const hypothesizedFunctionByItemId = useMemo(() => {
    const byItemId: Record<string, HypothesizedFunction[]> = {}
    for (const category of categories) {
      for (const item of category.items) {
        if (item.hypothesizedFunctions.length > 0) byItemId[item.id] = item.hypothesizedFunctions
      }
    }
    return byItemId
  }, [categories])

  const clientOptions = useMemo(
    () => (clients ?? []).filter((c) => c.fullName).map((c) => ({ value: c.id, label: c.fullName })),
    [clients],
  )

  // `active !== false`: algunos listados no incluyen el campo y un filtro
  // estricto dejaría el select vacío
  const billingCodeOptions = useMemo(() => {
    const options = (companyBillingCodes ?? [])
      .filter((b) => b.active !== false)
      .map((b) => ({ value: b.id, label: b.description ? `${b.code} — ${b.description}` : b.code }))

    const byId = new Map(options.map((o) => [o.value, o]))
    for (const [id, code] of Object.entries(clientDraft?.billingCodeLabels ?? {})) {
      if (!byId.has(id)) byId.set(id, { value: id, label: code })
    }
    return Array.from(byId.values())
  }, [companyBillingCodes, clientDraft?.billingCodeLabels])

  const credentialOptions = useMemo(
    () =>
      (companyCredentials ?? [])
        .filter((c) => c.active !== false)
        .map((c) => ({ value: c.id, label: c.name })),
    [companyCredentials],
  )

  // Con un solo cliente no tiene sentido hacer elegir (mismo criterio que Clinical Monthly)
  useEffect(() => {
    if (isEditing || clients.length !== 1) return
    setFormData((prev) => (prev.clientId ? prev : { ...prev, clientId: clients[0].id }))
  }, [clients, isEditing])

  // Create: hidratar desde assessment-data al elegir cliente (alineado al auto-create 97151)
  useEffect(() => {
    if (isEditing || !clientDraft || !formData.clientId) return
    if (clientDraft.clientId && clientDraft.clientId !== formData.clientId) return
    if (hydratedDraftClientIdRef.current === formData.clientId) return
    hydratedDraftClientIdRef.current = formData.clientId
    setFormData((prev) => applyAssessmentDraft(prev, clientDraft))
  }, [clientDraft, formData.clientId, isEditing])

  // Precarga al editar
  useEffect(() => {
    if (!assessment) return

    const categoryItems: Record<string, CategoryItemFormValue> = {}
    for (const entry of assessment.categoriesItems ?? []) {
      if (!entry.clientServicePlanCategoryItemId) continue
      categoryItems[entry.clientServicePlanCategoryItemId] = {
        intensityKey: entry.intensityKey ?? "",
        intensityDescription: entry.intensityDescription ?? "",
        hypothesizedFunction: entry.hypothesizedFunction,
        prevalentSetting: entry.prevalentSetting ?? "",
        preventiveStrategies: entry.preventiveStrategies ?? "",
        managementStrategies: entry.managementStrategies ?? "",
      }
    }

    setFormData({
      clientId: assessment.clientId ?? "",
      schoolName: assessment.schoolName ?? "",
      timeInit: assessment.timeInit ?? "",
      timeEnd: assessment.timeEnd ?? "",
      gradeCatalogId: assessment.gradeCatalogId ?? "",
      schoolAddress: assessment.schoolAddress ?? "",
      housingType: assessment.housingType ?? "",
      housingNumberRooms: assessment.housingNumberRooms ?? 0,
      housingNumberBathrooms: assessment.housingNumberBathrooms ?? 0,
      housingMemberRelationshipCatalogIds: (assessment.housingMembers ?? [])
        .map((m) => m.relationshipCatalogId)
        .filter(Boolean),
      housingInformation: assessment.housingInformation ?? "",
      medicalHistoryOtherDiagnosis: assessment.medicalHistoryOtherDiagnosis ?? "N/A",
      medicalHistoryMorbidities: assessment.medicalHistoryMorbidities ?? "N/A",
      medicalHistoryAllergies: assessment.medicalHistoryAllergies ?? "N/A",
      medicalHistoryTypeOfBirth: assessment.medicalHistoryTypeOfBirth ?? "",
      previousAbaTherapy: assessment.previousAbaTherapy ?? "",
      previousAgencyName: assessment.previousAgencyName ?? "",
      otherServicesSpeechTherapy: assessment.otherServicesSpeechTherapy,
      otherServicesOccupationalTherapy: assessment.otherServicesOccupationalTherapy,
      otherServicesPhysicalTherapy: assessment.otherServicesPhysicalTherapy,
      otherServicesFeedingTherapy: assessment.otherServicesFeedingTherapy,
      otherServicesOther: assessment.otherServicesOther ?? "",
      otherServicesFacilityName: assessment.otherServicesFacilityName ?? "",
      backgroundSummary: assessment.backgroundSummary ?? "",
      backgroundStrengths: assessment.backgroundStrengths ?? "",
      backgroundWeaknesses: assessment.backgroundWeaknesses ?? "",
      backgroundInterest: assessment.backgroundInterest ?? "",
      backgroundCommunicationSkills: assessment.backgroundCommunicationSkills ?? "",
      backgroundAcademicSkills: assessment.backgroundAcademicSkills ?? "",
      backgroundSelfCareSkills: assessment.backgroundSelfCareSkills ?? "",
      backgroundSocialSkills: assessment.backgroundSocialSkills ?? "",
      backgroundSafetySkills: assessment.backgroundSafetySkills ?? "",
      backgroundSelfAdvocacy: assessment.backgroundSelfAdvocacy ?? "",
      backgroundSelfPreservationSkills: assessment.backgroundSelfPreservationSkills ?? "",
      backgroundMotorSkills: assessment.backgroundMotorSkills ?? "",
      currentMedicationsDenied: assessment.currentMedicationsDenied,
      currentMedicationsNote: assessment.currentMedicationsNote,
      currentMedications: assessment.currentMedications ?? [],
      observations: assessment.observations ?? [],
      assessmentConductedCatalogIds: (assessment.assessmentConductedList ?? [])
        .map((c) => c.assessmentConductedCatalogId)
        .filter(Boolean),
      categoryItems,
      billingCodes: (assessment.billingCodes ?? []).map((b) => ({
        billingCodeId: b.billingCodeId,
        unitsPeriod: b.unitsPeriod ? String(b.unitsPeriod) : "",
        unitsWeek: b.unitsWeek ? String(b.unitsWeek) : "",
        settings: normalizeBillingCodeSettings(b.settings),
      })),
      proposedSchedule: (assessment.proposedSchedule ?? []).map((s) => ({
        credentialId: s.credentialId,
        hours: parseProposedSchedule(s.schedule),
      })),
      abcData: assessment.abcData ?? [],
      providerFiles: assessment.providerFiles ?? [],
      // Una narrativa persistida vacía (registros previos a los defaults del
      // backend) se rellena con su texto estándar: nunca se muestra vacía
      pdfTexts: Object.fromEntries(
        ASSESSMENT_PDF_TEXT_KEYS.map((key) => [key, assessment[key] || ASSESSMENT_PDF_DEFAULT_TEXTS[key]]),
      ) as AssessmentPdfTexts,
      // Las obligatorias se normalizan a `true` aunque el registro viejo las
      // tenga apagadas: ya no hay switch para volver a encenderlas.
      pdfFlags: Object.fromEntries(
        ASSESSMENT_PDF_FLAG_KEYS.map((key) => [
          key,
          ASSESSMENT_PDF_MANDATORY_FLAGS.has(key) || (assessment[key] ?? false),
        ]),
      ) as AssessmentPdfFlags,
    })
  }, [assessment])

  const updateField = useCallback(
    <K extends keyof AssessmentFormData>(field: K, value: AssessmentFormData[K]) => {
      setFormData((prev) => {
        // Cambiar de cliente invalida la evaluación y el borrador del SP anterior
        if (field === "clientId" && value !== prev.clientId) {
          hydratedDraftClientIdRef.current = null
          return {
            ...prev,
            clientId: value as string,
            categoryItems: {},
            providerFiles: [],
            billingCodes: [],
            proposedSchedule: [],
            abcData: [],
            observations: [],
            assessmentConductedCatalogIds: [],
            currentMedications: [],
          }
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
    (itemId: string, field: keyof CategoryItemFormValue, value: string | string[]) => {
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

    if (sectionBlocksSave(flags, "showSchoolInformation")) {
      if (!formData.schoolName.trim()) newErrors.schoolName = required
      if (!formData.gradeCatalogId) newErrors.gradeCatalogId = "Select a grade"
      if (!formData.timeInit) newErrors.timeInit = required
      if (!formData.timeEnd && !newErrors.timeEnd) newErrors.timeEnd = required
      if (!formData.schoolAddress.trim()) newErrors.schoolAddress = required
    }

    if (sectionBlocksSave(flags, "showHousingFamily")) {
      if (!formData.housingType) newErrors.housingType = "Select a housing type"
      if (!formData.housingInformation.trim()) newErrors.housingInformation = required
    }

    if (sectionBlocksSave(flags, "showMedicalHistory")) {
      if (!formData.medicalHistoryOtherDiagnosis.trim()) newErrors.medicalHistoryOtherDiagnosis = required
      if (!formData.medicalHistoryMorbidities.trim()) newErrors.medicalHistoryMorbidities = required
      if (!formData.medicalHistoryAllergies.trim()) newErrors.medicalHistoryAllergies = required
      if (!formData.medicalHistoryTypeOfBirth) newErrors.medicalHistoryTypeOfBirth = "Select the type of birth"
    }

    if (sectionBlocksSave(flags, "showOtherServices")) {
      if (!formData.previousAbaTherapy.trim()) newErrors.previousAbaTherapy = required
      if (!formData.previousAgencyName.trim()) newErrors.previousAgencyName = required
    }

    if (sectionBlocksSave(flags, "showBackgroundInformation")) {
      if (!formData.backgroundSummary.trim()) newErrors.backgroundSummary = required
      for (const { key } of ASSESSMENT_BACKGROUND_FIELDS) {
        if (!formData[key].trim()) newErrors[key] = required
      }
    }

    if (
      sectionBlocksSave(flags, "showCurrentMedications") &&
      !formData.currentMedicationsDenied &&
      !formData.currentMedications.some((m) => !isMedicationEmpty(m))
    ) {
      newErrors.currentMedications =
        "Add at least one medication, or check that the caregiver denied any"
    }

    if (sectionBlocksSave(flags, "showObservations") && !formData.observations.some((o) => !isObservationEmpty(o))) {
      newErrors.observations = "Add at least one observation, or turn the section off"
    }

    if (sectionBlocksSave(flags, "showAssessmentConducted") && formData.assessmentConductedCatalogIds.length === 0) {
      newErrors.assessmentConductedCatalogIds = "Select at least one assessment, or turn the section off"
    }

    if (
      sectionBlocksSave(flags, "showAssessmentCategories") &&
      !Object.values(formData.categoryItems).some((v) => isCategoryItemTouched(v))
    ) {
      newErrors.categoriesItems = "Evaluate at least one item, or turn the section off"
    }

    if (sectionBlocksSave(flags, "showRecommendedServices") && !formData.billingCodes.some((row) => !isBillingCodeEmpty(row))) {
      newErrors.billingCodesSection = "Add at least one billing code, or turn the section off"
    }

    if (sectionBlocksSave(flags, "showProposedSchedule") && !formData.proposedSchedule.some((row) => !isScheduleEmpty(row))) {
      newErrors.proposedScheduleSection = "Add at least one schedule, or turn the section off"
    }

    if (sectionBlocksSave(flags, "showAbcDataRecording") && !formData.abcData.some((row) => !isAbcEmpty(row))) {
      newErrors.abcData = "Add at least one ABC row, or turn the section off"
    }

    if (sectionBlocksSave(flags, "showProvidersOnFile") && !formData.providerFiles.some((row) => !isProviderFileEmpty(row))) {
      newErrors.providerFiles = "Add at least one provider, or turn the section off"
    }

    // Narrativas: parten con el texto estándar precargado, así que encendidas
    // no pueden quedar vacías (create y edit por igual)
    for (const { key, flagKey, label } of ASSESSMENT_PDF_GENERAL_NARRATIVES) {
      if (sectionBlocksSave(flags, flagKey) && !formData.pdfTexts[key].trim()) {
        newErrors[key] = `${label} cannot be empty while included in the PDF`
      }
    }
    for (const group of ASSESSMENT_PDF_STRATEGY_GROUPS) {
      if (sectionBlocksSave(flags, group.flagKey) && group.fields.every(({ key }) => !formData.pdfTexts[key].trim())) {
        newErrors[group.flagKey] = "Fill at least one strategy, or turn the section off"
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
  }, [formData])

  const buildPayload = useCallback((): SaveAssessmentDto => {
    const categoriesItems: AssessmentCategoryItemInput[] = Object.entries(formData.categoryItems)
      .filter(([, value]) => isCategoryItemTouched(value))
      .map(([itemId, value]) => ({
        clientServicePlanCategoryItemId: itemId,
        intensityKey: value.intensityKey || null,
        intensityDescription: value.intensityDescription.trim(),
        // Viaja lo que el usuario ve: su elección o, si no tocó el selector, la
        // precarga del Service Plan.
        hypothesizedFunction:
          value.hypothesizedFunction.length > 0
            ? value.hypothesizedFunction
            : (hypothesizedFunctionByItemId[itemId] ?? []),
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
      previousAbaTherapy: formData.previousAbaTherapy.trim(),
      previousAgencyName: formData.previousAgencyName.trim(),
      otherServicesSpeechTherapy: formData.otherServicesSpeechTherapy,
      otherServicesOccupationalTherapy: formData.otherServicesOccupationalTherapy,
      otherServicesPhysicalTherapy: formData.otherServicesPhysicalTherapy,
      otherServicesFeedingTherapy: formData.otherServicesFeedingTherapy,
      otherServicesOther: formData.otherServicesOther.trim() || null,
      otherServicesFacilityName: formData.otherServicesFacilityName.trim() || null,
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
      currentMedicationsDenied: formData.currentMedicationsDenied,
      /*
       * Vacía = el backend imprime el texto estándar, así que no la mandamos
       * rellenada por nosotros. Con la casilla apagada la nota no aplica: se manda
       * `null` para que no quede un texto viejo colgado en el registro.
       */
      currentMedicationsNote: formData.currentMedicationsDenied
        ? formData.currentMedicationsNote.trim() || null
        : null,
      /*
       * Las filas viajan aunque la casilla esté marcada: el contrato dice que el
       * PDF las ignora en ese caso, y borrarlas acá haría perder lo tipeado a quien
       * marque la casilla por error.
       */
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
  }, [formData, hypothesizedFunctionByItemId])

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
    if (isEditing && assessment?.notCanEdit) return null

    const newErrors = validate()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      scrollToFirstError(newErrors)
      return null
    }
    setErrors({})

    return save(buildPayload())
  }, [validate, buildPayload, save, scrollToFirstError, isEditing, assessment?.notCanEdit])

  return {
    formData,
    updateField,
    errors,
    isEditing,
    // Detail (edit)
    assessment,
    detailLoading,
    detailError,
    refetchAssessment,
    // Catalogs & options
    clientOptions,
    clientsLoading,
    grades,
    conductedOptions,
    relationships,
    categories,
    categoriesLoading: categoriesLoading || collectionMethodsLoading,
    collectionMethodByItemId,
    hypothesizedFunctionByItemId,
    /** Borrador de create (`assessment-data`); null en edit o sin cliente. */
    clientDraft,
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
