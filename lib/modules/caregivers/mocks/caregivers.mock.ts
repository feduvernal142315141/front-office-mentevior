import type { Caregiver, CreateCaregiverDto, UpdateCaregiverDto } from "@/lib/types/caregiver.types"

const DEFAULT_CLIENT_ID = "mock-client-1"

const MOCK_CAREGIVERS_SEED: Caregiver[] = [
  {
    id: "cg-1",
    clientId: DEFAULT_CLIENT_ID,
    firstName: "Maria",
    lastName: "Hernandez",
    relationship: "Mother",
    phone: "(305) 555-1201",
    email: "maria.hernandez@example.com",
    status: true,
    isPrimary: true,
    createdAt: "2025-11-03",
  },
  {
    id: "cg-2",
    clientId: DEFAULT_CLIENT_ID,
    firstName: "Jorge",
    lastName: "Hernandez",
    relationship: "Father",
    phone: "(305) 555-1202",
    email: "jorge.hernandez@example.com",
    status: true,
    isPrimary: false,
    createdAt: "2025-11-05",
  },
  {
    id: "cg-3",
    clientId: DEFAULT_CLIENT_ID,
    firstName: "Elena",
    lastName: "Mendez",
    relationship: "Grandmother",
    phone: "(786) 555-1901",
    email: "elena.mendez@example.com",
    status: true,
    isPrimary: false,
    createdAt: "2025-12-01",
  },
  {
    id: "cg-4",
    clientId: DEFAULT_CLIENT_ID,
    firstName: "Carlos",
    lastName: "Ruiz",
    relationship: "Uncle",
    phone: "(954) 555-8833",
    email: "carlos.ruiz@example.com",
    status: false,
    isPrimary: false,
    createdAt: "2025-12-11",
  },
  {
    id: "cg-5",
    clientId: "mock-client-2",
    firstName: "Paula",
    lastName: "Lopez",
    relationship: "Mother",
    phone: "(954) 555-4771",
    email: "paula.lopez@example.com",
    status: true,
    isPrimary: true,
    createdAt: "2025-12-18",
  },
]

let mockCaregiversDb: Caregiver[] = [...MOCK_CAREGIVERS_SEED]

function makeCaregiverId(): string {
  return `cg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function getMockCaregiversByClientId(clientId: string): Caregiver[] {
  const byClient = mockCaregiversDb.filter((caregiver) => caregiver.clientId === clientId)
  if (byClient.length > 0) {
    return byClient
  }

  const baseCaregivers = mockCaregiversDb.filter((caregiver) => caregiver.clientId === DEFAULT_CLIENT_ID)
  if (baseCaregivers.length === 0) {
    return []
  }

  const seededForClient = baseCaregivers.map((caregiver, index) => ({
    ...caregiver,
    id: `${clientId}-cg-${index + 1}`,
    clientId,
  }))

  mockCaregiversDb = [...mockCaregiversDb, ...seededForClient]
  return seededForClient
}

export function createMockCaregiver(data: CreateCaregiverDto): string {
  const id = makeCaregiverId()
  mockCaregiversDb = [
    {
      id,
      clientId: data.clientId,
      firstName: data.firstName,
      lastName: data.lastName,
      relationship: data.relationship,
      phone: data.phone,
      email: data.email,
      status: data.status,
      isPrimary: data.isPrimary,
      createdAt: new Date().toISOString(),
    },
    ...mockCaregiversDb,
  ]

  return id
}

export function updateMockCaregiver(caregiverId: string, data: UpdateCaregiverDto): string {
  const existing = mockCaregiversDb.find((caregiver) => caregiver.id === caregiverId)

  if (!existing) {
    throw new Error("Caregiver not found")
  }

  mockCaregiversDb = mockCaregiversDb.map((caregiver) => (
    caregiver.id === caregiverId
      ? {
          ...caregiver,
          ...data,
        }
      : caregiver
  ))

  return caregiverId
}
