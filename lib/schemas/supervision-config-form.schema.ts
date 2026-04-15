import { z } from "zod"

const requiredPositiveNumber = (field: string) =>
  z
    .string()
    .trim()
    .min(1, `${field} is required`)
    .refine((value) => Number(value) > 0, `${field} must be greater than 0`)

export const supervisionConfigSchema = z.object({
  // ── Scheduling ───────────────────────────────────────────────────────────────
  startTime: z.string().min(1, "Start time is required"),
  endTime:   z.string().min(1, "End time is required"),

  // ── Numeric limits ───────────────────────────────────────────────────────────
  maxNumberLocations:                 requiredPositiveNumber("Max locations"),
  minDuration:                        requiredPositiveNumber("Min duration event (h)"),
  maxDurationEvent:                   requiredPositiveNumber("Max duration event (h)"),
  maxDurationPerDayClient:            requiredPositiveNumber("Max duration / day client (h)"),
  maxDurationPerDayProvider:          requiredPositiveNumber("Max duration / day provider (h)"),
  maxDurationPerWeekClient:           requiredPositiveNumber("Max duration / week client (h)"),
  maxDurationPerWeekProvider:         requiredPositiveNumber("Max duration / week provider (h)"),
  maxDurationConsecutiveDaysClient:   requiredPositiveNumber("Max consecutive days client"),
  maxDurationConsecutiveDaysProvider: requiredPositiveNumber("Max consecutive days provider"),

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

export type SupervisionConfigFormValues = z.infer<typeof supervisionConfigSchema>

export const getSupervisionConfigDefaults = (): SupervisionConfigFormValues => ({
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
