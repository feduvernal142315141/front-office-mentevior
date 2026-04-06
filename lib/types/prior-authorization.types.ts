export type PriorAuthStatus = "Approved" | "Expiring" | "Expired"

export type UnitsInterval = "UNIT" | "EVENT"

export type DurationInterval = "DAYS" | "WEEKS" | "MONTHS"

export interface PriorAuthBillingCode {
  id: string
  billingCodeId: string
  billingCodeLabel: string
  approvedUnits: number
  usedUnits: number
  remainingUnits: number
  unitsInterval: UnitsInterval
  maxUnitsPerDay?: number | null
  maxUnitsPerWeek?: number | null
  maxUnitsPerMonth?: number | null
  maxCountPerDay?: number | null
  maxCountPerWeek?: number | null
  maxCountPerMonth?: number | null
}

export interface PriorAuthorization {
  id: string
  clientId: string
  authNumber: string
  insuranceId: string
  insuranceName: string
  memberInsuranceId: string
  primaryDiagnosisId?: string | null
  primaryDiagnosisCode?: string | null
  startDate: string
  endDate: string
  durationInterval: DurationInterval
  requestDate?: string | null
  responseDate?: string | null
  comments?: string | null
  attachment?: string | null
  attachmentName?: string | null
  attachmentDownload?: string | null
  status: PriorAuthStatus
  billingCodes: PriorAuthBillingCode[]
  createdAt: string
  updatedAt: string
}

export type CreatePriorAuthBillingCodeDto = Omit<
  PriorAuthBillingCode,
  "id" | "remainingUnits" | "billingCodeLabel"
>

export interface CreatePriorAuthorizationDto {
  clientId: string
  insuranceId: string
  primaryDiagnosisId?: string | null
  authNumber: string
  startDate: string
  endDate: string
  durationInterval: DurationInterval
  requestDate?: string | null
  responseDate?: string | null
  comments?: string | null
  attachment?: string | null
  attachmentName?: string | null
}

export interface UpdatePriorAuthorizationDto {
  id: string
  insuranceId: string
  primaryDiagnosisId?: string | null
  authNumber: string
  startDate: string
  endDate: string
  durationInterval: DurationInterval
  requestDate?: string | null
  responseDate?: string | null
  comments?: string | null
  attachment?: string | null
  attachmentName?: string | null
}

export interface CreateAuthorizationBillingCodeDto {
  priorAuthorizationId: string
  billingCodeId: string
  approvedUnits: number
  usedUnits: number
  unitsInterval: UnitsInterval
  maxUnitsPerDay?: number | null
  maxUnitsPerWeek?: number | null
  maxUnitsPerMonth?: number | null
  maxCountPerDay?: number | null
  maxCountPerWeek?: number | null
  maxCountPerMonth?: number | null
}

export interface UpdateAuthorizationBillingCodeDto {
  id: string
  priorAuthorizationId: string
  billingCodeId: string
  approvedUnits: number
  usedUnits: number
  unitsInterval: UnitsInterval
  maxUnitsPerDay?: number | null
  maxUnitsPerWeek?: number | null
  maxUnitsPerMonth?: number | null
  maxCountPerDay?: number | null
  maxCountPerWeek?: number | null
  maxCountPerMonth?: number | null
}

export interface PriorAuthLinkedEvent {
  id: string
  date: string
  type: string
  time: string
  location: string
  hours: number
  units: number
  clientName: string
  userName: string
  billingCodeLabel: string
  priorAuthNumber: string
  status: "COMPLETED" | "SCHEDULED" | "CANCELLED"
}
