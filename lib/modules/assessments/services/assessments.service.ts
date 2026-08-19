import { serviceGet, servicePost, servicePut } from "@/lib/services/baseService"
import {
  ASSESSMENT_PDF_FLAG_KEYS,
  ASSESSMENT_PDF_TEXT_KEYS,
  type AssessmentPdfFlags,
  type AssessmentPdfTexts,
} from "@/lib/types/assessment.types"
import type {
  AssessmentAbcInput,
  AssessmentBillingCodeEntry,
  AssessmentCategoryItemEntry,
  AssessmentConductedEntry,
  AssessmentDetail,
  AssessmentHousingMember,
  AssessmentListItem,
  AssessmentMedicationInput,
  AssessmentObservationInput,
  AssessmentProposedScheduleEntry,
  AssessmentProviderFileInput,
  SaveAssessmentDto,
} from "@/lib/types/assessment.types"
import type { PaginatedResponse } from "@/lib/types/response.types"
import { getQueryString } from "@/lib/utils/format"
import type { QueryModel } from "@/lib/models/queryModel"

const BASE_URL = "/assessments"

export async function getAssessments(
  query: QueryModel,
): Promise<{ assessments: AssessmentListItem[]; totalCount: number }> {
  const response = await serviceGet<PaginatedResponse<AssessmentListItem>>(
    `${BASE_URL}${query ? `?${getQueryString(query)}` : ""}`,
  )

  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch assessments")
  }

  // El contrato 2026-08-18 responde `{items, page, pageSize, total}`; se acepta
  // también la forma estándar `{entities, pagination}` por si el backend la
  // unifica después.
  const data = response.data as unknown as {
    items?: AssessmentListItem[]
    total?: number
    entities?: AssessmentListItem[]
    pagination?: { total?: number; totalAmount?: number }
  }

  const assessments = Array.isArray(data.items)
    ? data.items
    : Array.isArray(data.entities)
      ? data.entities
      : null

  if (!assessments) {
    console.error("Invalid backend response:", response.data)
    return { assessments: [], totalCount: 0 }
  }

  const totalCount =
    data.total ?? data.pagination?.totalAmount ?? data.pagination?.total ?? assessments.length

  return { assessments, totalCount }
}

export async function getAssessmentById(id: string): Promise<AssessmentDetail | null> {
  const response = await serviceGet<Record<string, unknown>>(`${BASE_URL}/${id}`)

  if (response.status === 404) {
    return null
  }

  if (response.status !== 200 || !response.data) {
    throw new Error((response.data as { message?: string })?.message || "Failed to fetch assessment")
  }

  return normalizeAssessmentDetail(response.data as unknown as Record<string, unknown>)
}

export async function createAssessment(data: SaveAssessmentDto): Promise<string> {
  const response = await servicePost<SaveAssessmentDto, string>(BASE_URL, data)

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to create assessment")
  }

  return extractId(response.data, "create")
}

/** `PUT /assessments` recibe el `id` dentro del body, no en la ruta */
export async function updateAssessment(id: string, data: SaveAssessmentDto): Promise<string> {
  const response = await servicePut<SaveAssessmentDto & { id: string }, string>(BASE_URL, { id, ...data })

  if (response.status !== 200 && response.status !== 204) {
    throw new Error(response.data?.message || "Failed to update assessment")
  }

  return extractId(response.data, "update") || id
}

/**
 * URL del proxy same-origin que sirve el PDF "Behavior Analysis Assessment and
 * Support Plan" de un assessment existente. El nombre va en la ruta para que el
 * visor de Chrome muestre un nombre real (mismo patrón que Clinical Monthly).
 */
export function getAssessmentPdfUrl(
  assessmentId: string,
  fileName = "Behavior Analysis Assessment and Support Plan.pdf",
): string {
  const safeName = encodeURIComponent(fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`)
  return `/api/reports/assessment/preview/${safeName}?assessmentId=${encodeURIComponent(assessmentId)}`
}

/** El backend responde el UUID pelado; algunos entornos lo envuelven (patrón clinical-monthly) */
function extractId(payload: unknown, action: "create" | "update"): string {
  if (typeof payload === "string" && payload.trim()) return payload.trim()

  if (payload && typeof payload === "object") {
    const candidate = (payload as Record<string, unknown>).id ?? (payload as Record<string, unknown>).data
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim()
  }

  if (action === "create") {
    throw new Error("Assessment response did not include an id")
  }

  return ""
}

/* ─── Normalización del detalle ───
 * JSON confirmado por backend el 2026-08-17 (contrato completo con colecciones
 * hijas). Las filas hijas traen su `id` de tabla, que el front no necesita:
 * el PUT reemplaza colecciones completas, así que no se propaga. */

function str(value: unknown): string {
  return typeof value === "string" ? value : ""
}

function num(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0
}

function arr(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? (value as Record<string, unknown>[]) : []
}

/** "08:00:00" → "08:00" para los time pickers; cualquier otra cosa pasa tal cual */
function normalizeTime(value: unknown): string {
  const raw = str(value)
  const match = raw.match(/^(\d{2}:\d{2})(:\d{2})?$/)
  return match ? match[1] : raw
}

function enumOrEmpty<T extends string>(value: unknown, allowed: readonly T[]): T | "" {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : ""
}

function normalizeAssessmentDetail(raw: Record<string, unknown>): AssessmentDetail {
  const housingMembers: AssessmentHousingMember[] = arr(raw.housingMembers).map((m) => ({
    relationshipCatalogId: str(m.relationshipCatalogId) || str(m.relationshipId) || str(m.id),
    relationshipName: str(m.relationshipName) || str(m.name),
  }))

  const currentMedications: AssessmentMedicationInput[] = arr(raw.currentMedications).map((m) => ({
    name: str(m.name),
    dosage: str(m.dosage),
    frequency: str(m.frequency),
    details: str(m.details),
  }))

  const observations: AssessmentObservationInput[] = arr(raw.observations).map((o) => ({
    date: str(o.date).split("T")[0],
    setting: str(o.setting),
    summary: str(o.summary),
  }))

  const assessmentConductedList: AssessmentConductedEntry[] = arr(raw.assessmentConductedList).map((c) => ({
    assessmentConductedCatalogId: str(c.assessmentConductedCatalogId),
    name: str(c.assessmentConductedName) || str(c.name),
  }))

  const categoriesItems: AssessmentCategoryItemEntry[] = arr(raw.categoriesItems).map((i) => ({
    clientServicePlanCategoryItemId: str(i.clientServicePlanCategoryItemId),
    itemName: str(i.clientServicePlanCategoryItemName) || str(i.itemName),
    intensityKey: enumOrEmpty(i.intensityKey, ["MILD", "MODERATE", "HIGH"] as const) || null,
    intensityDescription: str(i.intensityDescription),
    hypothesizedFunction:
      enumOrEmpty(i.hypothesizedFunction, ["ESCAPE", "ATTENTION", "SENSORY", "TANGIBLE"] as const) || null,
    prevalentSetting: str(i.prevalentSetting),
    preventiveStrategies: str(i.preventiveStrategies),
    managementStrategies: str(i.managementStrategies),
  }))

  const billingCodes: AssessmentBillingCodeEntry[] = arr(raw.billingCodes).map((b) => ({
    billingCodeId: str(b.billingCodeId),
    billingCode: str(b.billingCode),
    unitsPeriod: num(b.unitsPeriod),
    unitsWeek: num(b.unitsWeek),
    settings: str(b.settings),
  }))

  const proposedSchedule: AssessmentProposedScheduleEntry[] = arr(raw.proposedSchedule).map((s) => ({
    credentialId: str(s.credentialId),
    credential: str(s.credential),
    schedule: str(s.schedule),
  }))

  const abcData: AssessmentAbcInput[] = arr(raw.abcData).map((a) => ({
    antecedent: str(a.antecedent),
    behavior: str(a.behavior),
    consequence: str(a.consequence),
  }))

  const providerFiles: AssessmentProviderFileInput[] = arr(raw.providerFiles).map((p) => ({
    type: str(p.type),
    name: str(p.name),
    // [sic] typo del contrato; se acepta la variante corregida por si backend la arregla
    contactIformation: str(p.contactIformation) || str(p.contactInformation),
  }))

  const pdfTexts = {} as AssessmentPdfTexts
  for (const key of ASSESSMENT_PDF_TEXT_KEYS) {
    pdfTexts[key] = str(raw[key])
  }

  // `null` en un flag equivale a visible (regla del contrato)
  const pdfFlags = {} as AssessmentPdfFlags
  for (const key of ASSESSMENT_PDF_FLAG_KEYS) {
    pdfFlags[key] = raw[key] == null ? true : Boolean(raw[key])
  }

  return {
    id: str(raw.id),
    clientId: str(raw.clientId),
    clientName: str(raw.clientName),
    schoolName: str(raw.schoolName),
    timeInit: normalizeTime(raw.timeInit),
    timeEnd: normalizeTime(raw.timeEnd),
    gradeCatalogId: str(raw.gradeCatalogId),
    gradeName: str(raw.gradeName),
    schoolAddress: str(raw.schoolAddress),
    housingType: enumOrEmpty(raw.housingType, ["HOME", "FOSTER_HOME", "PPEC"] as const),
    housingNumberRooms: num(raw.housingNumberRooms),
    housingNumberBathrooms: num(raw.housingNumberBathrooms),
    housingMembers,
    housingInformation: str(raw.housingInformation),
    medicalHistoryPrimaryDiagnosisId: str(raw.medicalHistoryPrimaryDiagnosisId) || null,
    medicalHistoryPrimaryDiagnosisName: str(raw.medicalHistoryPrimaryDiagnosisName) || null,
    medicalHistoryOtherDiagnosis: str(raw.medicalHistoryOtherDiagnosis),
    medicalHistoryMorbidities: str(raw.medicalHistoryMorbidities),
    medicalHistoryAllergies: str(raw.medicalHistoryAllergies),
    medicalHistoryTypeOfBirth: enumOrEmpty(raw.medicalHistoryTypeOfBirth, [
      "CaesareanSection",
      "NaturalChildbirth",
    ] as const),
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
    currentMedications,
    observations,
    assessmentConductedList,
    categoriesItems,
    billingCodes,
    proposedSchedule,
    abcData,
    providerFiles,
    ...pdfTexts,
    ...pdfFlags,
    createAt: str(raw.createAt),
    active: raw.active === undefined ? true : Boolean(raw.active),
  }
}
