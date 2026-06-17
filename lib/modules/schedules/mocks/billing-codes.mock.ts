import type { EventType, ScheduleBillingCode } from "@/lib/types/appointment.types"

/**
 * Mock billing codes organized by event type.
 * Simulates the response from Prior Authorization billing codes
 * filtered by the type of clinical event.
 *
 * TODO: Replace with real API call to get billing codes from
 * client's active Prior Authorization filtered by event type.
 */

const SESSION_NOTE_CODES: ScheduleBillingCode[] = [
  {
    id: "bc-97153",
    type: "CPT",
    code: "97153",
    description: "Adaptive Behavior Treatment by Protocol",
    label: "CPT 97153",
  },
  {
    id: "bc-97155",
    type: "CPT",
    code: "97155",
    description: "Adaptive Behavior Treatment with Protocol Modification",
    label: "CPT 97155",
  },
  {
    id: "bc-97156",
    type: "CPT",
    code: "97156",
    description: "Family Adaptive Behavior Treatment Guidance",
    label: "CPT 97156",
  },
]

const SERVICE_PLAN_CODES: ScheduleBillingCode[] = [
  {
    id: "bc-97151",
    type: "CPT",
    code: "97151",
    description: "Behavior Identification Assessment",
    label: "CPT 97151",
  },
  {
    id: "bc-97151-ts",
    type: "CPT",
    code: "97151",
    modifier: "TS",
    description: "Behavior Identification Assessment (Telehealth)",
    label: "CPT 97151 (TS)",
  },
]

const SUPERVISION_CODES: ScheduleBillingCode[] = [
  {
    id: "bc-97153-xp",
    type: "CPT",
    code: "97153",
    modifier: "XP",
    description: "Adaptive Behavior Treatment by Protocol",
    label: "CPT 97153 (XP)",
  },
  {
    id: "bc-97155-xp",
    type: "CPT",
    code: "97155",
    modifier: "XP",
    description: "Adaptive Behavior Treatment with Protocol Modification",
    label: "CPT 97155 (XP)",
  },
]

const CODES_BY_EVENT_TYPE: Record<EventType, ScheduleBillingCode[]> = {
  session_note: SESSION_NOTE_CODES,
  service_plan: SERVICE_PLAN_CODES,
  supervision: SUPERVISION_CODES,
}

/**
 * Get billing codes available for a given event type.
 */
export function getMockBillingCodesByEventType(eventType: EventType): ScheduleBillingCode[] {
  return CODES_BY_EVENT_TYPE[eventType] ?? []
}

/**
 * Get supervision-specific billing codes (XP modifiers).
 */
export function getMockSupervisionBillingCodes(): ScheduleBillingCode[] {
  return SUPERVISION_CODES
}
