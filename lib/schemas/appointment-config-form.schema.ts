import { z } from "zod"

export const appointmentConfigSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name must be less than 200 characters"),
  description: z.string().max(500).optional().or(z.literal("")),
  maxNumberLocations: z.string().min(1, "Max number of locations is required"),
  requiredBillingCode: z.boolean(),
  requiredSignature: z.boolean(),
  allowSubEvents: z.string().min(1, "Allow subevents is required"),
  requiredPriorAuthorization: z.boolean(),
  leadTimeId: z.string().min(1, "Lead time is required"),
  lagTimeId: z.string().min(1, "Lag time is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  allowOverlapping: z.boolean(),
  billingCodes: z.array(z.string()),
  maxDurationPerProvider: z.string().min(1, "Max duration per provider is required"),
  maxDurationPerClient: z.string().min(1, "Max duration per client is required"),
  maxDurationRBTAndAnalyst: z.string().min(1, "Max duration RBT and analyst is required"),
  maxConsecutiveDaysOfWork: z.string().min(1, "Max consecutive days of work is required"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color").or(z.literal("")),
})

export type AppointmentConfigFormValues = z.infer<typeof appointmentConfigSchema>

export const getAppointmentConfigDefaults = (): AppointmentConfigFormValues => ({
  name: "",
  description: "",
  maxNumberLocations: "",
  requiredBillingCode: false,
  requiredSignature: false,
  allowSubEvents: "",
  requiredPriorAuthorization: false,
  leadTimeId: "",
  lagTimeId: "",
  startTime: "",
  endTime: "",
  allowOverlapping: false,
  billingCodes: [],
  maxDurationPerProvider: "16",
  maxDurationPerClient: "6",
  maxDurationRBTAndAnalyst: "8",
  maxConsecutiveDaysOfWork: "6",
  color: "",
})
