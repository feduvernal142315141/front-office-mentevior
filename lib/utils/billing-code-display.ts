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
