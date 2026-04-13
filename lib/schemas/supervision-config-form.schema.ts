import { z } from "zod"

const yesNo = z.enum(["yes", "no"])

export const supervisionConfigSchema = z.object({
  // General
  supervisionName: z.string().min(1, "Name is required").max(200),
  supervisionDescription: z.string().max(500).optional().or(z.literal("")),
  // Configuration
  credentials: z.array(z.string()),
  billingCodes: z.array(z.string()),
  requiredBillingCode: yesNo,
  requiredPriorAuthorization: yesNo,
  billable: yesNo,
  showEventInfo: yesNo,
  allowOverlapping: yesNo,
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  maxDurationPerClient: z.string().min(1, "Required"),
  maxDurationPerProvider: z.string().min(1, "Required"),
  maxDurationPerWeekClient: z.string().min(1, "Required"),
  maxDurationPerWeekProvider: z.string().min(1, "Required"),
  showPreviewInCalendar: yesNo,
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color").or(z.literal("")),
})

export type SupervisionConfigFormValues = z.infer<typeof supervisionConfigSchema>

export const getSupervisionConfigDefaults = (): SupervisionConfigFormValues => ({
  supervisionName: "",
  supervisionDescription: "",
  credentials: [],
  billingCodes: [],
  requiredBillingCode: "no",
  requiredPriorAuthorization: "no",
  billable: "no",
  showEventInfo: "no",
  allowOverlapping: "no",
  startTime: "",
  endTime: "",
  maxDurationPerClient: "10",
  maxDurationPerProvider: "10",
  maxDurationPerWeekClient: "40",
  maxDurationPerWeekProvider: "60",
  showPreviewInCalendar: "no",
  color: "",
})
