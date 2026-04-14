import { z } from "zod"

export const appointmentConfigSchema = z.object({
  // ── Scheduling ──────────────────────────────────────────────────────────────
  leadTimeId:       z.string().min(1, "Lead time is required"),
  lagTimeId:        z.string().min(1, "Lag time is required"),
  startTime:        z.string().min(1, "Start time is required"),
  endTime:          z.string().min(1, "End time is required"),
  allowedDays:      z.string().min(1, "Allowed days is required"),
  allowedSubEvents: z.string().min(1, "Allowed sub-events is required"),

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
  requiredBillingCode:        z.boolean(),
  requiredSignature:          z.boolean(),
  requiredPriorAuthorization: z.boolean(),
  requiredDataCollection:     z.boolean(),
  requiredLocation:           z.boolean(),
  requiredUser:               z.boolean(),
  allowOverlapping:           z.boolean(),
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
  maxDurationConsecutiveDaysClient:   "0",
  maxDurationConsecutiveDaysProvider: "0",

  // Billing
  billingCodes: [],

  // Switches
  requiredBillingCode:        false,
  requiredSignature:          false,
  requiredPriorAuthorization: false,
  requiredDataCollection:     false,
  requiredLocation:           false,
  requiredUser:               false,
  allowOverlapping:           false,
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

  // Appearance
  color: "",
})
