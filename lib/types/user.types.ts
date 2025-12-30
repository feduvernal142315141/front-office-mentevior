

import type { Role } from "./role.types"

export interface MemberUser {
  id: string
  firstName: string
  lastName: string
  email: string
  cellphone: string
  hiringDate: string
  roleId: string
  role?: Role 
  isActive: boolean
  createdAt: string
  updatedAt?: string
}

export interface CreateMemberUserDto {
  firstName: string
  lastName: string
  email: string
  cellphone: string
  hiringDate: string
  roleId: string
}

export interface UpdateMemberUserDto {
  firstName?: string
  lastName?: string
  email?: string
  cellphone?: string
  hiringDate?: string
  roleId?: string
  isActive?: boolean
}

export interface CreateMemberUserResponse {
  id: string
  email: string
  temporaryPassword: string  
  message: string
}


export interface MemberUserListItem {
  id: string
  fullName: string  
  email: string
  cellphone: string
  roleName: string
  hiringDate: string
  isActive: boolean
}
