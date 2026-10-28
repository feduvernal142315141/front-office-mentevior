import { serviceGet, servicePut } from "@/lib/services/baseService"
import type {
  GeneralInformation,
  UpdateGeneralInformationDto,
} from "@/lib/types/general-information.types"

const GENERAL_INFORMATION_SELF_ENDPOINT = "/my-profile/general-information"

interface GeneralInformationRequestOptions {
  selfService?: boolean
}

export async function getGeneralInformation(
  memberUserId: string,
  options: GeneralInformationRequestOptions = {}
): Promise<GeneralInformation | null> {
  const endpoint = options.selfService
    ? GENERAL_INFORMATION_SELF_ENDPOINT
    : `/member-users/general-information/${memberUserId}`
  const response = await serviceGet<GeneralInformation>(
    endpoint
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
  data: UpdateGeneralInformationDto,
  options: GeneralInformationRequestOptions = {}
): Promise<boolean> {
  const endpoint = options.selfService
    ? GENERAL_INFORMATION_SELF_ENDPOINT
    : "/member-users/general-information"
  const payload = options.selfService
    ? (() => {
        const { memberUserId: _memberUserId, ...selfServiceData } = data
        return selfServiceData
      })()
    : data
  const response = await servicePut<UpdateGeneralInformationDto, boolean>(
    endpoint,
    payload
  )

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(
      response.data?.message || "Failed to update general information"
    )
  }

  return response.data as unknown as boolean
}
