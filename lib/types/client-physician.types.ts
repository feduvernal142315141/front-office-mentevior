export interface ClientPhysician {
  id: string
  clientId: string
  physicianId: string
  firstName: string
  lastName: string
  fullName: string
  specialty: string
  specialtyName?: string
  type: string
  typeName?: string
  npi: string
  mpi: string
  phone: string
  fax?: string
  email?: string
  active: boolean
  isManual?: boolean
  createdAt?: string
}

export interface AssignClientPhysicianDto {
  clientId: string
  physicianId: string
}

export interface CreateManualClientPhysicianDto {
  clientId: string
  firstName: string
  lastName: string
  specialty: string
  npi: string
  mpi: string
  phone: string
  fax?: string
  email?: string
  type: string
  active: boolean
  companyName?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  countryId?: string
  stateId?: string
}
