import { z } from "zod"

const rateFields = {
  insurancePlanId: z.string(),
  amount: z.coerce.number().min(0),
  submitAmount: z.coerce.number().min(0),
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
    amount: 0,
    submitAmount: 0,
    intervalType: "",
    currencyId: "",
    alias: "",
    startDate: "",
    endDate: "",
    billingCodeIds: [],
  }
}
