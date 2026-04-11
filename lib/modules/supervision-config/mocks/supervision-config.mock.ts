import type { SupervisionConfig } from "@/lib/types/supervision-config.types"

export const MOCK_SUPERVISION_CONFIG: SupervisionConfig = {
  id: "mock-supervision-1",
  name: "SUPERVISION",
  description: "",
  isSubevent: true,
  credentialIds: [],
  requirePriorAuthorization: false,
  billable: false,
  requireBillingCodes: false,
  billingCodeIds: [],
  showEventInfo: false,
  allowOverlapping: false,
  startTime: "08:00",
  endTime: "18:00",
  maxDurationPerDayClient: 10,
  maxDurationPerDayProvider: 10,
  maxDurationPerWeekProvider: 60,
  maxDurationPerWeekClient: 40,
  showPreviewInCalendar: false,
  color: "#037ECC",
}
