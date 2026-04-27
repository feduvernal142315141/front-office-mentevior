const SERVICE_PLAN_FALLBACK_CATEGORY_CATALOG = [
  { id: "fallback-behaviors", label: "Behaviors" },
  { id: "fallback-attending-skills", label: "Attending Skills" },
  { id: "fallback-imitation-skills", label: "Imitation Skills" },
  { id: "fallback-maladaptive-behaviors", label: "MAladaptive Behaviors" },
  { id: "fallback-replacement-acquisition-programs", label: "Replacement/ Acquisition Programs" },
  { id: "fallback-caregivers-programs", label: "Caregivers Programs" },
  { id: "fallback-visual-spatial-skills", label: "Visual-Spatial Skills" },
  { id: "fallback-academic-skills", label: "Academic Skills" },
  { id: "fallback-play-social-skills", label: "Play and Social Skills" },
  { id: "fallback-adaptive-skills", label: "Adptive Skills" },
  { id: "fallback-vocational-skills", label: "Vocational Skills" },
  { id: "fallback-rbt-training", label: "RBT Training" },
  { id: "fallback-caregiver-training", label: "Caregiver Training" },
] as const

export const SERVICE_PLAN_CATEGORY_OPTIONS = SERVICE_PLAN_FALLBACK_CATEGORY_CATALOG.map((category) => ({
  value: category.id,
  label: category.label,
}))

const FALLBACK_CATEGORY_LABEL_TO_ID = new Map<string, string>(
  SERVICE_PLAN_FALLBACK_CATEGORY_CATALOG.map((category) => [category.label.trim().toLowerCase(), category.id])
)

function slugifyCategoryName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export function resolveCategoryIdFromUnknown(value: string): string {
  const normalizedValue = value.trim()
  if (normalizedValue.length === 0) return ""

  const knownId = FALLBACK_CATEGORY_LABEL_TO_ID.get(normalizedValue.toLowerCase())
  if (knownId) return knownId

  if (normalizedValue.startsWith("fallback-") || isUuid(normalizedValue)) {
    return normalizedValue
  }

  const looksLikeLabel = /\s|\//.test(normalizedValue)
  if (!looksLikeLabel) return normalizedValue

  const slug = slugifyCategoryName(normalizedValue)
  return slug.length > 0 ? `fallback-${slug}` : normalizedValue
}

export function createFallbackCategoryIdFromLabel(label: string): string {
  const normalizedLabel = label.trim()
  if (normalizedLabel.length === 0) return ""

  const knownId = FALLBACK_CATEGORY_LABEL_TO_ID.get(normalizedLabel.toLowerCase())
  if (knownId) return knownId

  const slug = slugifyCategoryName(normalizedLabel)
  return slug.length > 0 ? `fallback-${slug}` : normalizedLabel
}
