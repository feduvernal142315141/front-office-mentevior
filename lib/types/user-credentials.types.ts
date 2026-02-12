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
  memberUserId?: string
  status?: UserCredentialStatus // Optional - will be calculated from expirationDate if not provided
}

export interface UpdateUserCredentialDto {
  id: string
  credentialId?: string
  identificationNumber?: string
  effectiveDate?: string
  expirationDate?: string
  memberUserId?: string
  status?: UserCredentialStatus
}

export interface UserSignature {
  url: string
  createdAt?: string
  updatedAt?: string
}

export interface SaveUserSignatureDto {
  memberUserId: string
  signature: string
}
