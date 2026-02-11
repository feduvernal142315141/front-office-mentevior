export type UserCredentialStatus = "Active" | "Expired"

export interface UserCredentialTypeOption {
  id: string
  value: string
  label: string
  requiresIdentificationNumber: boolean
}

export interface UserCredential {
  id: string
  credentialTypeId: string
  credentialTypeName: string
  identificationNumber: string
  effectiveDate: string
  expirationDate: string
  status: UserCredentialStatus
  createdAt: string
  updatedAt: string
}

export interface CreateUserCredentialDto {
  credentialId: string
  identificationNumber: string
  effectiveDate: string
  expirationDate: string
  status?: UserCredentialStatus // Optional - will be calculated from expirationDate if not provided
}

export interface UpdateUserCredentialDto {
  id: string
  credentialId?: string
  identificationNumber?: string
  effectiveDate?: string
  expirationDate?: string
  status?: UserCredentialStatus
}

export interface UserSignature {
  id: string
  imageBase64: string
  createdAt: string
  updatedAt: string
}

export interface CreateUserSignatureDto {
  imageBase64: string
}

export interface UpdateUserSignatureDto {
  imageBase64: string
}
