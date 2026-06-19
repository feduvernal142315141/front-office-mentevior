interface PriorAuthorizationDisplayInput {
  authNumber?: string | null
  insuranceName?: string | null
}

/** Human-readable label for prior authorization selects: "# 123 — Ambetter" */
export function formatPriorAuthorizationLabel(
  pa: PriorAuthorizationDisplayInput,
): string {
  const authNumber = (pa.authNumber ?? "").trim()
  const insuranceName = (pa.insuranceName ?? "").trim()

  if (authNumber && insuranceName) return `# ${authNumber} — ${insuranceName}`
  if (authNumber) return `# ${authNumber}`
  if (insuranceName) return insuranceName
  return ""
}
