/**
 * Assessment — contrato de commands/queries 2026-08-17 (`plans/assessment.md`).
 * Los enums viajan con el nombre exacto del valor Java.
 *
 * La validación de backend está temporalmente desactivada (ningún campo es
 * requerido a nivel validator), pero el front conserva las reglas que quedaron
 * comentadas para reactivación: clientId, timeInit < timeEnd, fecha por
 * observación, ids por fila en billingCodes/proposedSchedule y no-negativos.
 */

export type SchoolSetting = "REGULAR" | "SPECIAL" | "ADVANCED"
export type HousingType = "HOME" | "FOSTER_HOME" | "PPEC"
export type AssessmentIntensityKey = "MILD" | "MODERATE" | "HIGH"
export type HypothesizedFunction = "ESCAPE" | "ATTENTION" | "SENSORY" | "TANGIBLE"

/** `GET /grade/catalog` y `GET /assessment-conducted/catalog` comparten la forma */
export interface AssessmentCatalogItem {
  id: string
  code: string
  name: string
  sortOrder: number
}

/** `GET /client-service-plan/client/{clientId}/category-items` — SP activo del cliente */
export interface ClientCategoryWithItems {
  id: string
  name: string
  items: { id: string; name: string }[]
}

export interface AssessmentMedicationInput {
  name: string
  dosage: string
  frequency: string
  details: string
}

export interface AssessmentObservationInput {
  /** yyyy-MM-dd; requerido cuando la observación se envía */
  date: string
  setting: string
  summary: string
}

export interface AssessmentCategoryItemInput {
  clientServicePlanCategoryItemId: string
  intensityKey: AssessmentIntensityKey | null
  intensityDescription: string
  hypothesizedFunction: HypothesizedFunction | null
}

export interface AssessmentBillingCodeInput {
  billingCodeId: string
  /** No negativos */
  unitsPeriod: number
  unitsWeek: number
  /** JSON string libre; el front serializa `{"location":...,"notes":...}` */
  settings: string
}

export interface AssessmentProposedScheduleInput {
  credentialId: string
  /**
   * JSON string con exactamente las 7 keys Monday…Sunday y valores numéricos
   * (horas). Se arma con `serializeProposedSchedule`.
   */
  schedule: string
}

export interface AssessmentAbcInput {
  antecedent: string
  behavior: string
  consequence: string
}

export interface AssessmentProviderFileInput {
  type: string
  name: string
  /** [sic] El backend define la propiedad con este typo; no corregir */
  contactIformation: string
}

/** Los 12 campos de background del cliente; todos String libres */
export interface AssessmentBackgroundFields {
  backgroundSummary: string
  backgroundStrengths: string
  backgroundWeaknesses: string
  backgroundInterest: string
  backgroundCommunicationSkills: string
  backgroundAcademicSkills: string
  backgroundSelfCareSkills: string
  backgroundSocialSkills: string
  backgroundSafetySkills: string
  backgroundSelfAdvocacy: string
  backgroundSelfPreservationSkills: string
  backgroundMotorSkills: string
}

/**
 * Request de `POST /assessments` (`CreateAssessmentCommand`). `PUT /assessments`
 * usa el mismo body más `id` (el service lo agrega). Las colecciones se mandan
 * completas: el update reemplaza las hijas.
 */
export interface SaveAssessmentDto extends AssessmentBackgroundFields {
  clientId: string
  schoolName: string
  /** HH:mm:ss, o null si no se capturó */
  timeInit: string | null
  timeEnd: string | null
  gradeCatalogId: string | null
  schoolSetting: SchoolSetting | null
  schoolAddress: string
  housingType: HousingType | null
  housingNumberRooms: number
  housingNumberBathrooms: number
  housingMemberRelationshipCatalogIds: string[]
  housingInformation: string
  medicalHistoryOtherDiagnosis: string
  medicalHistoryMorbidities: string
  medicalHistoryAllergies: string
  medicalHistoryTypeOfBirth: string
  medicalHistoryChildSpecialCharacteristic: string
  medicalHistoryAdditionalInfo: string
  currentMedications: AssessmentMedicationInput[]
  observations: AssessmentObservationInput[]
  assessmentConductedCatalogIds: string[]
  categoriesItems: AssessmentCategoryItemInput[]
  billingCodes: AssessmentBillingCodeInput[]
  proposedSchedule: AssessmentProposedScheduleInput[]
  abcData: AssessmentAbcInput[]
  providerFiles: AssessmentProviderFileInput[]
}

/** Item de `GET /assessments` (`GetAssessmentResponseModel`) */
export interface AssessmentListItem {
  id: string
  clientId: string
  clientName: string
  schoolName: string
  gradeCatalogId: string
  gradeName: string
  housingType: HousingType | null
  medicalHistoryPrimaryDiagnosisName: string | null
  createAt: string
  active: boolean
}

/** Fila de `housingMembers` en el detalle, con la relación resuelta */
export interface AssessmentHousingMember {
  relationshipCatalogId: string
  relationshipName: string
}

/** Fila de `assessmentConductedList` en el detalle (`assessmentConductedName` resuelto) */
export interface AssessmentConductedEntry {
  assessmentConductedCatalogId: string
  name: string
}

/** Fila de `categoriesItems` en el detalle, con el nombre del item resuelto */
export interface AssessmentCategoryItemEntry {
  clientServicePlanCategoryItemId: string
  itemName: string
  intensityKey: AssessmentIntensityKey | null
  intensityDescription: string
  hypothesizedFunction: HypothesizedFunction | null
}

/** Fila de `billingCodes` en el detalle, con el código resuelto */
export interface AssessmentBillingCodeEntry extends AssessmentBillingCodeInput {
  billingCode: string
}

/** Fila de `proposedSchedule` en el detalle, con la credencial resuelta */
export interface AssessmentProposedScheduleEntry extends AssessmentProposedScheduleInput {
  credential: string
}

/** `GET /assessments/{id}`, normalizado en `normalizeAssessmentDetail` */
export interface AssessmentDetail extends AssessmentBackgroundFields {
  id: string
  clientId: string
  clientName: string
  schoolName: string
  /** HH:mm (normalizado desde HH:mm:ss para los pickers) */
  timeInit: string
  timeEnd: string
  gradeCatalogId: string
  gradeName: string
  schoolSetting: SchoolSetting | ""
  schoolAddress: string
  housingType: HousingType | ""
  housingNumberRooms: number
  housingNumberBathrooms: number
  housingMembers: AssessmentHousingMember[]
  housingInformation: string
  medicalHistoryPrimaryDiagnosisId: string | null
  medicalHistoryPrimaryDiagnosisName: string | null
  medicalHistoryOtherDiagnosis: string
  medicalHistoryMorbidities: string
  medicalHistoryAllergies: string
  medicalHistoryTypeOfBirth: string
  medicalHistoryChildSpecialCharacteristic: string
  medicalHistoryAdditionalInfo: string
  currentMedications: AssessmentMedicationInput[]
  observations: AssessmentObservationInput[]
  assessmentConductedList: AssessmentConductedEntry[]
  categoriesItems: AssessmentCategoryItemEntry[]
  billingCodes: AssessmentBillingCodeEntry[]
  proposedSchedule: AssessmentProposedScheduleEntry[]
  abcData: AssessmentAbcInput[]
  providerFiles: AssessmentProviderFileInput[]
  createAt: string
  active: boolean
}
