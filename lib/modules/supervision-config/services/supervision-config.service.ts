import { serviceGet, servicePut } from "@/lib/services/baseService"
import type { SupervisionConfig, UpsertSupervisionConfigDto } from "@/lib/types/supervision-config.types"

export async function getSupervisionConfig(): Promise<SupervisionConfig | null> {
  const response = await serviceGet<SupervisionConfig>("/supervision-config")

  if (response.status === 404 || !response.data) return null
  if (response.status !== 200) throw new Error("Failed to fetch supervision configuration")

  return response.data as unknown as SupervisionConfig
}

export async function upsertSupervisionConfig(data: UpsertSupervisionConfigDto): Promise<SupervisionConfig> {
  const response = await servicePut<UpsertSupervisionConfigDto, SupervisionConfig>("/supervision-config", data)

  if (response.status !== 200 && response.status !== 201) {
    throw new Error("Failed to save supervision configuration")
  }

  return response.data as unknown as SupervisionConfig
}
