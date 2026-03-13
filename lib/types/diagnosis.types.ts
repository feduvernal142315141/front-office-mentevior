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
  attachment?: string
  attachmentFileName?: string
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
  attachment?: string
  attachmentFileName?: string
}

export interface UpdateDiagnosisDto {
  code: string
  name: string
  referralDate: string
  treatmentStartDate: string
  status: boolean
  treatmentEndDate?: string
  isPrimary: boolean
  attachment?: string
  attachmentFileName?: string
}
