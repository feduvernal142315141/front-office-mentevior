import { serviceGet, servicePost, servicePut } from "@/lib/services/baseService"
import type {
  InsurancePlanCreatePayload,
  InsurancePlanDetailDto,
  InsurancePlanGeneralPayload,
  InsurancePlanRateDto,
  InsurancePlanRateRow,
} from "@/lib/types/insurance-plan-rate.types"
import type { InsurancePlanGeneralValues, InsurancePlanRateRowValues } from "@/lib/schemas/insurance-plan-modal.schema"

function normalizeRateRow(
  r: Partial<InsurancePlanRateDto> & { id?: string },
  fallbackPlanId: string,
): InsurancePlanRateRow {
  return {
    id: r.id,
    insurancePlanId: String(r.insurancePlanId ?? fallbackPlanId ?? ""),
    amount: Number(r.amount ?? 0),
    submitAmount: Number(r.submitAmount ?? 0),
    intervalType: r.intervalType ?? "",
    currencyId: r.currencyId ?? "",
    alias: r.alias ?? "",
    startDate: r.startDate ?? "",
    endDate: r.endDate ?? "",
    billingCodeIds: Array.isArray(r.billingCodeIds) ? r.billingCodeIds : [],
  }
}

export function mapInsurancePlanDetailToGeneral(d: InsurancePlanDetailDto): InsurancePlanGeneralValues {
  return {
    planName: d.planName ?? "",
    planTypeId: d.planTypeId ?? "",
    comments: d.comments ?? "",
  }
}

export function mapInsurancePlanDetailToRates(d: InsurancePlanDetailDto): InsurancePlanRateRow[] {
  const planId = d.id ?? ""
  if (Array.isArray(d.rates) && d.rates.length > 0) {
    return d.rates.map((r) => normalizeRateRow(r, planId))
  }
  const legacy = d.rate
  if (
    legacy &&
    (legacy.amount != null ||
      legacy.submitAmount != null ||
      (legacy.alias && legacy.alias.length > 0) ||
      (legacy.billingCodeIds && legacy.billingCodeIds.length > 0) ||
      (legacy.startDate && legacy.startDate.length > 0))
  ) {
    return [normalizeRateRow({ ...legacy, id: legacy.id }, planId)]
  }
  return []
}

export function mapRateRowToFormValues(row: InsurancePlanRateRow, planId: string): InsurancePlanRateRowValues {
  return {
    insurancePlanId: row.insurancePlanId || planId,
    amount: row.amount,
    submitAmount: row.submitAmount,
    intervalType: row.intervalType,
    currencyId: row.currencyId,
    alias: row.alias,
    startDate: row.startDate,
    endDate: row.endDate,
    billingCodeIds: [...row.billingCodeIds],
  }
}

/** GET /insurance-plans/{payerId} — single plan for that payer; 404 when none yet */
export async function getInsurancePlanForPayer(payerId: string): Promise<InsurancePlanDetailDto | null> {
  const response = await serviceGet<InsurancePlanDetailDto>(`/insurance-plans/${payerId}`)

  if (response.status === 404) {
    return null
  }

  if (response.status !== 200 || response.data == null) {
    throw new Error(
      (response.data as { message?: string } | undefined)?.message || "Failed to load insurance plan",
    )
  }

  return response.data as unknown as InsurancePlanDetailDto
}

function extractCreatedPlanId(data: unknown): string | undefined {
  if (!data || typeof data !== "object") return undefined
  const o = data as Record<string, unknown>
  if (typeof o.id === "string") return o.id
  const inner = o.data
  if (inner && typeof inner === "object" && typeof (inner as Record<string, unknown>).id === "string") {
    return (inner as Record<string, string>).id
  }
  return undefined
}

/** Create plan (general only). Returns new plan id when the API includes it in the response. */
export async function createInsurancePlanGeneral(
  payerId: string,
  payload: InsurancePlanGeneralPayload,
): Promise<{ planId?: string }> {
  const body: InsurancePlanCreatePayload = {
    payerId,
    planName: payload.planName,
    planTypeId: payload.planTypeId,
    comments: payload.comments,
  }
  const response = await servicePost<InsurancePlanCreatePayload, Record<string, unknown>>(
    `/insurance-plans`,
    body,
  )

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(
      (response.data as { message?: string } | undefined)?.message || "Failed to create insurance plan",
    )
  }

  const planId = extractCreatedPlanId(response.data as unknown)
  return { planId }
}

export async function updateInsurancePlanGeneral(planId: string, payload: InsurancePlanGeneralPayload): Promise<void> {
  const response = await servicePut<InsurancePlanGeneralPayload, { message?: string }>(
    `/insurance-plans/${planId}`,
    payload,
  )

  if (response.status !== 200 && response.status !== 204) {
    throw new Error(
      (response.data as { message?: string } | undefined)?.message || "Failed to update insurance plan",
    )
  }
}

function toRatePayload(values: InsurancePlanRateRowValues, planId: string): InsurancePlanRateDto {
  return {
    insurancePlanId: planId,
    amount: Number(values.amount),
    submitAmount: Number(values.submitAmount),
    intervalType: values.intervalType,
    currencyId: values.currencyId,
    alias: values.alias.trim(),
    startDate: values.startDate,
    endDate: values.endDate,
    billingCodeIds: values.billingCodeIds,
  }
}

export async function createInsurancePlanRate(planId: string, values: InsurancePlanRateRowValues): Promise<void> {
  const response = await servicePost<InsurancePlanRateDto, { message?: string }>(
    `/insurance-plans/${planId}/rates`,
    toRatePayload(values, planId),
  )

  if (response.status !== 200 && response.status !== 201) {
    throw new Error((response.data as { message?: string } | undefined)?.message || "Failed to create rate")
  }
}

export async function updateInsurancePlanRate(
  planId: string,
  rateId: string,
  values: InsurancePlanRateRowValues,
): Promise<void> {
  const response = await servicePut<InsurancePlanRateDto, { message?: string }>(
    `/insurance-plans/${planId}/rates/${rateId}`,
    toRatePayload(values, planId),
  )

  if (response.status !== 200 && response.status !== 204) {
    throw new Error((response.data as { message?: string } | undefined)?.message || "Failed to update rate")
  }
}
