import { z } from "zod"

export const servicePlanConfigSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name must be less than 200 characters"),
  description: z.string().max(500).optional().or(z.literal("")),
  billingCodeIds: z.array(z.string()),
  requireBillingCode: z.enum(["yes", "no"]),
  credentialIds: z.array(z.string()),
  billable: z.enum(["yes", "no"]),
  requirePriorAuthorization: z.enum(["yes", "no"]),
  maxBillingCodes: z.string().min(1, "Max billing codes is required"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color").or(z.literal("")),
})

export type ServicePlanConfigFormValues = z.infer<typeof servicePlanConfigSchema>

export const getServicePlanConfigDefaults = (): ServicePlanConfigFormValues => ({
  name: "",
  description: "",
  billingCodeIds: [],
  requireBillingCode: "no",
  credentialIds: [],
  billable: "no",
  requirePriorAuthorization: "no",
  maxBillingCodes: "",
  color: "",
})
