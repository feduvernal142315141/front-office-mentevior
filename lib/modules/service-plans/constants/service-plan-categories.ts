export const SERVICE_PLAN_CATEGORY_LABELS = [
  "Behaviors",
  "Attending Skills",
  "Imitation Skills",
  "MAladaptive Behaviors",
  "Replacement/ Acquisition Programs",
  "Caregivers Programs",
  "Visual-Spatial Skills",
  "Academic Skills",
  "Play and Social Skills",
  "Adptive Skills",
  "Vocational Skills",
  "RBT Training",
  "Caregiver Training",
] as const

export const SERVICE_PLAN_CATEGORY_OPTIONS = SERVICE_PLAN_CATEGORY_LABELS.map((label) => ({
  value: label,
  label,
}))
