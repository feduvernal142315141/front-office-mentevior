export interface InsurancePlanRateDto {
  insurancePlanId: string
  amount: number
  submitAmount: number
  intervalType: string
  currencyId: string
  alias: string
  startDate: string
  endDate: string
  billingCodeIds: string[]
}

/** Single rate row as returned/stored by the API */
export interface InsurancePlanRateRow extends InsurancePlanRateDto {
  id?: string
}

export interface InsurancePlanGeneralPayload {
  planName: string
  planTypeId: string
  comments: string
}

/** Body for POST create plan — includes payerId per API contract */
export interface InsurancePlanCreatePayload extends InsurancePlanGeneralPayload {
  payerId: string
}

/** Legacy full save (single rate) — kept for compatibility if needed */
export interface InsurancePlanSavePayload {
  planName: string
  planTypeId: string
  comments: string
  rate: InsurancePlanRateDto
}

/** Response from GET /insurance-plans/{payerId} (plan for that payer) */
export interface InsurancePlanDetailDto {
  id?: string
  payerId?: string
  /** Display name for the payer on this plan (API field) */
  payerName?: string
  planName?: string
  planTypeId?: string
  planTypeName?: string
  comments?: string
  clearingHouseName?: string
  /** Preferred: list of rates */
  rates?: InsurancePlanRateRow[]
  /** Legacy: single embedded rate */
  rate?: Partial<InsurancePlanRateDto> & { insurancePlanId?: string; id?: string }
}
