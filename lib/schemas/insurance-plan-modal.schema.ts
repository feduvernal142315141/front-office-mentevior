import { z } from "zod"

const rateFields = {
  insurancePlanId: z.string(),
  amount: z.coerce
    .number({ invalid_type_error: "Amount is required" })
    .min(0, "Amount is required"),
  submitAmount: z.coerce
    .number({ invalid_type_error: "Invalid number" })
    .min(0, "Must be >= 0")
    .optional()
    .or(z.literal(Number.NaN)),
  intervalType: z.string().min(1, "Interval is required"),
  currencyId: z.string().min(1, "Currency is required"),
  alias: z.string().max(200).optional().or(z.literal("")),
  startDate: z.string().optional().or(z.literal("")),
  endDate: z.string().optional().or(z.literal("")),
  billingCodeId: z.string().min(1, "Billing code is required"),
}

export const insurancePlanGeneralSchema = z.object({
  planName: z.string().min(1, "Plan name is required").max(200),
  planTypeId: z.string().min(1, "Plan type is required"),
  comments: z.string().max(2000).optional().or(z.literal("")),
})

export type InsurancePlanGeneralValues = z.infer<typeof insurancePlanGeneralSchema>

export const insurancePlanRateRowSchema = z.object(rateFields)

export type InsurancePlanRateRowValues = z.infer<typeof insurancePlanRateRowSchema>

export function getInsurancePlanGeneralEmptyDefaults(): InsurancePlanGeneralValues {
  return {
    planName: "",
    planTypeId: "",
    comments: "",
  }
}

export function getInsurancePlanRateEmptyDefaults(planId: string, usdCurrencyId?: string): InsurancePlanRateRowValues {
  return {
    insurancePlanId: planId,
    amount: Number.NaN,
    submitAmount: undefined,
    intervalType: "UNIT",
    currencyId: usdCurrencyId ?? "",
    alias: "",
    startDate: "",
    endDate: "",
    billingCodeId: "",
  }
}
