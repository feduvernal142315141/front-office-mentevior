import { serviceGet, servicePut } from "@/lib/services/baseService"
import type { SupervisionConfig, UpsertSupervisionConfigDto } from "@/lib/types/supervision-config.types"
import { MOCK_SUPERVISION_CONFIG } from "../mocks/supervision-config.mock"

const USE_MOCK = true

export async function getSupervisionConfig(): Promise<SupervisionConfig | null> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 600))
    return MOCK_SUPERVISION_CONFIG
  }

  const response = await serviceGet<SupervisionConfig>("/supervision_config")

  if (response.status === 404 || !response.data) return null
  if (response.status !== 200) throw new Error("Failed to fetch supervision configuration")

  return response.data as unknown as SupervisionConfig
}

export async function upsertSupervisionConfig(data: UpsertSupervisionConfigDto): Promise<SupervisionConfig> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 800))
    return { ...MOCK_SUPERVISION_CONFIG, ...data, id: data.id ?? MOCK_SUPERVISION_CONFIG.id }
  }

  const response = await servicePut<UpsertSupervisionConfigDto, SupervisionConfig>("/supervision_config", data)

  if (response.status !== 200 && response.status !== 201) {
    throw new Error("Failed to save supervision configuration")
  }

  return response.data as unknown as SupervisionConfig
}
