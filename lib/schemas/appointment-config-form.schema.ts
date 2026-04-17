import { z } from "zod"
import { formatTimeTo24h } from "@/lib/utils/time-format"

const requiredPositiveNumber = (field: string) =>
  z
    .string()
    .trim()
    .min(1, `${field} is required`)
    .refine((value) => Number(value) > 0, `${field} must be greater than 0`)

export const appointmentConfigSchema = z.object({
  // ── Scheduling ──────────────────────────────────────────────────────────────
  leadTimeId:       z.string().min(1, "Lead time is required"),
  lagTimeId:        z.string().min(1, "Lag time is required"),
  startTime:        z.string().min(1, "Start time is required").refine((value) => formatTimeTo24h(value) !== null, "Start time must be valid (e.g. 09:30 AM)"),
  endTime:          z.string().min(1, "End time is required").refine((value) => formatTimeTo24h(value) !== null, "End time must be valid (e.g. 05:00 PM)"),
  allowedDays:      z.string(),
  allowedSubEvents: z.string(),

  // ── Numeric limits ───────────────────────────────────────────────────────────
  maxNumberLocations:                 requiredPositiveNumber("Max locations"),
  minDuration:                        requiredPositiveNumber("Min duration event (h)"),
  maxDurationEvent:                   requiredPositiveNumber("Max duration event (h)"),
  maxDurationPerDayClient:            requiredPositiveNumber("Max duration / day client (h)"),
  maxDurationPerDayProvider:          requiredPositiveNumber("Max duration / day provider (h)"),
  maxDurationPerWeekClient:           requiredPositiveNumber("Max duration / week client (h)"),
  maxDurationPerWeekProvider:         requiredPositiveNumber("Max duration / week provider (h)"),
  maxAllowedDaysClient:   requiredPositiveNumber("Max allowed days client"),
  maxAllowedDaysProvider: requiredPositiveNumber("Max allowed days provider"),

  // ── Billing ──────────────────────────────────────────────────────────────────
  billingCodes: z.array(z.string()).min(1, "At least one billing code is required"),

  // ── Booleans (switches) ──────────────────────────────────────────────────────
  requiredSignature:          z.boolean(),
  requiredPriorAuthorization: z.boolean(),
  requiredDataCollection:     z.boolean(),
  requiredLocation:           z.boolean(),
  requiredUser:               z.boolean(),
  allowSignature:             z.boolean(),
  allowChangeUser:            z.boolean(),
  allowCreateByUser:          z.boolean(),
  allowEditByUser:            z.boolean(),
  allowNewLocation:           z.boolean(),
  allowedCredentials:         z.boolean(),
  invoiceable:                z.boolean(),
  showEventInfo:              z.boolean(),
  active:                     z.boolean(),

  // ── Appearance ───────────────────────────────────────────────────────────────
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color").or(z.literal("")),
})

export type AppointmentConfigFormValues = z.infer<typeof appointmentConfigSchema>

export const getAppointmentConfigDefaults = (): AppointmentConfigFormValues => ({
  // Scheduling
  leadTimeId:      "",
  lagTimeId:       "",
  startTime:       "",
  endTime:         "",
  allowedDays:     "",
  allowedSubEvents: "",

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
  requiredDataCollection:     false,
  requiredLocation:           false,
  requiredUser:               false,
  allowSignature:             false,
  allowChangeUser:            false,
  allowCreateByUser:          false,
  allowEditByUser:            false,
  allowNewLocation:           false,
  allowedCredentials:         false,
  invoiceable:                false,
  showEventInfo:              false,
  active:                     true,

  // Appearance
  color: "",
})
