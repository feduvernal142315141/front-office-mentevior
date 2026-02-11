import type {
  UserSignature,
  CreateUserSignatureDto,
  UpdateUserSignatureDto,
} from "@/lib/types/user-credentials.types"

let mockSignatureStore: UserSignature | null = null

export async function getSignature(): Promise<UserSignature | null> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  return mockSignatureStore
}

export async function createSignature(data: CreateUserSignatureDto): Promise<UserSignature> {
  await new Promise((resolve) => setTimeout(resolve, 500))

  const newSignature: UserSignature = {
    id: `sig-${Date.now()}`,
    imageBase64: data.imageBase64,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  mockSignatureStore = newSignature
  return newSignature
}

export async function updateSignature(data: UpdateUserSignatureDto): Promise<UserSignature> {
  await new Promise((resolve) => setTimeout(resolve, 500))

  if (!mockSignatureStore) {
    throw new Error("No signature exists to update")
  }

  const updated: UserSignature = {
    ...mockSignatureStore,
    imageBase64: data.imageBase64,
    updatedAt: new Date().toISOString(),
  }

  mockSignatureStore = updated
  return updated
}

export async function deleteSignature(): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  mockSignatureStore = null
  return true
}
