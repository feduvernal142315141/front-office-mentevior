export interface Language {
  id: string
  name: string
}

export interface Client {
  id: string
  firstName: string
  lastName: string
  phoneNumber: string
  brithDate?: string
  languages?: Language[]
  genderId?: string
  email?: string
  ssn?: string
  chartId?: string
}

export interface ClientListItem {
  id: string
  fullName: string
  chartId: string
  status: boolean
}

export interface CreateClientDto {
  firstName: string
  lastName: string
  phoneNumber: string
  brithDate?: string
  languages?: string[]
  genderId?: string
  email?: string
  ssn?: string
  chartId?: string
}

export interface UpdateClientDto {
  id: string
  firstName: string
  lastName: string
  phoneNumber: string
  brithDate?: string
  languages?: string[]
  genderId?: string
  email?: string
  ssn?: string
  chartId?: string
}

export interface CreateClientResponse {
  id: string
  chartId?: string
}
