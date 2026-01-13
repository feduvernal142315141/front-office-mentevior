export enum SignatureType {
  NONE = "NONE",  // Deprecated - for backward compatibility
  CHECKMARK = "CHECKMARK",
  SIGNATURE = "SIGNATURE",
}

export interface CaregiverSignatureConfig {
  id: string
  companyId: string
  signatureType: SignatureType
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface UpdateCaregiverSignatureConfigRequest {
  id?: string
  signatureType: SignatureType
  active: boolean
}
