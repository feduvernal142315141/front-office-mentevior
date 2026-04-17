export function parseProgressOrNull(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null
  }

  if (typeof value === "string") {
    const trimmedValue = value.trim()

    if (!trimmedValue) {
      return null
    }

    const parsed = Number(trimmedValue)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

export function parseProgressOrZero(value: unknown): number {
  const parsed = parseProgressOrNull(value)
  return typeof parsed === "number" ? parsed : 0
}
