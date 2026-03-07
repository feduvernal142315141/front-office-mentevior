export interface Caregiver {
  id: string
  clientId: string
  firstName: string
  lastName: string
  fullName?: string
  relationshipId: string
  relationship?: string
  phone: string
  phoneNumber?: string
  email: string
  status: boolean
  isPrimary: boolean
  createdAt?: string
}

export interface CreateCaregiverDto {
  clientId: string
  firstName: string
  lastName: string
  relationshipId: string
  phone: string
  email: string
  status: boolean
  isPrimary: boolean
}

export interface UpdateCaregiverDto {
  firstName: string
  lastName: string
  relationshipId: string
  phone: string
  email: string
  status: boolean
  isPrimary: boolean
}
