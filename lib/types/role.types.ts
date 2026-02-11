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
  modules?: number
  professionalInformation?: boolean
  credentialsSignature?: boolean
}


export interface RoleBackendMutate {
  id?: string  
  name?: string  
  roleName?: string  
  permissions: PermissionBackendFormat[]
  professionalInformation?: boolean
  credentialsSignature?: boolean
}


export interface Role {
  id: string
  name: string
  permissions: string[]  
  createdAt: string
  updatedAt?: string
  isActive: boolean
  modules: number
  professionalInformation: boolean
  credentialsSignature: boolean
}

export interface CreateRoleDto {
  name: string
  permissions: string[]
  professionalInformation: boolean
  credentialsSignature: boolean
}

export interface UpdateRoleDto {
  name?: string
  permissions?: string[] 
  isActive?: boolean
  professionalInformation?: boolean
  credentialsSignature?: boolean
}


export interface RoleWithUsage extends Role {
  usersCount: number  
  canEdit: boolean   
}
