import { z } from "zod"

export const servicePlanConfigSchema = z.object({
  // General
  servicePlanName: z.string().min(1, "Name is required").max(200, "Name must be less than 200 characters"),
  servicePlanDescription: z.string().max(500).optional().or(z.literal("")),
  // Configuration
  billingCodes: z.array(z.string()),
  requiredBillingCode: z.enum(["yes", "no"]),
  credentials: z.array(z.string()),
  billable: z.enum(["yes", "no"]),
  requiredPriorAuthorization: z.enum(["yes", "no"]),
  maxBillingCode: z.string().min(1, "Max billing codes is required"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color").or(z.literal("")),
})

export type ServicePlanConfigFormValues = z.infer<typeof servicePlanConfigSchema>

export const getServicePlanConfigDefaults = (): ServicePlanConfigFormValues => ({
  servicePlanName: "",
  servicePlanDescription: "",
  billingCodes: [],
  requiredBillingCode: "no",
  credentials: [],
  billable: "no",
  requiredPriorAuthorization: "no",
  maxBillingCode: "",
  color: "",
})
