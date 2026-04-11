import { z } from "zod"

const yesNo = z.enum(["yes", "no"])

export const supervisionConfigSchema = z.object({
  // General
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(500).optional().or(z.literal("")),
  // Configuration
  isSubevent: yesNo,
  credentialIds: z.array(z.string()),
  requirePriorAuthorization: yesNo,
  billable: yesNo,
  requireBillingCodes: yesNo,
  billingCodeIds: z.array(z.string()),
  showEventInfo: yesNo,
  allowOverlapping: yesNo,
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  maxDurationPerDayClient: z.string().min(1, "Required"),
  maxDurationPerDayProvider: z.string().min(1, "Required"),
  maxDurationPerWeekProvider: z.string().min(1, "Required"),
  maxDurationPerWeekClient: z.string().min(1, "Required"),
  showPreviewInCalendar: yesNo,
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color").or(z.literal("")),
})

export type SupervisionConfigFormValues = z.infer<typeof supervisionConfigSchema>

export const getSupervisionConfigDefaults = (): SupervisionConfigFormValues => ({
  name: "",
  description: "",
  isSubevent: "no",
  credentialIds: [],
  requirePriorAuthorization: "no",
  billable: "no",
  requireBillingCodes: "no",
  billingCodeIds: [],
  showEventInfo: "no",
  allowOverlapping: "no",
  startTime: "",
  endTime: "",
  maxDurationPerDayClient: "10",
  maxDurationPerDayProvider: "10",
  maxDurationPerWeekProvider: "60",
  maxDurationPerWeekClient: "40",
  showPreviewInCalendar: "no",
  color: "",
})
