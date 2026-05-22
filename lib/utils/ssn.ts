export const SSN_FULL_DIGIT_COUNT = 9
export const SSN_MASKED_DIGIT_COUNT = 4

export function normalizeSsnDigits(value: string | undefined | null): string {
  return (value ?? "").replace(/\D/g, "")
}

export function isMaskedSsnFromBackend(value: string | undefined | null): boolean {
  return normalizeSsnDigits(value).length === SSN_MASKED_DIGIT_COUNT
}

export function isFullSsn(value: string | undefined | null): boolean {
  return normalizeSsnDigits(value).length === SSN_FULL_DIGIT_COUNT
}

export function isValidClientSsnForEdit(value: string): boolean {
  const digits = normalizeSsnDigits(value)
  return digits.length === SSN_MASKED_DIGIT_COUNT || digits.length === SSN_FULL_DIGIT_COUNT
}

export function isValidClientSsnForCreate(value: string | undefined | null): boolean {
  const digits = normalizeSsnDigits(value)
  return digits.length === 0 || digits.length === SSN_FULL_DIGIT_COUNT
}

export function ssnForApiPayload(value: string | undefined | null): string | undefined {
  const digits = normalizeSsnDigits(value)
  if (digits.length === SSN_FULL_DIGIT_COUNT) return digits
  return undefined
}
