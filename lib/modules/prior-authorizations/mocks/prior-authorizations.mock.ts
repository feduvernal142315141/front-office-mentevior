// ─── Prior Authorizations — In-Memory Mock DB ─────────────────────────────────
// TODO (backend integration): Delete this entire file once the real API is wired.
// Swap USE_MOCK = false in prior-authorizations.service.ts to disable.
//
// Business rules enforced here (mirrors what the backend must validate):
//  - RN-PA-02: Only ONE Approved/Expiring PA per clientId + insuranceId combo
//  - No hard-delete: PAs are never removed from history (only soft-cancel)
//  - usedUnits is read-only from UI — incremented by billing engine on backend
// ─────────────────────────────────────────────────────────────────────────────

import { calculatePAStatus } from "@/lib/utils/prior-auth-utils"
import type {
  PriorAuthorization,
  PriorAuthBillingCode,
  CreatePriorAuthorizationDto,
  UpdatePriorAuthorizationDto,
} from "@/lib/types/prior-authorization.types"

const DEFAULT_CLIENT_ID = "mock-client-1"
// These insurance IDs match the mock client-insurances seed
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

// ─── Seed Data ────────────────────────────────────────────────────────────────

const MOCK_PA_SEED: PriorAuthorization[] = [
  // pa-1: Approved — active, multi-code, mirrors the reference screenshot
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
    durationInterval: "weeks",
    requestDate: "2025-12-01",
    responseDate: "2025-12-10",
    comments: "Annual authorization approved by Carelon. All services confirmed.",
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
    files: [],
    createdAt: "2025-12-10T10:00:00.000Z",
    updatedAt: "2026-01-05T09:30:00.000Z",
  },

  // pa-2: Expiring — vence en ~40 días desde la fecha de escritura (2026-03-31)
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
    durationInterval: "weeks",
    requestDate: "2025-05-15",
    responseDate: "2025-06-01",
    comments: null,
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
    files: [],
    createdAt: "2025-06-01T08:00:00.000Z",
    updatedAt: "2026-01-10T11:00:00.000Z",
  },

  // pa-3: Expired — histórico
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
    durationInterval: "days",
    requestDate: null,
    responseDate: null,
    comments: null,
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
    files: [],
    createdAt: "2025-06-01T07:00:00.000Z",
    updatedAt: "2025-06-08T18:00:00.000Z",
  },
]

// ─── Mutable in-memory DB ─────────────────────────────────────────────────────

let mockPADb: PriorAuthorization[] = [...MOCK_PA_SEED]

// ─── CRUD Functions ───────────────────────────────────────────────────────────

export function getMockPAsByClientId(clientId: string): PriorAuthorization[] {
  const results = mockPADb.filter((pa) => pa.clientId === clientId)
  // Recalculate status on every read to keep it fresh
  return results.map((pa) => ({
    ...pa,
    status: calculatePAStatus(pa.startDate, pa.endDate),
    billingCodes: pa.billingCodes.map((bc) => ({
      ...bc,
      remainingUnits: bc.approvedUnits - bc.usedUnits,
    })),
  }))
}

export function createMockPA(data: CreatePriorAuthorizationDto): PriorAuthorization {
  // RN-PA-02: Enforce only one active PA per client + insurance
  const existingActive = mockPADb.find(
    (pa) =>
      pa.clientId === data.clientId &&
      pa.insuranceId === data.insuranceId &&
      calculatePAStatus(pa.startDate, pa.endDate) !== "Expired"
  )

  if (existingActive) {
    throw new Error(
      `An active Prior Authorization (${existingActive.authNumber}) already exists for this insurance. ` +
      `Only one active authorization is allowed per insurance at a time.`
    )
  }

  const now = new Date().toISOString()
  const id = makeId("pa")

  const newPA: PriorAuthorization = {
    id,
    clientId: data.clientId,
    authNumber: data.authNumber,
    insuranceId: data.insuranceId,
    insuranceName: "", // denormalized — will be filled by hook from insurance list
    memberInsuranceId: "", // denormalized — filled by hook
    primaryDiagnosisId: data.primaryDiagnosisId ?? null,
    primaryDiagnosisCode: null, // filled by hook
    startDate: data.startDate,
    endDate: data.endDate,
    durationInterval: data.durationInterval,
    requestDate: data.requestDate ?? null,
    responseDate: data.responseDate ?? null,
    comments: data.comments ?? null,
    status: calculatePAStatus(data.startDate, data.endDate),
    billingCodes: data.billingCodes.map((bc, index) => ({
      ...bc,
      id: makeId(`bc-entry-new-${index}`),
      billingCodeLabel: "", // filled by hook from billing codes list
      remainingUnits: bc.approvedUnits - bc.usedUnits,
    })),
    files: data.files.map((f) => ({
      ...f,
      id: makeId("file"),
    })),
    createdAt: now,
    updatedAt: now,
  }

  mockPADb = [newPA, ...mockPADb]
  return newPA
}

export function updateMockPA(data: UpdatePriorAuthorizationDto): PriorAuthorization {
  const existing = mockPADb.find((pa) => pa.id === data.id)

  if (!existing) {
    throw new Error("Prior Authorization not found")
  }

  // RN-PA-02: check for conflicts excluding self
  const conflicting = mockPADb.find(
    (pa) =>
      pa.id !== data.id &&
      pa.clientId === data.clientId &&
      pa.insuranceId === data.insuranceId &&
      calculatePAStatus(pa.startDate, pa.endDate) !== "Expired"
  )

  if (conflicting) {
    throw new Error(
      `An active Prior Authorization (${conflicting.authNumber}) already exists for this insurance.`
    )
  }

  const updated: PriorAuthorization = {
    ...existing,
    authNumber: data.authNumber,
    insuranceId: data.insuranceId,
    primaryDiagnosisId: data.primaryDiagnosisId ?? null,
    startDate: data.startDate,
    endDate: data.endDate,
    durationInterval: data.durationInterval,
    requestDate: data.requestDate ?? null,
    responseDate: data.responseDate ?? null,
    comments: data.comments ?? null,
    status: calculatePAStatus(data.startDate, data.endDate),
    billingCodes: data.billingCodes.map((bc, index) => ({
      ...bc,
      id: makeId(`bc-entry-upd-${index}`),
      billingCodeLabel: existing.billingCodes.find((e) => e.billingCodeId === bc.billingCodeId)
        ?.billingCodeLabel ?? "",
      remainingUnits: bc.approvedUnits - bc.usedUnits,
    })),
    files: data.files.map((f) => ({
      ...f,
      id: ("id" in f ? (f as PriorAuthorization["files"][0]).id : null) ?? makeId("file"),
    })),
    updatedAt: new Date().toISOString(),
  }

  mockPADb = mockPADb.map((pa) => (pa.id === data.id ? updated : pa))
  return updated
}

// NOTE: PAs are never hard-deleted — this is kept as a "cancel" stub for future use.
// TODO (backend): Expose a PATCH /prior-authorizations/:id/cancel endpoint instead.
export function cancelMockPA(paId: string): void {
  const existing = mockPADb.find((pa) => pa.id === paId)
  if (!existing) throw new Error("Prior Authorization not found")
  // In mock: just mark as expired by setting endDate to yesterday
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  mockPADb = mockPADb.map((pa) =>
    pa.id === paId
      ? {
          ...pa,
          endDate: yesterday.toISOString().split("T")[0],
          status: "Expired",
          updatedAt: new Date().toISOString(),
        }
      : pa
  )
}
