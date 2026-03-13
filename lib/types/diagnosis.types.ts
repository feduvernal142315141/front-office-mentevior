export interface Diagnosis {
  id: string
  clientId: string
  physicianId?: string
  physicianName?: string
  physicianFirstName?: string
  physicianLastName?: string
  physicianSpecialty?: string
  physicianType?: string
  code: string
  name: string
  referralDate: string
  treatmentStartDate: string
  status: boolean
  treatmentEndDate?: string
  isPrimary: boolean
  attachment?: string
  attachmentDownload?: string
  attachmentFileName?: string
  createdAt?: string
}

export interface CreateDiagnosisDto {
  clientId: string
  physicianId?: string
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
  physicianId?: string
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
