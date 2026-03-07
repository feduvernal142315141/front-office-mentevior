export interface ClientProvider {
  id: string
  clientId: string
  userId: string
  fullName: string
  roleName: string
  active: boolean
  terminated: boolean
  createdAt?: string
}

export interface AssignProviderDto {
  clientId: string
  userId: string
}
