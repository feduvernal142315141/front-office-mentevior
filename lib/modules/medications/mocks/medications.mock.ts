import type { CreateMedicationDto, Medication, UpdateMedicationDto } from "@/lib/types/medication.types"

const DEFAULT_CLIENT_ID = "mock-client-1"

const MOCK_MEDICATIONS_SEED: Medication[] = [
  {
    id: "md-1",
    clientId: DEFAULT_CLIENT_ID,
    name: "Amoxicillin",
    dosage: "250mg",
    prescriptionDate: "2026-01-10",
    treatmentStartDate: "2026-01-12",
    comments: "Take after breakfast",
    createdAt: "2026-01-10",
  },
  {
    id: "md-2",
    clientId: DEFAULT_CLIENT_ID,
    name: "Ibuprofen",
    dosage: "200mg",
    prescriptionDate: "2026-01-14",
    treatmentStartDate: "2026-01-14",
    comments: "Use for pain episodes",
    createdAt: "2026-01-14",
  },
  {
    id: "md-3",
    clientId: DEFAULT_CLIENT_ID,
    name: "VitaminD3",
    dosage: "1000IU",
    prescriptionDate: "2026-01-18",
    treatmentStartDate: "2026-01-20",
    comments: "Administer with lunch",
    createdAt: "2026-01-18",
  },
  {
    id: "md-4",
    clientId: DEFAULT_CLIENT_ID,
    name: "Loratadine",
    dosage: "10mg",
    prescriptionDate: "2026-01-21",
    treatmentStartDate: "2026-01-21",
    comments: "Give before bedtime",
    createdAt: "2026-01-21",
  },
  {
    id: "md-5",
    clientId: DEFAULT_CLIENT_ID,
    name: "Omeprazole",
    dosage: "20mg",
    prescriptionDate: "2026-01-24",
    treatmentStartDate: "2026-01-25",
    comments: "Take before first meal",
    createdAt: "2026-01-24",
  },
  {
    id: "md-6",
    clientId: DEFAULT_CLIENT_ID,
    name: "Prednisone",
    dosage: "5mg",
    prescriptionDate: "2026-01-28",
    treatmentStartDate: "2026-01-29",
    comments: "Monitor daily response",
    createdAt: "2026-01-28",
  },
  {
    id: "md-7",
    clientId: DEFAULT_CLIENT_ID,
    name: "Melatonin",
    dosage: "3mg",
    prescriptionDate: "2026-02-01",
    treatmentStartDate: "2026-02-02",
    comments: "Use 30 minutes before sleep",
    createdAt: "2026-02-01",
  },
  {
    id: "md-8",
    clientId: DEFAULT_CLIENT_ID,
    name: "Cetirizine",
    dosage: "10mg",
    prescriptionDate: "2026-02-04",
    treatmentStartDate: "2026-02-05",
    comments: "Hydrate during treatment",
    createdAt: "2026-02-04",
  },
  {
    id: "md-9",
    clientId: DEFAULT_CLIENT_ID,
    name: "Acetaminophen",
    dosage: "325mg",
    prescriptionDate: "2026-02-07",
    treatmentStartDate: "2026-02-07",
    comments: "Use only if fever appears",
    createdAt: "2026-02-07",
  },
  {
    id: "md-10",
    clientId: DEFAULT_CLIENT_ID,
    name: "Montelukast",
    dosage: "4mg",
    prescriptionDate: "2026-02-11",
    treatmentStartDate: "2026-02-12",
    comments: "Avoid skipping daily dose",
    createdAt: "2026-02-11",
  },
  {
    id: "md-11",
    clientId: DEFAULT_CLIENT_ID,
    name: "Albuterol",
    dosage: "2puffs",
    prescriptionDate: "2026-02-14",
    treatmentStartDate: "2026-02-15",
    comments: "Track respiratory symptoms",
    createdAt: "2026-02-14",
  },
  {
    id: "md-12",
    clientId: DEFAULT_CLIENT_ID,
    name: "Probiotic",
    dosage: "1capsule",
    prescriptionDate: "2026-02-18",
    treatmentStartDate: "2026-02-18",
    comments: "Take with water",
    createdAt: "2026-02-18",
  },
  {
    id: "md-13",
    clientId: "mock-client-2",
    name: "FerrousSulfate",
    dosage: "65mg",
    prescriptionDate: "2026-02-20",
    treatmentStartDate: "2026-02-21",
    comments: "Schedule after breakfast",
    createdAt: "2026-02-20",
  },
]

let mockMedicationsDb: Medication[] = [...MOCK_MEDICATIONS_SEED]

function makeMedicationId(): string {
  return `md-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function getMockMedicationsByClientId(clientId: string): Medication[] {
  const byClient = mockMedicationsDb.filter((medication) => medication.clientId === clientId)
  if (byClient.length > 0) {
    return byClient
  }

  const baseMedications = mockMedicationsDb.filter((medication) => medication.clientId === DEFAULT_CLIENT_ID)
  if (baseMedications.length === 0) {
    return []
  }

  const seededForClient = baseMedications.map((medication, index) => ({
    ...medication,
    id: `${clientId}-md-${index + 1}`,
    clientId,
  }))

  mockMedicationsDb = [...mockMedicationsDb, ...seededForClient]
  return seededForClient
}

export function createMockMedication(data: CreateMedicationDto): string {
  const id = makeMedicationId()
  mockMedicationsDb = [
    {
      id,
      clientId: data.clientId,
      name: data.name,
      dosage: data.dosage || "",
      prescriptionDate: data.prescriptionDate || "",
      treatmentStartDate: data.treatmentStartDate || "",
      comments: data.comments || "",
      createdAt: new Date().toISOString(),
    },
    ...mockMedicationsDb,
  ]

  return id
}

export function updateMockMedication(medicationId: string, data: UpdateMedicationDto): string {
  const existing = mockMedicationsDb.find((medication) => medication.id === medicationId)

  if (!existing) {
    throw new Error("Medication not found")
  }

  mockMedicationsDb = mockMedicationsDb.map((medication) => (
    medication.id === medicationId
      ? {
          ...medication,
          ...data,
        }
      : medication
  ))

  return medicationId
}
