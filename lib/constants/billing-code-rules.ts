interface BillingCodeRuleInput {
  type?: string | null
  code?: string | null
  modifier?: string | null
}

function normalizeBillingCodeParts({
  type,
  code,
  modifier,
}: BillingCodeRuleInput) {
  return {
    type: (type ?? "").trim().toLowerCase(),
    code: (code ?? "").trim(),
    modifier: (modifier ?? "").trim().toLowerCase(),
  }
}

/** CPT 97151 without a modifier does not require a prior authorization. */
export function isPriorAuthorizationRequired({
  type,
  code,
  modifier,
}: BillingCodeRuleInput): boolean {
  const normalized = normalizeBillingCodeParts({ type, code, modifier })
  if (normalized.type === "cpt" && normalized.code === "97151" && !normalized.modifier) {
    return false
  }
  return true
}

export function resolveBillingCodeAutoUnits({
  type,
  code,
  modifier,
}: BillingCodeRuleInput): number | undefined {
  const normalized = normalizeBillingCodeParts({ type, code, modifier })

  if (normalized.type !== "cpt" || normalized.code !== "97151") {
    return undefined
  }

  if (normalized.modifier === "ts") {
    return 18
  }

  if (!normalized.modifier) {
    return 24
  }

  return undefined
}
