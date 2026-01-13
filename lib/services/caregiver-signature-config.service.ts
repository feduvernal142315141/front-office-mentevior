import { serviceGet, servicePut, servicePost } from "@/lib/services/baseService"
import type {
  CaregiverSignatureConfig,
  UpdateCaregiverSignatureConfigRequest,
} from "@/lib/types/caregiver-signature-config.types"

export async function getCaregiverSignatureConfig(): Promise<CaregiverSignatureConfig | null> {
  const response = await serviceGet<CaregiverSignatureConfig>("/caregiver-signature-config")

  if (response.status === 404 || !response.data) {
    return null
  }

  if (response.status !== 200) {
    throw new Error(response.data?.message || "Failed to fetch caregiver signature configuration")
  }

  return response.data
}

export async function updateCaregiverSignatureConfig(
  data: UpdateCaregiverSignatureConfigRequest
): Promise<string | null> {
  if (data.id) {
    // Update existing configuration
    const response = await servicePut<UpdateCaregiverSignatureConfigRequest, void>(
      `/caregiver-signature-config/${data.id}`,
      data
    )

    if (response.status !== 200) {
      throw new Error("Failed to update caregiver signature configuration")
    }
    
    return data.id
  } else {
    // Create new configuration
    const response = await servicePost<UpdateCaregiverSignatureConfigRequest, string>(
      "/caregiver-signature-config",
      data
    )

    if (response.status !== 200 && response.status !== 201) {
      throw new Error("Failed to create caregiver signature configuration")
    }
    
    // Return the ID of the newly created config
    return response.data || null
  }
}
