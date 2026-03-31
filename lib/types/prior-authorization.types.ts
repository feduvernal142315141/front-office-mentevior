// ─── Prior Authorization — Domain Types ───────────────────────────────────────
// TODO (backend integration): These types are designed to map directly to the
// backend API response. When integrating:
//  - GET  /client/:clientId/prior-authorizations
//  - POST /client/:clientId/prior-authorizations
//  - PUT  /client/prior-authorizations/:id
//  - DELETE /client/prior-authorizations/:id (soft-delete / cancel only)
// Status is ALWAYS computed client-side from dates — the backend may store it
// but the frontend recalculates it on every render.
// ─────────────────────────────────────────────────────────────────────────────

/** Lifecycle status — computed from dates, never stored in the form */
export type PriorAuthStatus = "Approved" | "Expiring" | "Expired"

/** How units are counted per billing event */
export type UnitsInterval = "UNIT" | "EVENT"

/** Unit used for the Duration field auto-calculation */
export type DurationInterval = "days" | "weeks" | "months"

// ─── Billing Code Entry ───────────────────────────────────────────────────────
// TODO (backend): Each entry maps to a PA line-item. The backend should expose:
//  - billingCodeId: FK to company billing code catalog
//  - usedUnits: incremented by the billing engine when notes are sent to billing
//  - remainingUnits: derived field (approvedUnits - usedUnits), can be computed
//    here or returned directly by the API

export interface PriorAuthBillingCode {
  /** Local entry ID (UUID on the backend) */
  id: string
  /** FK to the company BillingCode catalog */
  billingCodeId: string
  /** Denormalized label for display: "{code} — {description}" */
  billingCodeLabel: string
  /** Total units approved by the insurance for this PA period */
  approvedUnits: number
  /** Units already consumed (incremented by billing events — read-only from UI) */
  usedUnits: number
  /** Computed: approvedUnits - usedUnits */
  remainingUnits: number
  /** How a "unit" is counted */
  unitsInterval: UnitsInterval
  // Optional daily/weekly/monthly caps — if null = no restriction
  maxUnitsPerDay?: number | null
  maxUnitsPerWeek?: number | null
  maxUnitsPerMonth?: number | null
  maxCountPerDay?: number | null
  maxCountPerWeek?: number | null
  maxCountPerMonth?: number | null
}

// ─── File Attachment ──────────────────────────────────────────────────────────
// TODO (backend): Replace base64 `url` with a presigned S3/CDN URL.
// The upload endpoint should be: POST /client/prior-authorizations/:id/files

export interface PriorAuthFile {
  id: string
  name: string
  /** base64 data URL in mock; replace with CDN URL after backend integration */
  url: string
  /** File size in bytes */
  size: number
  uploadedAt: string
}

// ─── Prior Authorization ──────────────────────────────────────────────────────

export interface PriorAuthorization {
  id: string
  clientId: string
  /** PA / Authorization number issued by the insurance */
  authNumber: string
  /** FK to ClientInsurance — only active insurances are allowed */
  insuranceId: string
  /** Denormalized insurance name for display */
  insuranceName: string
  /** Denormalized member/recipient ID from the linked insurance */
  memberInsuranceId: string
  /** FK to client diagnosis — optional, references client's primary diagnosis */
  primaryDiagnosisId?: string | null
  /** Denormalized diagnosis code for display (e.g. "F84.0") */
  primaryDiagnosisCode?: string | null
  startDate: string   // ISO "YYYY-MM-DD"
  endDate: string     // ISO "YYYY-MM-DD"
  durationInterval: DurationInterval
  /** Request date sent to insurance — optional */
  requestDate?: string | null
  /** Date insurance responded — optional */
  responseDate?: string | null
  comments?: string | null
  /**
   * Status is ALWAYS computed client-side via calculatePAStatus().
   * The backend may persist it, but the frontend always derives it from dates.
   * On creation, status is implicitly "Approved" (enforced in service layer).
   */
  status: PriorAuthStatus
  billingCodes: PriorAuthBillingCode[]
  files: PriorAuthFile[]
  createdAt: string
  updatedAt: string
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────
// TODO (backend): Align these DTOs to the actual API request body contracts.
// The backend should NOT receive `status` (computed) or denormalized labels.

export type CreatePriorAuthBillingCodeDto = Omit<
  PriorAuthBillingCode,
  "id" | "remainingUnits" | "billingCodeLabel"
>

export interface CreatePriorAuthorizationDto {
  clientId: string
  authNumber: string
  insuranceId: string
  primaryDiagnosisId?: string | null
  startDate: string
  endDate: string
  durationInterval: DurationInterval
  requestDate?: string | null
  responseDate?: string | null
  comments?: string | null
  billingCodes: CreatePriorAuthBillingCodeDto[]
  files: Omit<PriorAuthFile, "id">[]
}

export interface UpdatePriorAuthorizationDto extends CreatePriorAuthorizationDto {
  id: string
}

// ─── Linked Event (read-only, auto-generated by scheduling engine) ────────────
// TODO (backend): GET /client/prior-authorizations/:paId/billing-codes/:codeId/events
// This is a read-only projection — the frontend never creates linked events.

export interface PriorAuthLinkedEvent {
  id: string
  date: string
  type: string
  time: string
  location: string
  hours: number
  units: number
  clientName: string
  userName: string
  billingCodeLabel: string
  priorAuthNumber: string
  status: "COMPLETED" | "SCHEDULED" | "CANCELLED"
}
