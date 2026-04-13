export interface SupervisionConfig {
  id: string
  supervisionName: string
  supervisionDescription: string
  requiredBillingCode: boolean
  requiredPriorAuthorization: boolean
  billable: boolean
  showEventInfo: boolean
  allowOverlapping: boolean
  startTime: string
  endTime: string
  maxDurationPerClient: number
  maxDurationPerProvider: number
  maxDurationPerWeekClient: number
  maxDurationPerWeekProvider: number
  showPreviewInCalendar: boolean
  color: string
  billingCodes: string[]
  credentials: string[]
}

export interface UpsertSupervisionConfigDto {
  id?: string
  supervisionName: string
  supervisionDescription: string
  requiredBillingCode: boolean
  requiredPriorAuthorization: boolean
  billable: boolean
  showEventInfo: boolean
  allowOverlapping: boolean
  startTime: string
  endTime: string
  maxDurationPerClient: number
  maxDurationPerProvider: number
  maxDurationPerWeekClient: number
  maxDurationPerWeekProvider: number
  showPreviewInCalendar: boolean
  color: string
  billingCodes: string[]
  credentials: string[]
}
