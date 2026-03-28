import { z } from "zod"

const rateFields = {
  insurancePlanId: z.string(),
  amount: z.coerce
    .number({ invalid_type_error: "Amount is required" })
    .min(0, "Amount is required"),
  submitAmount: z.coerce
    .number({ invalid_type_error: "Submit amount is required" })
    .min(0, "Submit amount is required"),
  intervalType: z.string().min(1, "Interval is required"),
  currencyId: z.string().min(1, "Currency is required"),
  alias: z.string().min(1, "Alias is required").max(200),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  billingCodeIds: z.array(z.string()),
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

export function getInsurancePlanRateEmptyDefaults(planId: string): InsurancePlanRateRowValues {
  return {
    insurancePlanId: planId,
    amount: Number.NaN,
    submitAmount: Number.NaN,
    intervalType: "",
    currencyId: "",
    alias: "",
    startDate: "",
    endDate: "",
    billingCodeIds: [],
  }
}
