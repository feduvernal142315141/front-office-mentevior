// Agreement types

export interface AgreementsResponse {
  businessAgreement?: string
  serviceAgreement?: string
}

export interface Agreement {
  id: string
  name: string
  documentUrl: string
}
