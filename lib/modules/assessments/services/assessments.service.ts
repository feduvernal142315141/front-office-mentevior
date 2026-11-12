import { serviceDelete, serviceGet, servicePatch, servicePost, servicePut } from "@/lib/services/baseService"
import { parseHypothesizedFunctions } from "@/lib/constants/hypothesized-function"
import {
  ASSESSMENT_PDF_FLAG_KEYS,
  ASSESSMENT_PDF_TEXT_KEYS,
  type AssessmentPdfFlags,
  type AssessmentPdfTexts,
  type AssessmentStatus,
  type AssessmentType,
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
  AssessmentProposedScheduleEntry,
  AssessmentProviderFileInput,
  AssessmentPreferenceRow,
  SaveAssessmentDto,
} from "@/lib/types/assessment.types"
import type { PaginatedResponse } from "@/lib/types/response.types"
import { getQueryString } from "@/lib/utils/format"
import type { QueryModel } from "@/lib/models/queryModel"
import { FilterOperator } from "@/lib/models/filterOperator"
import { buildFilters } from "@/lib/utils/query-filters"

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((v) => String(v ?? "")).filter((v) => v.length > 0)
}

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

  return {
    assessments: assessments.map((item) =>
      normalizeAssessmentListItem(item as unknown as Record<string, unknown>),
    ),
    totalCount,
  }
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

export async function getLatestAssessmentForReplacement(
  clientId: string,
  currentAssessmentId: string,
): Promise<AssessmentDetail | null> {
  const { assessments } = await getAssessments({
    page: 0,
    pageSize: 1,
    orders: ["createAt__DESC", "id__DESC"],
    filters: buildFilters([
      { field: "clientId", operator: FilterOperator.eq, type: "uuid", value: clientId },
      { field: "id", operator: FilterOperator.neq, type: "uuid", value: currentAssessmentId },
      { field: "active", operator: FilterOperator.eq, type: "boolean", value: true },
    ]),
  })
  const latest = assessments[0]
  if (!latest || latest.id === currentAssessmentId || latest.clientId !== clientId) return null

  const source = await getAssessmentById(latest.id)
  return source?.clientId === clientId && source.active ? source : null
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

export async function deleteAssessment(id: string): Promise<void> {
  const response = await serviceDelete<never, boolean>(`${BASE_URL}/${encodeURIComponent(id)}`)

  if (response?.status !== 200 || response.data !== true) {
    throw new Error(response?.data?.message || "Failed to delete assessment")
  }
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

/**
 * Re-activate a closed assessment (`Close → Active`).
 * PATCH /assessments/activate
 */
export async function activateAssessment(assessmentId: string): Promise<string | null> {
  try {
    const response = await servicePatch<{ assessmentId: string }, string>(
      `${BASE_URL}/activate`,
      { assessmentId },
    )
    if (response.status !== 200) return null
    const data = response.data as unknown
    return typeof data === "string" && data.trim() ? data.trim() : assessmentId
  } catch {
    return null
  }
}

/**
 * Lock a closed assessment for billing (`Close → Lock`, terminal).
 * PATCH /assessments/lock
 */
export async function lockAssessment(assessmentId: string): Promise<string | null> {
  try {
    const response = await servicePatch<{ assessmentId: string }, string>(
      `${BASE_URL}/lock`,
      { assessmentId },
    )
    if (response.status !== 200) return null
    const data = response.data as unknown
    return typeof data === "string" && data.trim() ? data.trim() : assessmentId
  } catch {
    return null
  }
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

function normalizePreferenceAssessment(value: unknown): AssessmentPreferenceRow[] {
  return Array.isArray(value)
    ? value.map((row) => ({
        people: str((row as Record<string, unknown>).people),
        tangibles: str((row as Record<string, unknown>).tangibles),
        activities: str((row as Record<string, unknown>).activities),
        social: str((row as Record<string, unknown>).social),
        other: str((row as Record<string, unknown>).other),
      }))
    : []
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

/** Backend sends PascalCase (Read/Active/Close/Lock); UI uses lowercase. */
export function parseAssessmentStatus(raw: unknown): AssessmentStatus {
  const value = String(raw ?? "").trim().toLowerCase()
  if (value === "read" || value === "active" || value === "close" || value === "lock") {
    return value
  }
  return "active"
}

function parseAssessmentType(value: unknown): AssessmentType {
  return ["Re-Assessment", "RE_ASSESSMENT"].includes(str(value))
    ? "RE_ASSESSMENT"
    : "INITIAL_ASSESSMENT"
}

function normalizeAssessmentListItem(raw: Record<string, unknown>): AssessmentListItem {
  const housingType = enumOrEmpty(raw.housingType, ["HOME", "FOSTER_HOME", "PPEC"] as const)
  return {
    id: str(raw.id),
    clientId: str(raw.clientId),
    clientName: str(raw.clientName),
    assessmentType: parseAssessmentType(raw.assessmentType),
    linkedToAppointment: raw.linkedToAppointment === true,
    schoolName: str(raw.schoolName),
    gradeCatalogId: str(raw.gradeCatalogId),
    gradeName: str(raw.gradeName),
    housingType: housingType || null,
    medicalHistoryPrimaryDiagnosisName: str(raw.medicalHistoryPrimaryDiagnosisName) || null,
    createAt: str(raw.createAt),
    status: parseAssessmentStatus(raw.status),
    active: raw.active === undefined ? true : Boolean(raw.active),
  }
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
    prescriber: str(m.prescriber),
  }))

  // observations retired — absorbed into abcData

  const assessmentConductedList: AssessmentConductedEntry[] = arr(raw.assessmentConductedList).map((c) => ({
    assessmentConductedCatalogId: str(c.assessmentConductedCatalogId),
    name: str(c.assessmentConductedName) || str(c.name),
  }))

  const categoriesItems: AssessmentCategoryItemEntry[] = arr(raw.categoriesItems).map((i) => ({
    clientServicePlanCategoryItemId: str(i.clientServicePlanCategoryItemId),
    itemName: str(i.clientServicePlanCategoryItemName) || str(i.itemName),
    intensityKey: str(i.intensityKey) || null,
    intensityDescription: str(i.intensityDescription),
    hypothesizedFunction: parseHypothesizedFunctions(i.hypothesizedFunction),
    placesOfService: parseStringArray(i.placesOfService),
    preventiveStrategies: str(i.preventiveStrategies),
    otherPreventiveStrategies: str(i.otherPreventiveStrategies) || null,
    managementStrategies: str(i.managementStrategies),
  }))

  const categories = arr(raw.categories).map((category) => ({
    id: str(category.clientServicePlanCategoryId) || str(category.id),
    name: str(category.name),
    items: arr(category.items)
      .filter((item) => Boolean(item.clientServicePlanCategoryItemId))
      .map((item) => ({
        id: str(item.clientServicePlanCategoryItemId),
        name: str(item.clientServicePlanCategoryItemName),
        hypothesizedFunctions: parseHypothesizedFunctions(item.hypothesizedFunction),
        intensityKey: str(item.intensityKey) || null,
        intensityDescription: str(item.intensityDescription),
        description: str(item.description),
        collectionMethod: str(item.collectionMethod),
        procedures: str(item.procedures) || null,
        placesOfService: parseStringArray(item.placesOfService),
        preventiveStrategies: str(item.preventiveStrategies),
        managementStrategies: str(item.managementStrategies),
      })),
  }))

  const billingCodes: AssessmentBillingCodeEntry[] = arr(raw.billingCodes).map((b) => ({
    billingCodeId: str(b.billingCodeId),
    billingCode: str(b.billingCode),
    unitsPeriod: num(b.unitsPeriod),
    unitsWeek: num(b.unitsWeek),
    placesOfService: parseStringArray(b.placesOfService),
  }))

  const proposedSchedule: AssessmentProposedScheduleEntry[] = arr(raw.proposedSchedule).map((s) => ({
    credentialId: str(s.credentialId),
    credential: str(s.credential),
    schedule: str(s.schedule),
  }))

  const abcData: AssessmentAbcInput[] = arr(raw.abcData).map((a) => ({
    date: str(a.date).split("T")[0],
    placesOfService: parseStringArray(a.placesOfService),
    antecedent: str(a.antecedent),
    behavior: str(a.behavior),
    consequence: str(a.consequence),
  }))

  const providerFiles: AssessmentProviderFileInput[] = arr(raw.providerFiles).map((p) => ({
    providerOnFileId: str(p.providerOnFileId) || undefined,
    providerSource: str(p.providerSource) || undefined,
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
    assessmentType: parseAssessmentType(raw.assessmentType),
    updateAt: typeof raw.updateAt === "number" ? raw.updateAt : str(raw.updateAt) || null,
    hasCaregiverSignature: Boolean(raw.caregiverSignatureImage) || raw.caregiverSignatureChecked === true,
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
    medicalHistoryReasonForReferral: str(raw.medicalHistoryReasonForReferral),
    medicalHistoryPrimaryDiagnosisId: str(raw.medicalHistoryPrimaryDiagnosisId) || null,
    medicalHistoryPrimaryDiagnosisName: str(raw.medicalHistoryPrimaryDiagnosisName) || null,
    medicalHistoryOtherDiagnosis: str(raw.medicalHistoryOtherDiagnosis),
    medicalHistoryMorbidities: str(raw.medicalHistoryMorbidities),
    medicalHistoryAllergies: str(raw.medicalHistoryAllergies),
    medicalHistoryTypeOfBirth: enumOrEmpty(raw.medicalHistoryTypeOfBirth, [
      "CaesareanSection",
      "NaturalChildbirth",
    ] as const),
    previousAbaTherapy: str(raw.previousAbaTherapy),
    previousAgencyName: str(raw.previousAgencyName),
    otherServicesSpeechTherapy: raw.otherServicesSpeechTherapy === true,
    otherServicesSpeechTherapyFacilityName: str(raw.otherServicesSpeechTherapyFacilityName),
    otherServicesOccupationalTherapy: raw.otherServicesOccupationalTherapy === true,
    otherServicesOccupationalTherapyFacilityName: str(raw.otherServicesOccupationalTherapyFacilityName),
    otherServicesPhysicalTherapy: raw.otherServicesPhysicalTherapy === true,
    otherServicesPhysicalTherapyFacilityName: str(raw.otherServicesPhysicalTherapyFacilityName),
    otherServicesFeedingTherapy: raw.otherServicesFeedingTherapy === true,
    otherServicesFeedingTherapyFacilityName: str(raw.otherServicesFeedingTherapyFacilityName),
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
    currentMedications,
    assessmentConductedList,
    categoriesItems,
    categories,
    billingCodes,
    proposedSchedule,
    abcData,
    providerFiles,
    preferenceAssessment: normalizePreferenceAssessment(raw.preferenceAssessment),
    ...pdfTexts,
    ...pdfFlags,
    createAt: str(raw.createAt),
    status: parseAssessmentStatus(raw.status),
    notCanEdit: Boolean(raw.notCanEdit),
    linkedToAppointment: typeof raw.linkedToAppointment === "boolean" ? raw.linkedToAppointment : undefined,
    active: raw.active === undefined ? true : Boolean(raw.active),
  }
}
