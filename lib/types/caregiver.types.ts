export const caregiverRelationshipOptions = [
  "Mother",
  "Father",
  "Brother",
  "Sister",
  "Grandfather",
  "Grandmother",
  "Teacher",
  "Son",
  "Daugther",
  "Grandson",
  "Grandaugther",
  "Husband",
  "Wife",
  "Uncle",
  "Aunt",
] as const

export type CaregiverRelationship = (typeof caregiverRelationshipOptions)[number]

export interface Caregiver {
  id: string
  clientId: string
  firstName: string
  lastName: string
  relationship: CaregiverRelationship
  phone: string
  email: string
  status: boolean
  isPrimary: boolean
  createdAt?: string
}

export interface CreateCaregiverDto {
  clientId: string
  firstName: string
  lastName: string
  relationship: CaregiverRelationship
  phone: string
  email: string
  status: boolean
  isPrimary: boolean
}

export interface UpdateCaregiverDto {
  firstName: string
  lastName: string
  relationship: CaregiverRelationship
  phone: string
  email: string
  status: boolean
  isPrimary: boolean
}
