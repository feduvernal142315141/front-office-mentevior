interface PriorAuthorizationDisplayInput {
  authNumber?: string | null
  insuranceName?: string | null
}

/** Human-readable label for prior authorization selects: "PA # 123 — Ambetter" */
export function formatPriorAuthorizationLabel(
  pa: PriorAuthorizationDisplayInput,
): string {
  const authNumber = (pa.authNumber ?? "").trim()
  const insuranceName = (pa.insuranceName ?? "").trim()

  if (authNumber && insuranceName) return `PA # ${authNumber} — ${insuranceName}`
  if (authNumber) return `PA # ${authNumber}`
  if (insuranceName) return insuranceName
  return ""
}
