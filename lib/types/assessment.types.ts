/**
 * Assessment — contrato de commands/queries 2026-08-17 (`plans/assessment.md`).
 * Los enums viajan con el nombre exacto del valor Java.
 *
 * La validación de backend está temporalmente desactivada (ningún campo es
 * requerido a nivel validator), pero el front conserva las reglas que quedaron
 * comentadas para reactivación: clientId, timeInit < timeEnd, fecha por
 * observación, ids por fila en billingCodes/proposedSchedule y no-negativos.
 *
 * Status lifecycle (2026-08-24): Read | Active | Close | Lock.
 */

/** Effective assessment lifecycle status from GET list/detail */
export type AssessmentStatus = "read" | "active" | "close" | "lock"

export type HousingType = "HOME" | "FOSTER_HOME" | "PPEC"
export type AssessmentIntensityKey = "MILD" | "MODERATE" | "HIGH"
export type HypothesizedFunction = "ESCAPE" | "ATTENTION" | "SENSORY" | "TANGIBLE"
/** Ojo: PascalCase, no SCREAMING_SNAKE como los demás enums */
export type MedicalHistoryTypeOfBirth = "CaesareanSection" | "NaturalChildbirth"

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
  prevalentSetting: string
  /** Antecedent interventions del item */
  preventiveStrategies: string
  /** Consequence interventions del item */
  managementStrategies: string
}

export interface AssessmentBillingCodeInput {
  billingCodeId: string
  /** No negativos */
  unitsPeriod: number
  unitsWeek: number
  /** Texto plano (p.ej. "Home, Community") — contrato 2026-08-18; antes era JSON */
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

/**
 * Textos editables del PDF (contrato 2026-08-18). Multilinea (`\n`).
 * En `POST`, un campo en `null` hace que el backend guarde su texto histórico
 * por defecto; en `PUT` se guarda lo enviado tal cual. En el PDF, un texto
 * vacío/null no pinta su subsección.
 */
export const ASSESSMENT_PDF_TEXT_KEYS = [
  // Generales
  "coordinationCare",
  "medicalNecessity",
  "caregiverTraining",
  "generalizationTraining",
  "fadingTransitionPlan",
  "crisisProcedures",
  "dischargeCriteria",
  "assessmentTreatmentConsent",
  // Preventive & antecedent strategies
  "noncontingentAttention",
  "thinNoncontingentAttention",
  "independentBreaks",
  "visualSupports",
  "communicationTraining",
  "verbalBehaviorInstruction",
  "delayDenialTolerance",
  "premackPrinciple",
  "promptFading",
  "shaping",
  "highProbabilityRequests",
  "behavioralMomentum",
  "pairing",
  // Consequence-based strategies
  "dra",
  "thinDra",
  "dri",
  "dro",
  "plannedIgnoring",
  "alternativeRedirection",
  "stopRedirectReinforce",
  "matchingLawTreatment",
] as const

export type AssessmentPdfTextKey = (typeof ASSESSMENT_PDF_TEXT_KEYS)[number]

/**
 * Flags de visibilidad de secciones del PDF. `null` en backend equivale a
 * `true`; el front siempre manda booleans explícitos.
 */
export const ASSESSMENT_PDF_FLAG_KEYS = [
  "showEmergencyContactInformation",
  "showSchoolInformation",
  "showHousingFamily",
  "showReferringPhysicians",
  "showFamilyCaregiversGuardians",
  "showMedicalHistory",
  "showCurrentMedications",
  "showCoordinationOfCare",
  "showProvidersOnFile",
  "showOtherServices",
  "showDocumentsReviewed",
  "showServiceLocations",
  "showBackgroundInformation",
  "showMedicalNecessityStatement",
  "showObservations",
  "showAbcDataRecording",
  "showAssessmentConducted",
  "showAssessmentCategories",
  "showPreventiveAndAntecedentStrategies",
  "showConsequenceBasedStrategies",
  "showFamilyCaregiverTraining",
  "showGeneralizationTraining",
  "showServiceFadingTransitionPlan",
  "showCrisisProcedures",
  "showDischargePlanCriteria",
  "showRecommendedServices",
  "showProposedSchedule",
  "showConsentAssessmentTreatment",
] as const

export type AssessmentPdfFlagKey = (typeof ASSESSMENT_PDF_FLAG_KEYS)[number]

export type AssessmentPdfTexts = Record<AssessmentPdfTextKey, string>
export type AssessmentPdfFlags = Record<AssessmentPdfFlagKey, boolean>
/** En el DTO los textos van en null cuando el usuario los dejó vacíos */
export type AssessmentPdfTextsPayload = Record<AssessmentPdfTextKey, string | null>

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
export interface SaveAssessmentDto extends AssessmentBackgroundFields, AssessmentPdfTextsPayload, AssessmentPdfFlags {
  clientId: string
  schoolName: string
  /** HH:mm:ss, o null si no se capturó */
  timeInit: string | null
  timeEnd: string | null
  gradeCatalogId: string | null
  schoolAddress: string
  housingType: HousingType | null
  housingNumberRooms: number
  housingNumberBathrooms: number
  housingMemberRelationshipCatalogIds: string[]
  housingInformation: string
  medicalHistoryOtherDiagnosis: string
  medicalHistoryMorbidities: string
  medicalHistoryAllergies: string
  medicalHistoryTypeOfBirth: MedicalHistoryTypeOfBirth | null
  /** Sección Other Services del PDF; requeridos cuando `showOtherServices` es true */
  previousAbaTherapy: string
  previousAgencyName: string
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
  /** Effective status: Read | Active | Close | Lock */
  status: AssessmentStatus
  /** Legacy boolean; prefer `status` for UI */
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
  prevalentSetting: string
  preventiveStrategies: string
  managementStrategies: string
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
export interface AssessmentDetail extends AssessmentBackgroundFields, AssessmentPdfTexts, AssessmentPdfFlags {
  id: string
  clientId: string
  clientName: string
  schoolName: string
  /** HH:mm (normalizado desde HH:mm:ss para los pickers) */
  timeInit: string
  timeEnd: string
  gradeCatalogId: string
  gradeName: string
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
  medicalHistoryTypeOfBirth: MedicalHistoryTypeOfBirth | ""
  previousAbaTherapy: string
  previousAgencyName: string
  currentMedications: AssessmentMedicationInput[]
  observations: AssessmentObservationInput[]
  assessmentConductedList: AssessmentConductedEntry[]
  categoriesItems: AssessmentCategoryItemEntry[]
  billingCodes: AssessmentBillingCodeEntry[]
  proposedSchedule: AssessmentProposedScheduleEntry[]
  abcData: AssessmentAbcInput[]
  providerFiles: AssessmentProviderFileInput[]
  createAt: string
  /** Effective status: Read | Active | Close | Lock */
  status: AssessmentStatus
  /**
   * Detail-only. `true` when status is Close/Lock, or when the linked
   * appointment marks notCanEdit for Read/Active. Never null from API.
   */
  notCanEdit: boolean
  /** Legacy boolean; prefer `status` / `notCanEdit` for UI */
  active: boolean
}
