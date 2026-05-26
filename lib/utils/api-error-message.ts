const GENERIC_API_MESSAGES = new Set([
  "required",
  "error",
  "bad request",
  "validation failed",
  "invalid request",
])

function asNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function isGenericApiMessage(message: string): boolean {
  return GENERIC_API_MESSAGES.has(message.trim().toLowerCase())
}

function collectValidationMessages(value: unknown): string[] {
  if (!value) return []

  if (typeof value === "string") {
    const text = value.trim()
    return text.length > 0 ? [text] : []
  }

  if (Array.isArray(value)) {
    return value.flatMap(collectValidationMessages)
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>
    const messages: string[] = []

    for (const [key, entry] of Object.entries(record)) {
      if (key === "message" || key === "details") {
        messages.push(...collectValidationMessages(entry))
        continue
      }

      if (entry && typeof entry === "object" && "message" in entry) {
        const nested = asNonEmptyString((entry as { message?: unknown }).message)
        if (nested) messages.push(nested)
        continue
      }

      messages.push(...collectValidationMessages(entry))
    }

    return messages
  }

  return []
}

export function getApiErrorMessage(data: unknown, fallback: string): string {
  return parseApiErrorMessage(data, fallback).description
}

export function parseApiErrorMessage(
  data: unknown,
  fallback: string
): { title: string; description: string } {
  if (!data || typeof data !== "object") {
    return { title: "Error", description: fallback }
  }

  const payload = data as {
    message?: unknown
    details?: unknown
    errors?: unknown
    title?: unknown
  }

  const message = asNonEmptyString(payload.message)
  const details = asNonEmptyString(payload.details)
  const title = asNonEmptyString(payload.title)
  const validationMessages = collectValidationMessages(payload.errors)

  const validationSummary = validationMessages.filter(
    (entry, index, list) => list.indexOf(entry) === index
  )

  if (details && message && isGenericApiMessage(message)) {
    return {
      title: title ?? "Validation required",
      description: validationSummary.length > 0
        ? `${details} (${validationSummary.join(" • ")})`
        : details,
    }
  }

  if (details && !message) {
    return { title: title ?? "Validation required", description: details }
  }

  if (message && validationSummary.length > 0) {
    return {
      title: isGenericApiMessage(message) ? "Validation required" : message,
      description: validationSummary.join(" • "),
    }
  }

  if (message && !isGenericApiMessage(message)) {
    return { title: title ?? "Error", description: message }
  }

  if (message && details) {
    return { title: "Validation required", description: details }
  }

  if (message) {
    return {
      title: "Validation required",
      description: isGenericApiMessage(message) ? fallback : message,
    }
  }

  if (validationSummary.length > 0) {
    return { title: "Validation required", description: validationSummary.join(" • ") }
  }

  return { title: title ?? "Error", description: fallback }
}
