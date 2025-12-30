export interface PermissionBackendFormat {
  permissionId: string
  actionsValue: number
}


export interface RoleBackendGet {
  id: string
  name: string
  permissions?: PermissionBackendFormat[]  
  createAt: string
  updateAt?: string
  isActive?: boolean
}


export interface RoleBackendMutate {
  id?: string  
  name?: string  
  roleName?: string  
  permissions: PermissionBackendFormat[]
}


export interface Role {
  id: string
  name: string
  permissions: string[]  
  createdAt: string
  updatedAt?: string
  isActive: boolean
}

export interface CreateRoleDto {
  name: string
  permissions: string[]  
}

export interface UpdateRoleDto {
  name?: string
  permissions?: string[] 
  isActive?: boolean
}


export interface RoleWithUsage extends Role {
  usersCount: number  
  canEdit: boolean   
}
