import type {
  CreateDiagnosisDto,
  Diagnosis,
  UpdateDiagnosisDto,
} from "@/lib/types/diagnosis.types"

const DEFAULT_CLIENT_ID = "mock-client-1"

const MOCK_DIAGNOSES_SEED: Diagnosis[] = [
  {
    id: "dg-1",
    clientId: DEFAULT_CLIENT_ID,
    code: "F84.0",
    name: "Autistic disorder",
    referralDate: "2026-01-05",
    treatmentStartDate: "2026-01-12",
    status: true,
    treatmentEndDate: "",
    isPrimary: true,
    createdAt: "2026-01-05",
  },
  {
    id: "dg-2",
    clientId: DEFAULT_CLIENT_ID,
    code: "R62.50",
    name: "Unspecified lack of expected normal physiological development",
    referralDate: "2026-01-09",
    treatmentStartDate: "2026-01-15",
    status: true,
    treatmentEndDate: "",
    isPrimary: false,
    createdAt: "2026-01-09",
  },
  {
    id: "dg-3",
    clientId: DEFAULT_CLIENT_ID,
    code: "F80.9",
    name: "Developmental disorder of speech and language",
    referralDate: "2026-01-13",
    treatmentStartDate: "2026-01-18",
    status: true,
    treatmentEndDate: "",
    isPrimary: false,
    createdAt: "2026-01-13",
  },
  {
    id: "dg-4",
    clientId: DEFAULT_CLIENT_ID,
    code: "F88",
    name: "Other disorders of psychological development",
    referralDate: "2026-01-16",
    treatmentStartDate: "2026-01-22",
    status: true,
    treatmentEndDate: "",
    isPrimary: false,
    createdAt: "2026-01-16",
  },
  {
    id: "dg-5",
    clientId: DEFAULT_CLIENT_ID,
    code: "F90.0",
    name: "Attention-deficit hyperactivity disorder",
    referralDate: "2026-01-20",
    treatmentStartDate: "2026-01-27",
    status: true,
    treatmentEndDate: "",
    isPrimary: false,
    createdAt: "2026-01-20",
  },
  {
    id: "dg-6",
    clientId: DEFAULT_CLIENT_ID,
    code: "Q90.9",
    name: "Down syndrome, unspecified",
    referralDate: "2026-01-25",
    treatmentStartDate: "2026-02-01",
    status: false,
    treatmentEndDate: "2026-02-20",
    isPrimary: false,
    createdAt: "2026-01-25",
  },
  {
    id: "dg-7",
    clientId: DEFAULT_CLIENT_ID,
    code: "G80.9",
    name: "Cerebral palsy, unspecified",
    referralDate: "2026-01-29",
    treatmentStartDate: "2026-02-05",
    status: true,
    treatmentEndDate: "",
    isPrimary: false,
    createdAt: "2026-01-29",
  },
  {
    id: "dg-8",
    clientId: DEFAULT_CLIENT_ID,
    code: "F41.1",
    name: "Generalized anxiety disorder",
    referralDate: "2026-02-02",
    treatmentStartDate: "2026-02-07",
    status: true,
    treatmentEndDate: "",
    isPrimary: false,
    createdAt: "2026-02-02",
  },
  {
    id: "dg-9",
    clientId: DEFAULT_CLIENT_ID,
    code: "M62.81",
    name: "Muscle weakness",
    referralDate: "2026-02-07",
    treatmentStartDate: "2026-02-12",
    status: true,
    treatmentEndDate: "",
    isPrimary: false,
    createdAt: "2026-02-07",
  },
  {
    id: "dg-10",
    clientId: DEFAULT_CLIENT_ID,
    code: "R27.9",
    name: "Lack of coordination",
    referralDate: "2026-02-11",
    treatmentStartDate: "2026-02-16",
    status: true,
    treatmentEndDate: "",
    isPrimary: false,
    createdAt: "2026-02-11",
  },
  {
    id: "dg-11",
    clientId: DEFAULT_CLIENT_ID,
    code: "Z13.41",
    name: "Encounter for autism screening",
    referralDate: "2026-02-15",
    treatmentStartDate: "2026-02-21",
    status: false,
    treatmentEndDate: "2026-03-01",
    isPrimary: false,
    createdAt: "2026-02-15",
  },
  {
    id: "dg-12",
    clientId: DEFAULT_CLIENT_ID,
    code: "F82",
    name: "Specific developmental disorder of motor function",
    referralDate: "2026-02-20",
    treatmentStartDate: "2026-02-25",
    status: true,
    treatmentEndDate: "",
    isPrimary: false,
    createdAt: "2026-02-20",
  },
  {
    id: "dg-13",
    clientId: "mock-client-2",
    code: "F84.9",
    name: "Pervasive developmental disorder, unspecified",
    referralDate: "2026-02-28",
    treatmentStartDate: "2026-03-05",
    status: true,
    treatmentEndDate: "",
    isPrimary: true,
    createdAt: "2026-02-28",
  },
]

let mockDiagnosesDb: Diagnosis[] = [...MOCK_DIAGNOSES_SEED]

function makeDiagnosisId(): string {
  return `dg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function getMockDiagnosesByClientId(clientId: string): Diagnosis[] {
  const byClient = mockDiagnosesDb.filter((diagnosis) => diagnosis.clientId === clientId)
  if (byClient.length > 0) {
    return byClient
  }

  const baseDiagnoses = mockDiagnosesDb.filter((diagnosis) => diagnosis.clientId === DEFAULT_CLIENT_ID)
  if (baseDiagnoses.length === 0) {
    return []
  }

  const seededForClient = baseDiagnoses.map((diagnosis, index) => ({
    ...diagnosis,
    id: `${clientId}-dg-${index + 1}`,
    clientId,
  }))

  mockDiagnosesDb = [...mockDiagnosesDb, ...seededForClient]
  return seededForClient
}

export function createMockDiagnosis(data: CreateDiagnosisDto): string {
  const id = makeDiagnosisId()
  mockDiagnosesDb = [
    {
      id,
      clientId: data.clientId,
      code: data.code,
      name: data.name,
      referralDate: data.referralDate,
      treatmentStartDate: data.treatmentStartDate,
      status: data.status,
      treatmentEndDate: data.treatmentEndDate ?? "",
      isPrimary: data.isPrimary,
      createdAt: new Date().toISOString(),
    },
    ...mockDiagnosesDb,
  ]

  return id
}

export function updateMockDiagnosis(diagnosisId: string, data: UpdateDiagnosisDto): string {
  const existing = mockDiagnosesDb.find((diagnosis) => diagnosis.id === diagnosisId)

  if (!existing) {
    throw new Error("Diagnosis not found")
  }

  mockDiagnosesDb = mockDiagnosesDb.map((diagnosis) => (
    diagnosis.id === diagnosisId
      ? {
          ...diagnosis,
          ...data,
          treatmentEndDate: data.treatmentEndDate ?? "",
        }
      : diagnosis
  ))

  return diagnosisId
}
