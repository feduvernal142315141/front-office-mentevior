export interface SupervisionConfig {
  id: string
  name: string
  description: string
  isSubevent: boolean
  credentialIds: string[]
  requirePriorAuthorization: boolean
  billable: boolean
  requireBillingCodes: boolean
  billingCodeIds: string[]
  showEventInfo: boolean
  allowOverlapping: boolean
  startTime: string
  endTime: string
  maxDurationPerDayClient: number
  maxDurationPerDayProvider: number
  maxDurationPerWeekProvider: number
  maxDurationPerWeekClient: number
  showPreviewInCalendar: boolean
  color: string
}

export interface UpsertSupervisionConfigDto {
  id?: string
  name: string
  description: string
  isSubevent: boolean
  credentialIds: string[]
  requirePriorAuthorization: boolean
  billable: boolean
  requireBillingCodes: boolean
  billingCodeIds: string[]
  showEventInfo: boolean
  allowOverlapping: boolean
  startTime: string
  endTime: string
  maxDurationPerDayClient: number
  maxDurationPerDayProvider: number
  maxDurationPerWeekProvider: number
  maxDurationPerWeekClient: number
  showPreviewInCalendar: boolean
  color: string
}
