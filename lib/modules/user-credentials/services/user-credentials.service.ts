import { serviceGet, servicePost, servicePut, serviceDelete } from "@/lib/services/baseService"
import type {
  UserCredential,
  UserCredentialTypeOption,
  CreateUserCredentialDto,
  UpdateUserCredentialDto,
} from "@/lib/types/user-credentials.types"

const MOCK_CREDENTIAL_TYPE_OPTIONS: UserCredentialTypeOption[] = [
  { id: "1", value: "RBT", label: "RBT", requiresIdentificationNumber: true },
  { id: "2", value: "BCBA", label: "BCBA", requiresIdentificationNumber: true },
  { id: "3", value: "BCaBA", label: "BCaBA", requiresIdentificationNumber: true },
  { id: "4", value: "LMHC", label: "LMHC", requiresIdentificationNumber: true },
  { id: "5", value: "LMFT", label: "LMFT", requiresIdentificationNumber: true },
  { id: "6", value: "LCSW", label: "LCSW", requiresIdentificationNumber: true },
]

const MOCK_USER_CREDENTIALS: UserCredential[] = [
  {
    id: "cred-1",
    credentialTypeId: "2",
    credentialTypeName: "BCBA",
    identificationNumber: "24-345678",
    effectiveDate: "2024-01-15",
    expirationDate: "2026-12-15",
    status: "Active",
    createdAt: "2024-01-15T00:00:00Z",
    updatedAt: "2024-01-15T00:00:00Z",
  },
  {
    id: "cred-2",
    credentialTypeId: "1",
    credentialTypeName: "RBT",
    identificationNumber: "123-456",
    effectiveDate: "2023-05-03",
    expirationDate: "2026-02-25",
    status: "Active",
    createdAt: "2023-05-03T00:00:00Z",
    updatedAt: "2023-05-03T00:00:00Z",
  },
  {
    id: "cred-3",
    credentialTypeId: "3",
    credentialTypeName: "BCaBA",
    identificationNumber: "789-012",
    effectiveDate: "2024-06-01",
    expirationDate: "2027-06-01",
    status: "Active",
    createdAt: "2024-06-01T00:00:00Z",
    updatedAt: "2024-06-01T00:00:00Z",
  },
]

let mockCredentialsStore = [...MOCK_USER_CREDENTIALS]

export async function getUserCredentialTypes(): Promise<UserCredentialTypeOption[]> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  return MOCK_CREDENTIAL_TYPE_OPTIONS
}

export async function getUserCredentials(): Promise<UserCredential[]> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  return mockCredentialsStore
}

export async function getUserCredentialById(id: string): Promise<UserCredential | null> {
  await new Promise((resolve) => setTimeout(resolve, 200))
  return mockCredentialsStore.find((c) => c.id === id) || null
}

export async function createUserCredential(data: CreateUserCredentialDto): Promise<UserCredential> {
  await new Promise((resolve) => setTimeout(resolve, 500))

  const credentialType = MOCK_CREDENTIAL_TYPE_OPTIONS.find((o) => o.id === data.credentialTypeId)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expDate = new Date(data.expirationDate)
  expDate.setHours(0, 0, 0, 0)

  const newCredential: UserCredential = {
    id: `cred-${Date.now()}`,
    credentialTypeId: data.credentialTypeId,
    credentialTypeName: credentialType?.label || "",
    identificationNumber: data.identificationNumber,
    effectiveDate: data.effectiveDate,
    expirationDate: data.expirationDate,
    status: expDate > today ? "Active" : "Expired",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  mockCredentialsStore = [newCredential, ...mockCredentialsStore]
  return newCredential
}

export async function updateUserCredential(
  id: string,
  data: UpdateUserCredentialDto
): Promise<UserCredential> {
  await new Promise((resolve) => setTimeout(resolve, 500))

  const index = mockCredentialsStore.findIndex((c) => c.id === id)
  if (index === -1) throw new Error("Credential not found")

  const existing = mockCredentialsStore[index]
  const credentialType = data.credentialTypeId
    ? MOCK_CREDENTIAL_TYPE_OPTIONS.find((o) => o.id === data.credentialTypeId)
    : null

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expDate = new Date(data.expirationDate || existing.expirationDate)
  expDate.setHours(0, 0, 0, 0)

  const updated: UserCredential = {
    ...existing,
    credentialTypeId: data.credentialTypeId || existing.credentialTypeId,
    credentialTypeName: credentialType?.label || existing.credentialTypeName,
    identificationNumber: data.identificationNumber || existing.identificationNumber,
    effectiveDate: data.effectiveDate || existing.effectiveDate,
    expirationDate: data.expirationDate || existing.expirationDate,
    status: expDate > today ? "Active" : "Expired",
    updatedAt: new Date().toISOString(),
  }

  mockCredentialsStore[index] = updated
  return updated
}

export async function deleteUserCredential(id: string): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  mockCredentialsStore = mockCredentialsStore.filter((c) => c.id !== id)
  return true
}
