import { serviceGet, servicePut } from "@/lib/services/baseService"
import type { AppointmentConfig, UpsertAppointmentConfigDto } from "@/lib/types/appointment-config.types"

export async function getAppointmentConfig(): Promise<AppointmentConfig | null> {
  const response = await serviceGet<AppointmentConfig>("/appointment_config")

  if (response.status === 404 || !response.data) {
    return null
  }

  if (response.status !== 200) {
    throw new Error("Failed to fetch appointment configuration")
  }

  return response.data as unknown as AppointmentConfig
}

export async function upsertAppointmentConfig(data: UpsertAppointmentConfigDto): Promise<AppointmentConfig> {
  const response = await servicePut<UpsertAppointmentConfigDto, AppointmentConfig>("/appointment_config", data)

  if (response.status !== 200 && response.status !== 201) {
    throw new Error("Failed to save appointment configuration")
  }

  return response.data as unknown as AppointmentConfig
}
