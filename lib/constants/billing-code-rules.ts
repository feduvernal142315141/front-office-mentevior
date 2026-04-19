interface BillingCodeAutoUnitsInput {
  type?: string | null
  code?: string | null
  modifier?: string | null
}

export function resolveBillingCodeAutoUnits({
  type,
  code,
  modifier,
}: BillingCodeAutoUnitsInput): number | undefined {
  const normalizedType = (type ?? "").trim().toLowerCase()
  const normalizedCode = (code ?? "").trim()

  if (normalizedType !== "cpt" || normalizedCode !== "97151") {
    return undefined
  }

  const normalizedModifier = (modifier ?? "").trim().toLowerCase()

  if (normalizedModifier === "ts") {
    return 18
  }

  if (!normalizedModifier) {
    return 24
  }

  return undefined
}
