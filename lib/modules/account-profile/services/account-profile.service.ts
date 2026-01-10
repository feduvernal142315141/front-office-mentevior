
import { serviceGet, servicePut } from "@/lib/services/baseService"
import type { AccountProfile, UpdateAccountProfileDto } from "@/lib/types/account-profile.types"


export async function getAccountProfile(): Promise<AccountProfile | null> {
  const response = await serviceGet<AccountProfile>("/company/by-auth-token")
  
  if (response.status === 404) {
    return null
  }

  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch account profile")
  }

  return response.data as unknown as AccountProfile
}
export async function updateAccountProfile(data: UpdateAccountProfileDto): Promise<boolean> {
  const response = await servicePut<UpdateAccountProfileDto, boolean>("/company/by-auth-token", data)

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to update account profile")
  }

  return response.data as unknown as boolean
}
