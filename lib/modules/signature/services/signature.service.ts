import { serviceDelete, serviceGet, servicePut } from "@/lib/services/baseService"
import type { SaveUserSignatureDto, UserSignature } from "@/lib/types/user-credentials.types"

interface BackendSignatureResponse {
  url: string
}

export async function getSignature(
  memberUserId: string
): Promise<UserSignature | null> {
  const response = await serviceGet<BackendSignatureResponse>(
    `/member-users/sign/${memberUserId}`
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
  data: SaveUserSignatureDto
): Promise<UserSignature | null> {
  const response = await servicePut<SaveUserSignatureDto, BackendSignatureResponse>(
    "/member-users/sign",
    data
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

export async function deleteSignature(memberUserId: string): Promise<boolean> {
  const response = await serviceDelete<boolean>(
    `/member-users/sign/${memberUserId}`
  )

  if (response.status !== 200 && response.status !== 201 && response.status !== 204) {
    throw new Error(response.data?.message || "Failed to delete signature")
  }

  return true
}
