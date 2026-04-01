import { calculatePAStatus } from "@/lib/utils/prior-auth-utils"
import type {
  PriorAuthorization,
  PriorAuthBillingCode,
} from "@/lib/types/prior-authorization.types"

const DEFAULT_CLIENT_ID = "mock-client-1"
const ACTIVE_INSURANCE_ID = "ins-2"
const ACTIVE_INSURANCE_NAME = "Children's Medical Services Health Plan"
const MEMBER_ID = "9556927841"

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function makeBillingCodes(
  entries: Array<{
    id: string
    billingCodeId: string
    billingCodeLabel: string
    approvedUnits: number
    usedUnits: number
    unitsInterval?: "UNIT" | "EVENT"
  }>
): PriorAuthBillingCode[] {
  return entries.map((e) => ({
    ...e,
    remainingUnits: e.approvedUnits - e.usedUnits,
    unitsInterval: e.unitsInterval ?? "UNIT",
    maxUnitsPerDay: null,
    maxUnitsPerWeek: null,
    maxUnitsPerMonth: null,
    maxCountPerDay: null,
    maxCountPerWeek: null,
    maxCountPerMonth: null,
  }))
}

const MOCK_PA_SEED: PriorAuthorization[] = [
  {
    id: "pa-1",
    clientId: DEFAULT_CLIENT_ID,
    authNumber: "11277869",
    insuranceId: ACTIVE_INSURANCE_ID,
    insuranceName: ACTIVE_INSURANCE_NAME,
    memberInsuranceId: MEMBER_ID,
    primaryDiagnosisId: "diag-1",
    primaryDiagnosisCode: "F84.0",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    durationInterval: "WEEKS",
    requestDate: "2025-12-01",
    responseDate: "2025-12-10",
    comments: "Annual authorization approved by Carelon. All services confirmed.",
    attachment: null,
    attachmentName: null,
    status: "Approved",
    billingCodes: makeBillingCodes([
      {
        id: "bc-entry-1",
        billingCodeId: "bc-97153",
        billingCodeLabel: "97153 — Adaptive behavior treatment by protocol",
        approvedUnits: 3120,
        usedUnits: 1392,
      },
      {
        id: "bc-entry-2",
        billingCodeId: "bc-97155",
        billingCodeLabel: "97155 — Adaptive behavior treatment with protocol modification",
        approvedUnits: 312,
        usedUnits: 144,
      },
      {
        id: "bc-entry-3",
        billingCodeId: "bc-97156",
        billingCodeLabel: "97156 — Family adaptive behavior treatment guidance",
        approvedUnits: 104,
        usedUnits: 100,
      },
      {
        id: "bc-entry-4",
        billingCodeId: "bc-97151-ts",
        billingCodeLabel: "97151-TS — Behavior identification assessment",
        approvedUnits: 18,
        usedUnits: 0,
      },
    ]),
    createdAt: "2025-12-10T10:00:00.000Z",
    updatedAt: "2026-01-05T09:30:00.000Z",
  },

  {
    id: "pa-2",
    clientId: DEFAULT_CLIENT_ID,
    authNumber: "14387545",
    insuranceId: ACTIVE_INSURANCE_ID,
    insuranceName: ACTIVE_INSURANCE_NAME,
    memberInsuranceId: MEMBER_ID,
    primaryDiagnosisId: "diag-1",
    primaryDiagnosisCode: "F84.0",
    startDate: "2025-06-09",
    endDate: "2026-05-09",
    durationInterval: "WEEKS",
    requestDate: "2025-05-15",
    responseDate: "2025-06-01",
    comments: null,
    attachment: null,
    attachmentName: null,
    status: "Expiring",
    billingCodes: makeBillingCodes([
      {
        id: "bc-entry-5",
        billingCodeId: "bc-97151-ts",
        billingCodeLabel: "97151-TS — Behavior identification assessment",
        approvedUnits: 18,
        usedUnits: 18,
      },
      {
        id: "bc-entry-6",
        billingCodeId: "bc-97155",
        billingCodeLabel: "97155 — Adaptive behavior treatment with protocol modification",
        approvedUnits: 416,
        usedUnits: 344,
      },
      {
        id: "bc-entry-7",
        billingCodeId: "bc-97156",
        billingCodeLabel: "97156 — Family adaptive behavior treatment guidance",
        approvedUnits: 104,
        usedUnits: 104,
      },
      {
        id: "bc-entry-8",
        billingCodeId: "bc-97153",
        billingCodeLabel: "97153 — Adaptive behavior treatment by protocol",
        approvedUnits: 3120,
        usedUnits: 2842,
      },
    ]),
    createdAt: "2025-06-01T08:00:00.000Z",
    updatedAt: "2026-01-10T11:00:00.000Z",
  },

  {
    id: "pa-3",
    clientId: DEFAULT_CLIENT_ID,
    authNumber: "14387545",
    insuranceId: ACTIVE_INSURANCE_ID,
    insuranceName: ACTIVE_INSURANCE_NAME,
    memberInsuranceId: MEMBER_ID,
    primaryDiagnosisId: null,
    primaryDiagnosisCode: null,
    startDate: "2025-06-01",
    endDate: "2025-06-08",
    durationInterval: "DAYS",
    requestDate: null,
    responseDate: null,
    comments: null,
    attachment: null,
    attachmentName: null,
    status: "Expired",
    billingCodes: makeBillingCodes([
      {
        id: "bc-entry-9",
        billingCodeId: "bc-97151",
        billingCodeLabel: "97151 — Behavior identification assessment",
        approvedUnits: 24,
        usedUnits: 24,
      },
    ]),
    createdAt: "2025-06-01T07:00:00.000Z",
    updatedAt: "2025-06-08T18:00:00.000Z",
  },
]

let mockPADb: PriorAuthorization[] = [...MOCK_PA_SEED]

export function getMockPAsByClientId(clientId: string): PriorAuthorization[] {
  const results = mockPADb.filter((pa) => pa.clientId === clientId)
  return results.map((pa) => ({
    ...pa,
    status: calculatePAStatus(pa.startDate, pa.endDate),
    billingCodes: pa.billingCodes.map((bc) => ({
      ...bc,
      remainingUnits: bc.approvedUnits - bc.usedUnits,
    })),
  }))
}

export function cancelMockPA(paId: string): void {
  const existing = mockPADb.find((pa) => pa.id === paId)
  if (!existing) throw new Error("Prior Authorization not found")
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  mockPADb = mockPADb.map((pa) =>
    pa.id === paId
      ? {
          ...pa,
          endDate: yesterday.toISOString().split("T")[0],
          status: "Expired" as const,
          updatedAt: new Date().toISOString(),
        }
      : pa
  )
}

export function makeNewPAId(): string {
  return makeId("pa")
}
