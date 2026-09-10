import { serviceGet } from "@/lib/services/baseService"
import { parseHypothesizedFunctions } from "@/lib/constants/hypothesized-function"
import { ASSESSMENT_PDF_DEFAULT_TEXTS } from "@/lib/constants/assessment-pdf-default-texts"
import { ASSESSMENT_PDF_MANDATORY_FLAGS } from "@/lib/constants/assessment.constants"
import {
  ASSESSMENT_PDF_FLAG_KEYS,
  ASSESSMENT_PDF_TEXT_KEYS,
  type AssessmentDraft,
  type AssessmentPdfFlags,
  type AssessmentPdfTexts,
  type ClientCategoryItemSummary,
  type ClientCategoryWithItems,
} from "@/lib/types/assessment.types"

function str(value: unknown): string {
  return typeof value === "string" ? value : ""
}

function num(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0
}

function arr(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? (value as Record<string, unknown>[]) : []
}

/** "08:00:00" → "08:00" para los time pickers */
function normalizeTime(value: unknown): string {
  const raw = str(value)
  const match = raw.match(/^(\d{2}:\d{2})(:\d{2})?$/)
  return match ? match[1] : raw
}

function enumOrEmpty<T extends string>(value: unknown, allowed: readonly T[]): T | "" {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : ""
}

/**
 * Item del borrador: el id usable en create es `clientServicePlanCategoryItemId`
 * (el `id` del snapshot Assessment viene null).
 */
function normalizeDraftItem(raw: unknown): ClientCategoryItemSummary {
  const entry = (raw ?? {}) as Record<string, unknown>
  const id =
    str(entry.clientServicePlanCategoryItemId) ||
    str(entry.id)
  return {
    id,
    name:
      str(entry.clientServicePlanCategoryItemName) ||
      str(entry.name) ||
      str(entry.itemName),
    hypothesizedFunctions: parseHypothesizedFunctions(entry.hypothesizedFunction),
    intensityKey: typeof entry.intensityKey === "string" && entry.intensityKey.trim()
      ? entry.intensityKey.trim()
      : null,
    intensityDescription: str(entry.intensityDescription),
    prevalentSetting: str(entry.prevalentSetting),
    preventiveStrategies: str(entry.preventiveStrategies),
    managementStrategies: str(entry.managementStrategies),
  }
}

function normalizeDraftCategories(raw: unknown): ClientCategoryWithItems[] {
  const categories = Array.isArray(raw)
    ? raw
    : (raw as { categories?: unknown })?.categories

  if (!Array.isArray(categories)) return []

  return categories
    .map((entryRaw) => {
      const entry = (entryRaw ?? {}) as Record<string, unknown>
      const id =
        str(entry.clientServicePlanCategoryId) ||
        str(entry.id)
      return {
        id,
        name: str(entry.name),
        items: Array.isArray(entry.items) ? entry.items.map(normalizeDraftItem) : [],
      }
    })
    .filter((category) => category.id || category.items.length > 0)
}

function normalizeDraftPdfTexts(raw: Record<string, unknown>): AssessmentPdfTexts {
  const pdfTexts = {} as AssessmentPdfTexts
  for (const key of ASSESSMENT_PDF_TEXT_KEYS) {
    pdfTexts[key] = str(raw[key]) || ASSESSMENT_PDF_DEFAULT_TEXTS[key]
  }
  return pdfTexts
}

function normalizeDraftPdfFlags(raw: Record<string, unknown>): AssessmentPdfFlags {
  const pdfFlags = {} as AssessmentPdfFlags
  for (const key of ASSESSMENT_PDF_FLAG_KEYS) {
    // Contrato: null ≡ true. Las obligatorias del front siempre quedan true.
    pdfFlags[key] =
      ASSESSMENT_PDF_MANDATORY_FLAGS.has(key) ||
      (raw[key] == null ? true : Boolean(raw[key]))
  }
  return pdfFlags
}

/**
 * `GET /client-service-plan/client/{clientId}/assessment-data`
 *
 * Borrador con la misma forma pública del Assessment (auto-create 97151 + SP
 * activo + providers + PA vigente). Sin Assessment persistido: IDs de snapshot
 * en null; IDs fuente en categories/providers/billing.
 */
export async function getAssessmentDataByClient(clientId: string): Promise<AssessmentDraft> {
  const response = await serviceGet<unknown>(
    `/client-service-plan/client/${clientId}/assessment-data`,
  )

  if (response.status !== 200 || !response.data) {
    throw new Error(
      (response.data as { message?: string } | undefined)?.message ||
        "Failed to fetch assessment data for client",
    )
  }

  const data = response.data as unknown
  // Compat: array plano legacy = sólo categorías
  if (Array.isArray(data)) {
    return emptyDraftForClient(clientId, normalizeDraftCategories(data))
  }

  const raw = (data ?? {}) as Record<string, unknown>
  const categories = normalizeDraftCategories(raw)

  const billingCodeLabels: Record<string, string> = {}
  const billingCodes = arr(raw.billingCodes)
    .map((row) => {
      const billingCodeId = str(row.billingCodeId)
      if (!billingCodeId) return null
      const code = str(row.billingCode)
      if (code) billingCodeLabels[billingCodeId] = code
      return {
        billingCodeId,
        unitsPeriod: typeof row.unitsPeriod === "number" ? row.unitsPeriod : 0,
        unitsWeek: typeof row.unitsWeek === "number" ? row.unitsWeek : 0,
        settings: str(row.settings),
      }
    })
    .filter((row): row is NonNullable<typeof row> => row != null)

  const providerFiles = arr(raw.providerFiles).map((p) => ({
    type: str(p.type),
    name: str(p.name),
    contactIformation: str(p.contactIformation) || str(p.contactInformation),
  }))

  const housingMembers = arr(raw.housingMembers)
  const assessmentConductedList = arr(raw.assessmentConductedList)

  return {
    clientId: str(raw.clientId) || clientId,
    clientName: str(raw.clientName),
    assessmentType: str(raw.assessmentType) || "Initial Assessment",
    schoolName: str(raw.schoolName),
    timeInit: normalizeTime(raw.timeInit),
    timeEnd: normalizeTime(raw.timeEnd),
    gradeCatalogId: str(raw.gradeCatalogId),
    schoolAddress: str(raw.schoolAddress),
    housingType: enumOrEmpty(raw.housingType, ["HOME", "FOSTER_HOME", "PPEC"] as const),
    housingNumberRooms: num(raw.housingNumberRooms),
    housingNumberBathrooms: num(raw.housingNumberBathrooms),
    housingMemberRelationshipCatalogIds: housingMembers
      .map((m) => str(m.relationshipCatalogId) || str(m.relationshipId) || str(m.id))
      .filter(Boolean),
    housingInformation: str(raw.housingInformation),
    medicalHistoryOtherDiagnosis: str(raw.medicalHistoryOtherDiagnosis) || "N/A",
    medicalHistoryMorbidities: str(raw.medicalHistoryMorbidities) || "N/A",
    medicalHistoryAllergies: str(raw.medicalHistoryAllergies) || "N/A",
    medicalHistoryTypeOfBirth: enumOrEmpty(raw.medicalHistoryTypeOfBirth, [
      "CaesareanSection",
      "NaturalChildbirth",
    ] as const),
    previousAbaTherapy: str(raw.previousAbaTherapy),
    previousAgencyName: str(raw.previousAgencyName),
    otherServicesSpeechTherapy: raw.otherServicesSpeechTherapy === true,
    otherServicesOccupationalTherapy: raw.otherServicesOccupationalTherapy === true,
    otherServicesPhysicalTherapy: raw.otherServicesPhysicalTherapy === true,
    otherServicesFeedingTherapy: raw.otherServicesFeedingTherapy === true,
    otherServicesOther: str(raw.otherServicesOther),
    otherServicesFacilityName: str(raw.otherServicesFacilityName),
    backgroundSummary: str(raw.backgroundSummary),
    backgroundStrengths: str(raw.backgroundStrengths),
    backgroundWeaknesses: str(raw.backgroundWeaknesses),
    backgroundInterest: str(raw.backgroundInterest),
    backgroundCommunicationSkills: str(raw.backgroundCommunicationSkills),
    backgroundAcademicSkills: str(raw.backgroundAcademicSkills),
    backgroundSelfCareSkills: str(raw.backgroundSelfCareSkills),
    backgroundSocialSkills: str(raw.backgroundSocialSkills),
    backgroundSafetySkills: str(raw.backgroundSafetySkills),
    backgroundSelfAdvocacy: str(raw.backgroundSelfAdvocacy),
    backgroundSelfPreservationSkills: str(raw.backgroundSelfPreservationSkills),
    backgroundMotorSkills: str(raw.backgroundMotorSkills),
    currentMedicationsDenied: raw.currentMedicationsDenied === true,
    currentMedicationsNote: str(raw.currentMedicationsNote),
    currentMedications: arr(raw.currentMedications).map((m) => ({
      name: str(m.name),
      dosage: str(m.dosage),
      frequency: str(m.frequency),
      details: str(m.details),
    })),
    observations: arr(raw.observations).map((o) => ({
      date: str(o.date).split("T")[0],
      setting: str(o.setting),
      summary: str(o.summary),
    })),
    assessmentConductedCatalogIds: assessmentConductedList
      .map((c) => str(c.assessmentConductedCatalogId))
      .filter(Boolean),
    categories,
    billingCodes,
    billingCodeLabels,
    proposedSchedule: arr(raw.proposedSchedule).map((s) => ({
      credentialId: str(s.credentialId),
      schedule: str(s.schedule),
    })),
    abcData: arr(raw.abcData).map((a) => ({
      antecedent: str(a.antecedent),
      behavior: str(a.behavior),
      consequence: str(a.consequence),
    })),
    providerFiles,
    pdfTexts: normalizeDraftPdfTexts(raw),
    pdfFlags: normalizeDraftPdfFlags(raw),
  }
}

function emptyDraftForClient(clientId: string, categories: ClientCategoryWithItems[]): AssessmentDraft {
  const pdfFlags = {} as AssessmentPdfFlags
  for (const key of ASSESSMENT_PDF_FLAG_KEYS) {
    pdfFlags[key] = ASSESSMENT_PDF_MANDATORY_FLAGS.has(key)
  }
  return {
    clientId,
    clientName: "",
    assessmentType: "Initial Assessment",
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
    categories,
    billingCodes: [],
    billingCodeLabels: {},
    proposedSchedule: [],
    abcData: [],
    providerFiles: [],
    pdfTexts: { ...ASSESSMENT_PDF_DEFAULT_TEXTS },
    pdfFlags,
  }
}

/**
 * Solo categorías/items del SP activo. Preferir `getAssessmentDataByClient` en
 * create; este helper queda para callers que sólo necesitan el árbol.
 */
export async function getClientCategoryItems(clientId: string): Promise<ClientCategoryWithItems[]> {
  const draft = await getAssessmentDataByClient(clientId)
  return draft.categories
}
