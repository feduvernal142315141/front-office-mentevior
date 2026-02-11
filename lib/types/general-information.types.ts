/**
 * GENERAL INFORMATION TYPES
 *
 * Types for member-user general information management.
 * Endpoints: GET/PUT /member-users/general-information
 *
 * NOTE: Property names match backend response.
 */

export interface GeneralInformationProfessionalInfo {
  npi: string | null
  mpi: string | null
  caqhNumber: string | null
  companyName: string | null
  ein: string | null
  employerId: string | null
}

export interface GeneralInformation {
  id: string
  firstName: string
  lastName: string
  birthday: string | null
  country: {
    id: string
    name: string
  } | null
  state: {
    id: string
    name: string
  } | null
  city: string
  zipCode: string
  homeAddressLine1: string
  email: string
  cellphone: string
  role: {
    id: string
    name: string
  } | null
  hiringDate: string | null
  ssn: string
  professionalInfo: GeneralInformationProfessionalInfo | null
  createdAt: string
  updatedAt: string
  active: boolean
}

export interface UpdateGeneralInformationDto {
  firstName: string
  lastName: string
  birthday: string
  country: string
  state: string
  city: string
  zipCode: string
  homeAddressLine1: string
  email: string
  cellphone: string
  roleId: string
  hiringDate: string
  ssn: string
  npi: string
  mpi: string
  caqhNumber: string
  companyName: string
  ein: string
  employerId: string
}
