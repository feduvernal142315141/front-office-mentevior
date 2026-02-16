import {serviceGet, servicePost, servicePut} from "@/lib/services/baseService"
import {type CreateMemberUserDto, MemberUser, MemberUserListItem, UpdateMemberUserDto} from "@/lib/types/user.types";
import {PaginatedResponse} from "@/lib/types/response.types";
import {getQueryString} from "@/lib/utils/format";
import {QueryModel} from "@/lib/models/queryModel";


export async function getUsers(query: QueryModel): Promise<{ users: MemberUserListItem[], totalCount: number }> {
  const response = await serviceGet<PaginatedResponse<MemberUserListItem>>(`/member-users${
      query ? `?${getQueryString(query)}` : ''
  }`)
  
  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch users")
  }
  
  const paginatedData = response.data as unknown as PaginatedResponse<MemberUserListItem>
  
  if (!paginatedData.entities || !Array.isArray(paginatedData.entities)) {
    console.error("Invalid backend response:", response.data)
    return { users: [], totalCount: 0 }
  }
  
  return {
    users: paginatedData.entities,
    totalCount: paginatedData.pagination?.total || 0
  }
}


export async function getUserById(memberUserId: string): Promise<MemberUser | null> {
  const response = await serviceGet<MemberUser>(`/member-users/${memberUserId}`)
  
  if (response.status === 404) {
    return null
  }

  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch user")
  }

  return response.data as unknown as MemberUser
}


export async function createUser(data: CreateMemberUserDto): Promise<string> {

  const response = await servicePost<CreateMemberUserDto, string>("/member-users", data)

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to create role")
  }

  return response.data as unknown as string
}

export async function updateUser( data: UpdateMemberUserDto): Promise<Boolean> {
  const response = await servicePut<UpdateMemberUserDto, Boolean>("/member-users", data)

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to update user")
  }

  return response.data as unknown as Boolean
}
