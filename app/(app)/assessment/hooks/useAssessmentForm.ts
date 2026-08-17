"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
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
  SaveAssessmentDto,
  SchoolSetting,
} from "@/lib/types/assessment.types"
import { useAssessmentById } from "@/lib/modules/assessments/hooks/use-assessment-by-id"
import { useAssessmentCatalogs } from "@/lib/modules/assessments/hooks/use-assessment-catalogs"
import { useClientCategoryItems } from "@/lib/modules/assessments/hooks/use-client-category-items"
import { useSaveAssessment } from "@/lib/modules/assessments/hooks/use-save-assessment"
import {
  EMPTY_SCHEDULE_HOURS,
  parseBillingCodeSettings,
  parseProposedSchedule,
  SCHEDULE_DAY_KEYS,
  serializeBillingCodeSettings,
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
}

/** Fila de billing code; unidades como texto de input, settings desarmado en location/notes */
export interface BillingCodeRow {
  billingCodeId: string
  unitsPeriod: string
  unitsWeek: string
  location: string
  notes: string
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
  schoolSetting: SchoolSetting | ""
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
  medicalHistoryTypeOfBirth: string
  medicalHistoryChildSpecialCharacteristic: string
  medicalHistoryAdditionalInfo: string
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
}

const EMPTY_MEDICATION: AssessmentMedicationInput = { name: "", dosage: "", frequency: "", details: "" }
const EMPTY_OBSERVATION: AssessmentObservationInput = { date: "", setting: "", summary: "" }
const EMPTY_BILLING_CODE: BillingCodeRow = { billingCodeId: "", unitsPeriod: "", unitsWeek: "", location: "", notes: "" }
const EMPTY_ABC: AssessmentAbcInput = { antecedent: "", behavior: "", consequence: "" }
const EMPTY_PROVIDER_FILE: AssessmentProviderFileInput = { type: "", name: "", contactIformation: "" }
export const EMPTY_CATEGORY_ITEM: CategoryItemFormValue = {
  intensityKey: "",
  intensityDescription: "",
  hypothesizedFunction: "",
}

/** Los textos clínicos parten en "N/A" (convención del ejemplo del contrato; nada es requerido) */
const EMPTY_FORM: AssessmentFormData = {
  clientId: "",
  schoolName: "",
  timeInit: "",
  timeEnd: "",
  gradeCatalogId: "",
  schoolSetting: "",
  schoolAddress: "",
  housingType: "",
  housingNumberRooms: 0,
  housingNumberBathrooms: 0,
  housingMemberRelationshipCatalogIds: [],
  housingInformation: "",
  medicalHistoryOtherDiagnosis: "N/A",
  medicalHistoryMorbidities: "N/A",
  medicalHistoryAllergies: "N/A",
  medicalHistoryTypeOfBirth: "N/A",
  medicalHistoryChildSpecialCharacteristic: "N/A",
  medicalHistoryAdditionalInfo: "N/A",
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
}

function isMedicationEmpty(m: AssessmentMedicationInput): boolean {
  return !m.name.trim() && !m.dosage.trim() && !m.frequency.trim() && !m.details.trim()
}

function isObservationEmpty(o: AssessmentObservationInput): boolean {
  return !o.date && !o.setting.trim() && !o.summary.trim()
}

function isCategoryItemTouched(v: CategoryItemFormValue): boolean {
  return !!v.intensityKey || !!v.intensityDescription.trim() || !!v.hypothesizedFunction
}

function isBillingCodeEmpty(row: BillingCodeRow): boolean {
  return (
    !row.billingCodeId &&
    !row.unitsPeriod.trim() &&
    !row.unitsWeek.trim() &&
    !row.location.trim() &&
    !row.notes.trim()
  )
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
      }
    }

    setFormData({
      clientId: assessment.clientId,
      schoolName: assessment.schoolName,
      timeInit: assessment.timeInit,
      timeEnd: assessment.timeEnd,
      gradeCatalogId: assessment.gradeCatalogId,
      schoolSetting: assessment.schoolSetting,
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
      medicalHistoryChildSpecialCharacteristic: assessment.medicalHistoryChildSpecialCharacteristic,
      medicalHistoryAdditionalInfo: assessment.medicalHistoryAdditionalInfo,
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
      billingCodes: assessment.billingCodes.map((b) => {
        const settings = parseBillingCodeSettings(b.settings)
        return {
          billingCodeId: b.billingCodeId,
          unitsPeriod: b.unitsPeriod ? String(b.unitsPeriod) : "",
          unitsWeek: b.unitsWeek ? String(b.unitsWeek) : "",
          location: settings.location,
          notes: settings.notes,
        }
      }),
      proposedSchedule: assessment.proposedSchedule.map((s) => ({
        credentialId: s.credentialId,
        hours: parseProposedSchedule(s.schedule),
      })),
      abcData: assessment.abcData,
      providerFiles: assessment.providerFiles,
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
   * Reglas confirmadas por backend (2026-08-17): sólo `clientId` es requerido a
   * nivel registro. Por fila: `observations[].date`, `billingCodes[].billingCodeId`
   * y `proposedSchedule[].credentialId` cuando la fila viaja; unidades y horas no
   * negativas; `timeInit < timeEnd` cuando vienen ambos.
   */
  const validate = useCallback((): Record<string, string> => {
    const newErrors: Record<string, string> = {}

    if (!formData.clientId) newErrors.clientId = "Select a client"

    if (formData.timeInit && formData.timeEnd && formData.timeEnd <= formData.timeInit) {
      newErrors.timeEnd = "End time must be after start time"
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
        hypothesizedFunction: value.hypothesizedFunction || null,
      }))

    const billingCodes: AssessmentBillingCodeInput[] = formData.billingCodes
      .filter((row) => !isBillingCodeEmpty(row))
      .map((row) => ({
        billingCodeId: row.billingCodeId,
        unitsPeriod: Number.parseFloat(row.unitsPeriod) || 0,
        unitsWeek: Number.parseFloat(row.unitsWeek) || 0,
        settings: serializeBillingCodeSettings({ location: row.location, notes: row.notes }),
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
      schoolSetting: formData.schoolSetting || null,
      schoolAddress: formData.schoolAddress.trim(),
      housingType: formData.housingType || null,
      housingNumberRooms: formData.housingNumberRooms,
      housingNumberBathrooms: formData.housingNumberBathrooms,
      housingMemberRelationshipCatalogIds: formData.housingMemberRelationshipCatalogIds,
      housingInformation: formData.housingInformation.trim(),
      medicalHistoryOtherDiagnosis: formData.medicalHistoryOtherDiagnosis.trim(),
      medicalHistoryMorbidities: formData.medicalHistoryMorbidities.trim(),
      medicalHistoryAllergies: formData.medicalHistoryAllergies.trim(),
      medicalHistoryTypeOfBirth: formData.medicalHistoryTypeOfBirth.trim(),
      medicalHistoryChildSpecialCharacteristic: formData.medicalHistoryChildSpecialCharacteristic.trim(),
      medicalHistoryAdditionalInfo: formData.medicalHistoryAdditionalInfo.trim(),
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
    // Submit
    handleSubmit,
    isSaving,
  }
}
