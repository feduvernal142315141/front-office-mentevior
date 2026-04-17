const TIME_24H_REGEX = /^([01]?\d|2[0-3]):([0-5]\d)$/
const TIME_12H_REGEX = /^(0?[1-9]|1[0-2])(?::([0-5]\d))?\s*([AaPp][Mm])$/

interface ParsedTime {
  hours24: number
  minutes: number
}

function normalizeTimeInput(value: string): string {
  return value.trim().replace(/\s+/g, " ")
}

export function parseTimeInput(value: string): ParsedTime | null {
  const normalized = normalizeTimeInput(value)
  if (!normalized) return null

  const match24h = normalized.match(TIME_24H_REGEX)
  if (match24h) {
    return {
      hours24: Number(match24h[1]),
      minutes: Number(match24h[2]),
    }
  }

  const match12h = normalized.match(TIME_12H_REGEX)
  if (!match12h) return null

  const hours12 = Number(match12h[1])
  const minutes = Number(match12h[2] ?? "00")
  const period = match12h[3].toUpperCase()

  const hours24 =
    period === "AM"
      ? (hours12 % 12)
      : (hours12 % 12) + 12

  return {
    hours24,
    minutes,
  }
}

export function formatTimeTo24h(value: string): string | null {
  const parsed = parseTimeInput(value)
  if (!parsed) return null

  return `${String(parsed.hours24).padStart(2, "0")}:${String(parsed.minutes).padStart(2, "0")}`
}

export function formatTimeTo12h(value: string): string {
  const parsed = parseTimeInput(value)
  if (!parsed) return ""

  const period = parsed.hours24 >= 12 ? "PM" : "AM"
  const hours12 = parsed.hours24 % 12 || 12

  return `${String(hours12).padStart(2, "0")}:${String(parsed.minutes).padStart(2, "0")} ${period}`
}
