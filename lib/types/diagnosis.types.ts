import type { ProviderOnFile } from "./provider-on-file.types"

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
  /** Providers on file asociados al diagnóstico (contrato 2026-08-19) */
  providerOnFiles: ProviderOnFile[]
  createdAt?: string
}

export interface CreateDiagnosisDto {
  clientId: string
  physicianId?: string
  diagnosisCodeId: string
  referralDate: string
  treatmentStartDate: string
  status: boolean
  treatmentEndDate?: string | null
  isPrimary: boolean
  attachment?: string | null
  attachmentFileName?: string | null
  providerOnFileIds?: string[]
}

export interface UpdateDiagnosisDto {
  physicianId?: string
  diagnosisCodeId: string
  referralDate: string
  treatmentStartDate: string
  status: boolean
  /** `null` = limpiar el campo. Omitirlo y mandar `null` llegan igual al backend
   *  (Jackson deserializa ambos como `null`), pero `null` deja la intención explícita. */
  treatmentEndDate?: string | null
  isPrimary: boolean
  /** `null` = eliminar el adjunto guardado. Ver nota de `treatmentEndDate`. */
  attachment?: string | null
  attachmentFileName?: string | null
  providerOnFileIds?: string[]
}
