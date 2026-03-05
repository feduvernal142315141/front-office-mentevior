export interface Medication {
  id: string
  clientId: string
  name: string
  dosage: string
  prescriptionDate: string
  treatmentStartDate: string
  comments: string
  createdAt?: string
}

export interface CreateMedicationDto {
  clientId: string
  name: string
  dosage: string
  prescriptionDate: string
  treatmentStartDate: string
  comments: string
}

export interface UpdateMedicationDto {
  name: string
  dosage: string
  prescriptionDate: string
  treatmentStartDate: string
  comments: string
}
