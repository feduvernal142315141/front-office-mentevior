interface BillingCodeDisplayInput {
  type?: string | null
  code?: string | null
  modifier?: string | null
}

export function formatBillingCodeDisplay({
  type,
  code,
  modifier,
}: BillingCodeDisplayInput): string {
  const trimmedType = (type ?? "").trim()
  const trimmedCode = (code ?? "").trim()
  const trimmedModifier = (modifier ?? "").trim()

  const base = [trimmedType, trimmedCode].filter(Boolean).join(" ")

  if (!base) return ""

  return trimmedModifier ? `${base} (${trimmedModifier})` : base
}

/** Normalizes billing code fields from heterogeneous API payloads. */
export function normalizeBillingCodeFields(
  raw: Record<string, unknown>,
): BillingCodeDisplayInput {
  const type = String(
    raw.type ??
      raw.typeName ??
      raw.type_name ??
      raw.billingCodeType ??
      raw.billingCodeTypeCode ??
      raw.billingCodeTypeName ??
      "",
  ).trim()

  const code = String(
    raw.code ??
      raw.billingCodeCode ??
      raw.billingCode ??
      "",
  ).trim() || String(raw.name ?? "").trim()

  const modifier = String(
    raw.modifier ??
      raw.modifiers ??
      raw.billingCodeModifier ??
      "",
  ).trim()

  return {
    type: type || undefined,
    code: code || undefined,
    modifier: modifier || undefined,
  }
}

/** Builds a select label from API data, falling back to legacy `name` fields. */
export function formatBillingCodeLabel(raw: Record<string, unknown>): string {
  const display = formatBillingCodeDisplay(normalizeBillingCodeFields(raw))
  if (display) return display

  return String(
    raw.label ??
      raw.name ??
      raw.billingCodeLabel ??
      raw.billingCodeName ??
      "",
  ).trim()
}
