import { serviceGet, servicePut } from "@/lib/services/baseService"
import type { ServicePlanConfig, UpsertServicePlanConfigDto } from "@/lib/types/service-plan-config.types"
import { MOCK_SERVICE_PLAN_CONFIG } from "../mocks/service-plan-config.mock"

const USE_MOCK = true

export async function getServicePlanConfig(): Promise<ServicePlanConfig | null> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 600))
    return MOCK_SERVICE_PLAN_CONFIG
  }

  const response = await serviceGet<ServicePlanConfig>("/service_plan_config")

  if (response.status === 404 || !response.data) return null
  if (response.status !== 200) throw new Error("Failed to fetch service plan configuration")

  return response.data as unknown as ServicePlanConfig
}

export async function upsertServicePlanConfig(data: UpsertServicePlanConfigDto): Promise<ServicePlanConfig> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 800))
    return { ...MOCK_SERVICE_PLAN_CONFIG, ...data, id: data.id ?? MOCK_SERVICE_PLAN_CONFIG.id }
  }

  const response = await servicePut<UpsertServicePlanConfigDto, ServicePlanConfig>("/service_plan_config", data)

  if (response.status !== 200 && response.status !== 201) {
    throw new Error("Failed to save service plan configuration")
  }

  return response.data as unknown as ServicePlanConfig
}
