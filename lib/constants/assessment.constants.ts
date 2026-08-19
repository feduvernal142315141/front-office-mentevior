import type {
  AssessmentIntensityKey,
  AssessmentPdfFlagKey,
  AssessmentPdfTextKey,
  HousingType,
  HypothesizedFunction,
  MedicalHistoryTypeOfBirth,
} from "@/lib/types/assessment.types"

export const HOUSING_TYPE_LABELS: Record<HousingType, string> = {
  HOME: "Home",
  FOSTER_HOME: "Foster Home",
  PPEC: "PPEC",
}

export const INTENSITY_KEY_LABELS: Record<AssessmentIntensityKey, string> = {
  MILD: "Mild",
  MODERATE: "Moderate",
  HIGH: "High",
}

export const HYPOTHESIZED_FUNCTION_LABELS: Record<HypothesizedFunction, string> = {
  ESCAPE: "Escape",
  ATTENTION: "Attention",
  SENSORY: "Sensory",
  TANGIBLE: "Tangible",
}

export const TYPE_OF_BIRTH_LABELS: Record<MedicalHistoryTypeOfBirth, string> = {
  NaturalChildbirth: "Natural childbirth",
  CaesareanSection: "Caesarean section",
}

function toOptions<T extends string>(labels: Record<T, string>): { value: T; label: string }[] {
  return (Object.keys(labels) as T[]).map((value) => ({ value, label: labels[value] }))
}

export const HOUSING_TYPE_OPTIONS = toOptions(HOUSING_TYPE_LABELS)
export const INTENSITY_KEY_OPTIONS = toOptions(INTENSITY_KEY_LABELS)
export const HYPOTHESIZED_FUNCTION_OPTIONS = toOptions(HYPOTHESIZED_FUNCTION_LABELS)
export const TYPE_OF_BIRTH_OPTIONS = toOptions(TYPE_OF_BIRTH_LABELS)

/** Campos de background con el label del template del PDF, en su orden */
export const ASSESSMENT_BACKGROUND_FIELDS = [
  { key: "backgroundStrengths", label: "Strengths" },
  { key: "backgroundWeaknesses", label: "Weaknesses" },
  { key: "backgroundInterest", label: "Interests" },
  { key: "backgroundCommunicationSkills", label: "Communication skills" },
  { key: "backgroundAcademicSkills", label: "Academic skills" },
  { key: "backgroundSelfCareSkills", label: "Self-care skills / Daily living skills" },
  { key: "backgroundSocialSkills", label: "Social skills" },
  { key: "backgroundSafetySkills", label: "Safety skills" },
  { key: "backgroundSelfAdvocacy", label: "Self-advocacy" },
  { key: "backgroundSelfPreservationSkills", label: "Self-preservation skills" },
  { key: "backgroundMotorSkills", label: "Gross/Fine motor skills" },
] as const

/**
 * Narrativas generales del PDF: cada una es una sección del reporte con su
 * propio texto editable y su flag de visibilidad. En create, un texto vacío
 * viaja `null` y el backend aplica su texto estándar.
 */
export const ASSESSMENT_PDF_GENERAL_NARRATIVES: {
  key: AssessmentPdfTextKey
  flagKey: AssessmentPdfFlagKey
  label: string
}[] = [
  { key: "coordinationCare", flagKey: "showCoordinationOfCare", label: "Coordination of Care" },
  { key: "medicalNecessity", flagKey: "showMedicalNecessityStatement", label: "Medical Necessity Statement" },
  { key: "caregiverTraining", flagKey: "showFamilyCaregiverTraining", label: "Family & Caregiver Training" },
  { key: "generalizationTraining", flagKey: "showGeneralizationTraining", label: "Generalization Training" },
  { key: "fadingTransitionPlan", flagKey: "showServiceFadingTransitionPlan", label: "Service Fading & Transition Plan" },
  { key: "crisisProcedures", flagKey: "showCrisisProcedures", label: "Crisis Procedures" },
  { key: "dischargeCriteria", flagKey: "showDischargePlanCriteria", label: "Discharge Plan & Criteria" },
  { key: "assessmentTreatmentConsent", flagKey: "showConsentAssessmentTreatment", label: "Consent for Assessment & Treatment" },
]

/** Bloques de estrategias del PDF: un flag controla el bloque completo */
export const ASSESSMENT_PDF_STRATEGY_GROUPS: {
  title: string
  subtitle: string
  flagKey: AssessmentPdfFlagKey
  fields: { key: AssessmentPdfTextKey; label: string }[]
}[] = [
  {
    title: "Preventive & Antecedent Strategies",
    subtitle: "A strategy with empty text is not printed in the PDF",
    flagKey: "showPreventiveAndAntecedentStrategies",
    fields: [
      { key: "noncontingentAttention", label: "Noncontingent attention" },
      { key: "thinNoncontingentAttention", label: "Thinning response-independent attention" },
      { key: "independentBreaks", label: "Response-independent breaks" },
      { key: "visualSupports", label: "Visual supports" },
      { key: "communicationTraining", label: "Functional communication training" },
      { key: "verbalBehaviorInstruction", label: "Verbal behavior instruction" },
      { key: "delayDenialTolerance", label: "Delay & denial tolerance training" },
      { key: "premackPrinciple", label: "Premack principle" },
      { key: "promptFading", label: "Prompting & prompt fading" },
      { key: "shaping", label: "Shaping" },
      { key: "highProbabilityRequests", label: "High-probability request sequence" },
      { key: "behavioralMomentum", label: "Behavioral momentum" },
      { key: "pairing", label: "Pairing" },
    ],
  },
  {
    title: "Consequence-Based Strategies",
    subtitle: "A strategy with empty text is not printed in the PDF",
    flagKey: "showConsequenceBasedStrategies",
    fields: [
      { key: "dra", label: "Differential reinforcement of alternative behavior (DRA)" },
      { key: "thinDra", label: "Thinning the DRA schedule" },
      { key: "dri", label: "Differential reinforcement of incompatible behavior (DRI)" },
      { key: "dro", label: "Differential reinforcement of other behavior (DRO)" },
      { key: "plannedIgnoring", label: "Planned ignoring" },
      { key: "alternativeRedirection", label: "Redirection to an alternative response" },
      { key: "stopRedirectReinforce", label: "Stop-Redirect-Reinforce" },
      { key: "matchingLawTreatment", label: "Matching law-informed reinforcement" },
    ],
  },
]

/**
 * Secciones del PDF que se arman desde el expediente del cliente y no tienen
 * sección propia en este formulario; sus switches viven agrupados aparte.
 */
export const ASSESSMENT_PDF_CLIENT_RECORD_FLAGS: { key: AssessmentPdfFlagKey; label: string }[] = [
  { key: "showEmergencyContactInformation", label: "Emergency Contact Information" },
  { key: "showReferringPhysicians", label: "Referring Physicians" },
  { key: "showFamilyCaregiversGuardians", label: "Family, Caregivers & Guardians" },
  { key: "showDocumentsReviewed", label: "Documents Reviewed" },
  { key: "showServiceLocations", label: "Service Locations" },
]
