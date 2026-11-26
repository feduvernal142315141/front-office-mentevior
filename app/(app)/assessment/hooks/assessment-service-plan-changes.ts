import type { ClientCategoryWithItems } from "@/lib/types/assessment.types"
import type { CategoryItemFormValue } from "./useAssessmentForm"

export const SERVICE_PLAN_CHANGE_WARNING =
  "This field comes from the Service Plan. Changes are saved only in this Assessment."

const sortedSelection = (values: string[]) => [...new Set(values)].sort()
const strategies = (value = "") => sortedSelection(value.split(",").map((v) => v.trim()).filter(Boolean))

/** Compare effective field values, including defaults that live outside form state. */
export function hasServicePlanChanges(
  categories: ClientCategoryWithItems[],
  current: Record<string, CategoryItemFormValue>,
  baseline: Record<string, CategoryItemFormValue>,
): boolean {
  const items = new Map(categories.flatMap((category) => category.items.map((item) => [item.id, item] as const)))
  const itemIds = new Set([...items.keys(), ...Object.keys(current), ...Object.keys(baseline)])

  for (const itemId of itemIds) {
    const item = items.get(itemId)
    const snapshot = (value?: CategoryItemFormValue) => JSON.stringify({
      description: (value?.description ?? item?.description ?? "").trim(),
      procedures: (value?.procedures ?? item?.procedures ?? "").trim(),
      intensityKey: value?.intensityKey ?? "",
      intensityDescription: (value?.intensityDescription ?? "").trim(),
      hypothesizedFunction: sortedSelection(
        value?.hypothesizedFunction.length ? value.hypothesizedFunction : item?.hypothesizedFunctions ?? [],
      ),
      placesOfService: sortedSelection(value?.placesOfServiceIds ?? []),
      preventiveStrategies: strategies(value?.preventiveStrategies),
      otherPreventiveStrategies: value?.preventiveStrategies.includes("Other")
        ? value.otherPreventiveStrategies.trim()
        : "",
      managementStrategies: strategies(value?.managementStrategies),
      otherManagementStrategies: strategies(value?.managementStrategies).some((v) => v.toLowerCase() === "other")
        ? (value?.otherManagementStrategies ?? "").trim()
        : "",
    })

    if (snapshot(current[itemId]) !== snapshot(baseline[itemId])) return true
  }
  return false
}
