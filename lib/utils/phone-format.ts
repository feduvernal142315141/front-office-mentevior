/**
 * Normalize phone number - strip all non-digit characters
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "")
}

/**
 * Format phone number for display
 * Supports: 3055551234 -> (305) 555-1234
 * or: 13055551234 -> +1 (305) 555-1234
 */
export function formatPhoneDisplay(phone: string): string {
  const digits = normalizePhone(phone)
  
  if (digits.length === 10) {
    // Format: (305) 555-1234
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  } else if (digits.length === 11 && digits.startsWith('1')) {
    // Format: +1 (305) 555-1234
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
  }
  
  // Return as-is if doesn't match expected format
  return phone
}

/**
 * Format phone as user types
 * Automatically adds formatting characters
 */
export function formatPhoneInput(value: string, previousValue: string = ""): string {
  const digits = normalizePhone(value)
  const prevDigits = normalizePhone(previousValue)
  
  // Detect if user is deleting
  const isDeleting = digits.length < prevDigits.length
  
  // Limit to 11 digits max
  const limitedDigits = digits.slice(0, 11)
  
  if (limitedDigits.length === 0) return ""
  
  // Format based on length
  let formatted = ""
  
  if (limitedDigits.length <= 3) {
    formatted = limitedDigits
  } else if (limitedDigits.length <= 6) {
    formatted = `(${limitedDigits.slice(0, 3)}) ${limitedDigits.slice(3)}`
  } else if (limitedDigits.length <= 10) {
    formatted = `(${limitedDigits.slice(0, 3)}) ${limitedDigits.slice(3, 6)}-${limitedDigits.slice(6)}`
  } else {
    // 11 digits with country code
    formatted = `+1 (${limitedDigits.slice(1, 4)}) ${limitedDigits.slice(4, 7)}-${limitedDigits.slice(7)}`
  }
  
  return formatted
}
