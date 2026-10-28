import { serviceDelete, serviceGet, servicePut } from "@/lib/services/baseService"
import type { SaveUserSignatureDto, UserSignature } from "@/lib/types/user-credentials.types"

interface BackendSignatureResponse {
  url: string
}

const SIGNATURE_SELF_ENDPOINT = "/my-profile/sign"

interface SignatureRequestOptions {
  selfService?: boolean
}

export async function getSignature(
  memberUserId: string,
  options: SignatureRequestOptions = {}
): Promise<UserSignature | null> {
  const response = await serviceGet<BackendSignatureResponse>(
    options.selfService ? SIGNATURE_SELF_ENDPOINT : `/member-users/sign/${memberUserId}`
  )

  if (response.status === 404 || response.status === 204) {
    return null
  }

  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch signature")
  }

  if (!response.data.url) {
    return null
  }

  return {
    url: response.data.url,
  }
}

export async function saveSignature(
  data: SaveUserSignatureDto,
  options: SignatureRequestOptions = {}
): Promise<UserSignature | null> {
  const { memberUserId: _memberUserId, ...selfServiceData } = data
  const response = await servicePut<SaveUserSignatureDto | Omit<SaveUserSignatureDto, "memberUserId">, BackendSignatureResponse>(
    options.selfService ? SIGNATURE_SELF_ENDPOINT : "/member-users/sign",
    options.selfService ? selfServiceData : data
  )

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to save signature")
  }

  const url = (response.data as BackendSignatureResponse).url
  if (!url) {
    return null
  }

  return { url }
}

export async function deleteSignature(
  memberUserId: string,
  options: SignatureRequestOptions = {}
): Promise<boolean> {
  const response = await serviceDelete<boolean>(
    options.selfService ? SIGNATURE_SELF_ENDPOINT : `/member-users/sign/${memberUserId}`
  )

  if (response.status !== 200 && response.status !== 201 && response.status !== 204) {
    throw new Error(response.data?.message || "Failed to delete signature")
  }

  return true
}
