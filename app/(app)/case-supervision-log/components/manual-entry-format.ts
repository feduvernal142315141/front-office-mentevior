export function formatHours(value: number): string {
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** `DIRECT` → `Direct` */
export function formatServiceType(value: string): string {
  if (!value) return "—"
  return value.charAt(0) + value.slice(1).toLowerCase()
}
