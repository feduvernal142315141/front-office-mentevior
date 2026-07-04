import { serviceGet, servicePutSilent } from "@/lib/services/baseService"
import { getApiErrorMessage } from "@/lib/utils/api-error-message"
import type { ServicePlanConfig, UpsertServicePlanConfigDto } from "@/lib/types/service-plan-config.types"

export async function getServicePlanConfig(): Promise<ServicePlanConfig | null> {
  const response = await serviceGet<ServicePlanConfig>("/service-plan-config")

  if (response.status === 404 || !response.data) return null
  if (response.status !== 200) throw new Error("Failed to fetch service plan configuration")

  return response.data as unknown as ServicePlanConfig
}

export async function upsertServicePlanConfig(data: UpsertServicePlanConfigDto): Promise<ServicePlanConfig> {
  const response = await servicePutSilent<UpsertServicePlanConfigDto, ServicePlanConfig>("/service-plan-config", data)

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(getApiErrorMessage(response?.data, "Failed to save service plan configuration"))
  }

  return response.data as unknown as ServicePlanConfig
}
