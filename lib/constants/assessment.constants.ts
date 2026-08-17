import type {
  AssessmentIntensityKey,
  HousingType,
  HypothesizedFunction,
  SchoolSetting,
} from "@/lib/types/assessment.types"

export const SCHOOL_SETTING_LABELS: Record<SchoolSetting, string> = {
  REGULAR: "Regular",
  SPECIAL: "Special",
  ADVANCED: "Advanced",
}

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

function toOptions<T extends string>(labels: Record<T, string>): { value: T; label: string }[] {
  return (Object.keys(labels) as T[]).map((value) => ({ value, label: labels[value] }))
}

export const SCHOOL_SETTING_OPTIONS = toOptions(SCHOOL_SETTING_LABELS)
export const HOUSING_TYPE_OPTIONS = toOptions(HOUSING_TYPE_LABELS)
export const INTENSITY_KEY_OPTIONS = toOptions(INTENSITY_KEY_LABELS)
export const HYPOTHESIZED_FUNCTION_OPTIONS = toOptions(HYPOTHESIZED_FUNCTION_LABELS)

/** Campos de background del Assessment con su label de UI, en el orden del contrato */
export const ASSESSMENT_BACKGROUND_FIELDS = [
  { key: "backgroundStrengths", label: "Strengths" },
  { key: "backgroundWeaknesses", label: "Weaknesses" },
  { key: "backgroundInterest", label: "Interests" },
  { key: "backgroundCommunicationSkills", label: "Communication skills" },
  { key: "backgroundAcademicSkills", label: "Academic skills" },
  { key: "backgroundSelfCareSkills", label: "Self-care skills" },
  { key: "backgroundSocialSkills", label: "Social skills" },
  { key: "backgroundSafetySkills", label: "Safety skills" },
  { key: "backgroundSelfAdvocacy", label: "Self-advocacy" },
  { key: "backgroundSelfPreservationSkills", label: "Self-preservation skills" },
  { key: "backgroundMotorSkills", label: "Motor skills" },
] as const
