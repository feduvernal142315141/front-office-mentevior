
import { serviceGet, servicePost, servicePut } from "@/lib/services/baseService"
import type { 
  Role, 
  CreateRoleDto, 
  UpdateRoleDto, 
  RoleWithUsage,
  RoleBackendGet,
  RoleBackendMutate 
} from "@/lib/types/role.types"
import { permissionsToFrontend, permissionsToBackend } from "@/lib/utils/permissions-transform"
import {PaginatedResponse} from "@/lib/types/response.types";
import {QueryModel} from "@/lib/models/queryModel";
import {getQueryString} from "@/lib/utils/format";

function normalizeRole(roleBackend: RoleBackendGet): Role {
  const permissions = roleBackend.permissions 
    ? permissionsToFrontend(roleBackend.permissions)
    : []
  
  return {
    id: roleBackend.id,
    name: roleBackend.name,
    permissions,
    createdAt: roleBackend.createAt,
    updatedAt: roleBackend.updateAt,
    isActive: roleBackend.isActive ?? true,
    modules: roleBackend.modules ?? 0,
  }
}


export async function getRoles(query: QueryModel): Promise<Role[]> {
  const response = await serviceGet<PaginatedResponse<RoleBackendGet>>(`/roles${
      query ? `?${getQueryString(query)}` : ''
  }`)
  
  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch roles")
  }
  
  const paginatedData = response.data as unknown as PaginatedResponse<RoleBackendGet>
  
  if (!paginatedData.entities || !Array.isArray(paginatedData.entities)) {
    console.error("Invalid backend response:", response.data)
    return []
  }
  
  return paginatedData.entities.map(normalizeRole)
}


export async function getRoleById(roleId: string): Promise<RoleWithUsage | null> {
  const response = await serviceGet<RoleBackendGet>(`/roles/${roleId}`)
  if (response.status === 404) {
    return null
  }
  
  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch role")
  }
  
  const roleBackend = response.data as unknown as RoleBackendGet
  const normalized = normalizeRole(roleBackend)
  
  return {
    ...normalized,
    usersCount: 0,
    canEdit: true,
  }
}

export async function createRole(data: CreateRoleDto): Promise<Role> {
  const backendPermissions = permissionsToBackend(data.permissions)
  
  const payload = {
    roleName: data.name,
    permissions: backendPermissions,
  }
  
  const response = await servicePost<typeof payload, RoleBackendGet>("/roles", payload)
  
  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to create role")
  }
  
  const roleBackend = response.data as unknown as RoleBackendGet
  return normalizeRole(roleBackend)
}

export async function updateRole(roleId: string, data: UpdateRoleDto): Promise<Role> {
  const backendPermissions = data.permissions 
    ? permissionsToBackend(data.permissions)
    : undefined
  
  const payload: RoleBackendMutate = {
    id: roleId,
    roleName: data.name,
    permissions: backendPermissions || [],
  }
  
  const response = await servicePut<RoleBackendMutate, RoleBackendGet>("/roles", payload)
  
  if (response.status !== 200) {
    throw new Error(response.data?.message || "Failed to update role")
  }
  
  const roleBackend = response.data as unknown as RoleBackendGet
  return normalizeRole(roleBackend)
}
