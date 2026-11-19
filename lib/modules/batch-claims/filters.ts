import { addDays, format, parseISO } from "date-fns"
import { buildFilters, type FilterRule } from "@/lib/utils/query-filters"

export interface BatchClaimsFilters {
  payerId?: string
  payerPlanId?: string
  createdFrom?: string
  createdTo?: string
}

export function buildBatchClaimsFilters(search: string, filters: BatchClaimsFilters = {}): string[] {
  const rules: FilterRule[] = [
    { field: "payerPlan.payerId", operator: "RELATED_EQ", value: filters.payerId, type: "uuid" },
    { field: "payerPlanId", operator: "EQ", value: filters.payerPlanId, type: "uuid" },
    { field: "createAt", operator: "GTE", value: filters.createdFrom, type: "date" },
  ]

  if (filters.createdTo) {
    // createAt includes a time: an exclusive next-day bound includes the entire final day.
    rules.push({
      field: "createAt",
      operator: "LT",
      value: format(addDays(parseISO(filters.createdTo), 1), "yyyy-MM-dd"),
      type: "date",
    })
  }

  return buildFilters(rules, { fields: ["reference"], search })
}
