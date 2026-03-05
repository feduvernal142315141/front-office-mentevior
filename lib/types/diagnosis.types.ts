export interface Diagnosis {
  id: string
  clientId: string
  code: string
  name: string
  referralDate: string
  treatmentStartDate: string
  status: boolean
  treatmentEndDate?: string
  isPrimary: boolean
  createdAt?: string
}

export interface CreateDiagnosisDto {
  clientId: string
  code: string
  name: string
  referralDate: string
  treatmentStartDate: string
  status: boolean
  treatmentEndDate?: string
  isPrimary: boolean
}

export interface UpdateDiagnosisDto {
  code: string
  name: string
  referralDate: string
  treatmentStartDate: string
  status: boolean
  treatmentEndDate?: string
  isPrimary: boolean
}
