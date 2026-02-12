import { serviceGet, servicePut } from "@/lib/services/baseService"
import type {
  GeneralInformation,
  UpdateGeneralInformationDto,
} from "@/lib/types/general-information.types"

export async function getGeneralInformation(
  memberUserId: string
): Promise<GeneralInformation | null> {
  const response = await serviceGet<GeneralInformation>(
    `/member-users/general-information/${memberUserId}`
  )

  if (response.status === 404) {
    return null
  }

  if (response.status !== 200 || !response.data) {
    throw new Error(
      response.data?.message || "Failed to fetch general information"
    )
  }

  return response.data as unknown as GeneralInformation
}

export async function updateGeneralInformation(
  data: UpdateGeneralInformationDto
): Promise<boolean> {
  const response = await servicePut<UpdateGeneralInformationDto, boolean>(
    "/member-users/general-information",
    data
  )

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(
      response.data?.message || "Failed to update general information"
    )
  }

  return response.data as unknown as boolean
}
