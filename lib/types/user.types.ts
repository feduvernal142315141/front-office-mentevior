export interface MemberUser {
  id: string
  firstName: string
  lastName: string
  email: string
  cellphone: string
  hiringDate: string
  roleId?: string
  role?: RoleMemberUser
  professionalInformation?: boolean
  credentialsSignature?: boolean
  active: boolean
  terminated?: boolean
  memberUserTypeIds?: string[]
  /** Backend response uses this field name */
  memberUserTypesIds?: string[]
  billingCodes?: string[]
}

export interface CreateMemberUserDto {
  firstName: string
  lastName: string
  email: string
  cellphone: string
  hiringDate: string
  roleId: string
  memberUserTypeIds?: string[]
  billingCodes: string[]
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
  memberUserTypeIds?: string[]
  billingCodes?: string[]
  /**
   * Manda al correo nuevo el mismo mensaje de `forgotPassword` para que la persona
   * establezca su contraseña. El backend sólo lo envía si `email` cambió de verdad;
   * omitirlo o mandarlo en `false` no genera correo. (Contrato 2026-09-03.)
   */
  resendEmail?: boolean
}

export interface CreateMemberUserResponse {
  id: string
  email: string
}

export interface MemberUserListItem {
  id: string
  fullName: string
  email: string
  memberUserTypeNames: string[]
  hiringDate: string
  active: boolean
  terminated: boolean  // User has been terminated (takes precedence over active/inactive)
}

interface RoleMemberUser{
  id: string
  name: string
}

export interface MemberUserTypeCatalogItem {
  id: string
  name: string
}
