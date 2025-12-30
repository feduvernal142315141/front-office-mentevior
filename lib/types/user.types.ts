export interface MemberUser {
  id: string
  firstName: string
  lastName: string
  email: string
  cellphone: string
  hiringDate: string
  roleId?: string
  role?: RoleMemberUser
  active: boolean
  terminated?: boolean
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
  id: string
  firstName?: string
  lastName?: string
  email?: string
  cellphone?: string
  hiringDate?: string
  roleId?: string
  active?: boolean
  terminated?: boolean
}

export interface CreateMemberUserResponse {
  id: string
  email: string
}

export interface MemberUserListItem {
  id: string
  fullName: string
  roleName: string
  hiringDate: string
  active: boolean
}

interface RoleMemberUser{
  id: string
  name: string
}
