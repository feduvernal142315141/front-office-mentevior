export interface ClientProvider {
  id: string
  clientId: string
  userId: string
  fullName: string
  roleName: string
  active: boolean
  terminated: boolean
  isPrimary: boolean
  createdAt?: string
}

export interface UpdateProviderDto {
  id: string
  isPrimary: boolean
}

export interface ProviderAssignment {
  id: string
  isPrimary: boolean
}

export interface AssignProviderDto {
  clientId: string
  userId: ProviderAssignment[]
}
