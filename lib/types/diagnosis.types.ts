export interface Diagnosis {
  id: string
  clientId: string
  physicianId?: string
  physicianName?: string
  physicianFirstName?: string
  physicianLastName?: string
  physicianSpecialty?: string
  physicianType?: string
  /** ICD catalog row id from API */
  diagnosisCodeId: string | null
  /** Display code from API (`diagnosisCode`) — normalized into `code` for tables/UI */
  code: string
  /** Display description from API (`diagnosisCodeName`) — normalized into `name` */
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
  diagnosisCodeId: string
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
  diagnosisCodeId: string
  referralDate: string
  treatmentStartDate: string
  status: boolean
  treatmentEndDate?: string
  isPrimary: boolean
  attachment?: string
  attachmentFileName?: string
}
