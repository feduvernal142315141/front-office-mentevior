import { z } from "zod"
import { formatTimeTo24h } from "@/lib/utils/time-format"

const requiredPositiveNumber = (field: string) =>
  z
    .string()
    .trim()
    .min(1, `${field} is required`)
    .refine((value) => Number(value) > 0, `${field} must be greater than 0`)

const requiredNumberInRange = (field: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${field} is required`)
    .refine((value) => {
      const n = Number(value)
      if (isNaN(n)) return false
      return n >= min && n <= max
    }, `${field} must be between ${min} and ${max}`)

export const supervisionConfigSchema = z.object({
  // ── Scheduling ───────────────────────────────────────────────────────────────
  startTime: z.string().min(1, "Start time is required").refine((v) => formatTimeTo24h(v) !== null, "Start time must be valid (e.g. 09:30 AM)"),
  endTime:   z.string().min(1, "End time is required").refine((v) => formatTimeTo24h(v) !== null, "End time must be valid (e.g. 05:00 PM)"),

  // ── Numeric limits ───────────────────────────────────────────────────────────
  maxNumberLocations:                 requiredPositiveNumber("Max locations"),
  minDuration:                        requiredNumberInRange("Min duration event (h)", 0.25, 8),
  maxDurationEvent:                   requiredNumberInRange("Max duration event (h)", 0.25, 8),
  maxDurationPerDayClient:            requiredNumberInRange("Max duration / day client (h)", 0.25, 8),
  maxDurationPerDayProvider:          requiredNumberInRange("Max duration / day provider (h)", 0.25, 10),
  maxDurationPerWeekClient:           requiredNumberInRange("Max duration / week client (h)", 0.25, 70),
  maxDurationPerWeekProvider:         requiredNumberInRange("Max duration / week provider (h)", 0.25, 70),
  maxAllowedDaysClient:               requiredNumberInRange("Max days allowed per client", 1, 6),
  maxAllowedDaysProvider:             requiredNumberInRange("Max days allowed per provider", 1, 6),

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
  showEventInfo:              z.boolean(),
  showPreview:                z.boolean(),
  active:                     z.boolean(),

  // ── Rounding ─────────────────────────────────────────────────────────────────
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
  maxAllowedDaysClient:   "0",
  maxAllowedDaysProvider: "0",

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
  showEventInfo:              false,
  showPreview:                false,
  active:                     true,

  // Rounding
  // Appearance
  color: "",
})
