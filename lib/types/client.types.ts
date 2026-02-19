export interface Client {
  id: string
  firstName: string
  lastName: string
  phoneNumber: string
  chartId?: string
  diagnosisCode?: string
  insuranceId?: string
  insurance?: ClientInsurance
  rbtId?: string
  rbt?: ClientRBT
  dateOfBirth?: string
  guardianName?: string
  guardianPhone?: string
  address?: string
  active: boolean
  createdAt?: string
  updatedAt?: string
}

export interface ClientListItem {
  id: string
  fullName: string
  chartId: string
  diagnosisCode: string
  insuranceName: string
  rbtName: string
  active: boolean
}

export interface ClientInsurance {
  id: string
  name: string
}

export interface ClientRBT {
  id: string
  firstName: string
  lastName: string
  fullName: string
}

export interface CreateClientDto {
  firstName: string
  lastName: string
  phoneNumber: string
  active?: boolean
  chartId?: string
  diagnosisCode?: string
  insuranceId?: string
  rbtId?: string
  dateOfBirth?: string
  guardianName?: string
  guardianPhone?: string
  address?: string
}

export interface UpdateClientDto {
  id: string
  firstName?: string
  lastName?: string
  phoneNumber?: string
  chartId?: string
  diagnosisCode?: string
  insuranceId?: string
  rbtId?: string
  dateOfBirth?: string
  guardianName?: string
  guardianPhone?: string
  address?: string
  active?: boolean
}

export interface CreateClientResponse {
  id: string
  chartId?: string
}
