import type { ServicePlanConfig } from "@/lib/types/service-plan-config.types"

export const MOCK_SERVICE_PLAN_CONFIG: ServicePlanConfig = {
  id: "mock-service-plan-1",
  name: "SERVICE PLAN",
  description: "",
  billingCodeIds: [],
  requireBillingCode: false,
  credentialIds: [],
  billable: true,
  requirePriorAuthorization: false,
  maxBillingCodes: 5,
  color: "#037ECC",
}
