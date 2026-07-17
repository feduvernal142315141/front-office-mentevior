/**
 * Billing code supervision rules for ABA therapy sessions.
 *
 * 97153 / 97152         → RBT direct therapy → can "Add New Session" (creates a 97155 appointment)
 * 97155 HN              → same behavior as 97153 → can "Add New Session"
 * 97155 / 97155 XP      → BCBA supervision   → can "Add Supervision" (creates a sub-event)
 * 97151 / 97153 XP      → assessment or already concurrent → neither
 */

/** Extracts the numeric code (e.g. "97153") from a label like "CPT 97153 (XP)" */
function extractCode(billingCodeLabel?: string | null): string {
  if (!billingCodeLabel) return ""
  const match = billingCodeLabel.match(/\b(9715[1-5])\b/)
  return match?.[1] ?? ""
}

/** Extracts the modifier (e.g. "XP", "HN", "TS") from a label like "CPT 97153 (XP)" */
function extractModifier(billingCodeLabel?: string | null): string {
  if (!billingCodeLabel) return ""
  const match = billingCodeLabel.match(/\(([^)]+)\)/)
  return match?.[1]?.trim().toUpperCase() ?? ""
}

export type BillingCodeAction = "add_new_session" | "add_supervision" | "none"

/**
 * Determines what supervision-related action is available for an appointment
 * based on its billing code.
 *
 * @param billingCodeLabel - The display label, e.g. "CPT 97153", "CPT 97155 (HN)"
 * @returns The action type
 */
export function getBillingCodeAction(billingCodeLabel?: string | null): BillingCodeAction {
  const code = extractCode(billingCodeLabel)
  const modifier = extractModifier(billingCodeLabel)

  // 97153 with XP modifier = already has concurrent supervision
  if (code === "97153" && modifier === "XP") return "none"

  // 97155 HN behaves like 97153 → can add a new session
  if (code === "97155" && modifier === "HN") return "add_new_session"

  // 97153 / 97152 = RBT therapy → can add a new BCBA session (97155)
  if (code === "97153" || code === "97152") return "add_new_session"

  // 97155 (no modifier or XP) = BCBA supervision → can add supervision sub-event
  if (code === "97155") return "add_supervision"

  // 97151 or anything else = no supervision actions
  return "none"
}

/**
 * Whether the billing code allows the inline supervision switch in the appointment modal.
 * Only 97155 codes (BCBA sessions) can have a supervision sub-event.
 */
export function canHaveInlineSupervision(billingCodeLabel?: string | null): boolean {
  return getBillingCodeAction(billingCodeLabel) === "add_supervision"
}

/**
 * Whether the billing code allows adding a new session (97155) from the context menu.
 * Only 97153 (without XP) and 97152 can trigger this.
 */
export function canAddNewSession(billingCodeLabel?: string | null): boolean {
  return getBillingCodeAction(billingCodeLabel) === "add_new_session"
}
