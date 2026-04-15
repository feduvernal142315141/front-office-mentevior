import { z } from "zod"

export const servicePlanConfigSchema = z.object({
  // ── Scheduling ───────────────────────────────────────────────────────────────
  startTime: z.string().min(1, "Start time is required"),
  endTime:   z.string().min(1, "End time is required"),

  // ── Numeric limits ───────────────────────────────────────────────────────────
  maxNumberLocations:               z.string().min(1, "Required"),
  minDuration:                      z.string().min(1, "Required"),
  maxDurationEvent:                 z.string().min(1, "Required"),
  maxDurationPerDayClient:          z.string().min(1, "Required"),
  maxDurationPerDayProvider:        z.string().min(1, "Required"),
  maxDurationPerWeekClient:         z.string().min(1, "Required"),
  maxDurationPerWeekProvider:       z.string().min(1, "Required"),
  maxDurationConsecutiveDaysClient:   z.string().min(1, "Required"),
  maxDurationConsecutiveDaysProvider: z.string().min(1, "Required"),

  // ── Billing ──────────────────────────────────────────────────────────────────
  billingCodes: z.array(z.string()).min(1, "At least one billing code is required"),

  // ── Booleans (switches) ──────────────────────────────────────────────────────
  requiredSignature:          z.boolean(),
  requiredPriorAuthorization: z.boolean(),
  requiredLocation:           z.boolean(),
  requiredUser:               z.boolean(),
  allowSignature:             z.boolean(),
  allowChangeUser:            z.boolean(),
  allowCreateByUser:          z.boolean(),
  allowEditByUser:            z.boolean(),
  allowNewLocation:           z.boolean(),
  allowedCredentials:         z.boolean(),
  billable:                   z.boolean(),
  invoiceable:                z.boolean(),
  showEventInfo:              z.boolean(),
  showPreview:                z.boolean(),
  active:                     z.boolean(),

  // ── Rounding ─────────────────────────────────────────────────────────────────
  roundingFunction: z.enum(["Round", "Floor", "Ceil"]),

  // ── Appearance ───────────────────────────────────────────────────────────────
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color").or(z.literal("")),
})

export type ServicePlanConfigFormValues = z.infer<typeof servicePlanConfigSchema>

export const getServicePlanConfigDefaults = (): ServicePlanConfigFormValues => ({
  // Scheduling
  startTime: "",
  endTime:   "",

  // Numeric limits
  maxNumberLocations:               "1",
  minDuration:                      "0",
  maxDurationEvent:                 "0",
  maxDurationPerDayClient:          "0",
  maxDurationPerDayProvider:        "0",
  maxDurationPerWeekClient:         "0",
  maxDurationPerWeekProvider:       "0",
  maxDurationConsecutiveDaysClient:   "0",
  maxDurationConsecutiveDaysProvider: "0",

  // Billing
  billingCodes: [],

  // Switches
  requiredSignature:          false,
  requiredPriorAuthorization: false,
  requiredLocation:           false,
  requiredUser:               false,
  allowSignature:             false,
  allowChangeUser:            false,
  allowCreateByUser:          false,
  allowEditByUser:            false,
  allowNewLocation:           false,
  allowedCredentials:         false,
  billable:                   false,
  invoiceable:                false,
  showEventInfo:              false,
  showPreview:                false,
  active:                     true,

  // Rounding
  roundingFunction: "Round",

  // Appearance
  color: "",
})
