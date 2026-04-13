import type { ServicePlanConfig } from "@/lib/types/service-plan-config.types"

export const MOCK_SERVICE_PLAN_CONFIG: ServicePlanConfig = {
  id: "mock-service-plan-1",
  servicePlanName: "SERVICE PLAN",
  servicePlanDescription: "",
  requiredBillingCode: false,
  requiredPriorAuthorization: false,
  billable: true,
  maxBillingCode: 5,
  color: "#037ECC",
  billingCodes: [],
  credentials: [],
}
