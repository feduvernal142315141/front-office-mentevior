import type { SupervisionConfig } from "@/lib/types/supervision-config.types"

export const MOCK_SUPERVISION_CONFIG: SupervisionConfig = {
  id: "mock-supervision-1",
  supervisionName: "SUPERVISION",
  supervisionDescription: "",
  requiredBillingCode: false,
  requiredPriorAuthorization: false,
  billable: false,
  showEventInfo: false,
  allowOverlapping: false,
  startTime: "08:00",
  endTime: "18:00",
  maxDurationPerClient: 10,
  maxDurationPerProvider: 10,
  maxDurationPerWeekClient: 40,
  maxDurationPerWeekProvider: 60,
  showPreviewInCalendar: false,
  color: "#037ECC",
  billingCodes: [],
  credentials: [],
}
