export function parseDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null

  const isoPattern = /^(\d{4})-(\d{2})-(\d{2})$/
  const isoMatch = dateStr.match(isoPattern)
  if (isoMatch) {
    const [, year, month, day] = isoMatch
    return new Date(Number(year), Number(month) - 1, Number(day))
  }

  const slashPattern = /^(\d{2})\/(\d{2})\/(\d{4})$/
  const slashMatch = dateStr.match(slashPattern)
  if (slashMatch) {
    const [, first, second, year] = slashMatch
    const firstNum = Number(first)
    const secondNum = Number(second)
    
    if (firstNum > 12) {
      return new Date(Number(year), secondNum - 1, firstNum)
    } else if (secondNum > 12) {
      return new Date(Number(year), firstNum - 1, secondNum)
    } else {
      return new Date(Number(year), firstNum - 1, secondNum)
    }
  }

  return null
}

export function parseDateFromBackend(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null

  const isoPattern = /^(\d{4})-(\d{2})-(\d{2})$/
  const isoMatch = dateStr.match(isoPattern)
  if (isoMatch) {
    const [, year, month, day] = isoMatch
    return new Date(Number(year), Number(month) - 1, Number(day))
  }

  const ddmmyyyyPattern = /^(\d{2})\/(\d{2})\/(\d{4})$/
  const ddmmyyyyMatch = dateStr.match(ddmmyyyyPattern)
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch
    return new Date(Number(year), Number(month) - 1, Number(day))
  }

  return null
}

export function formatDateDisplay(dateStr: string | null | undefined): string {
  const date = parseDate(dateStr)
  if (!date || isNaN(date.getTime())) return "—"

  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const year = date.getFullYear()

  return `${month}/${day}/${year}`
}

export function formatDateISO(dateStr: string | null | undefined): string | null {
  const date = parseDate(dateStr)
  if (!date || isNaN(date.getTime())) return null

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

export function formatDateFromDate(date: Date | null | undefined): string {
  if (!date || isNaN(date.getTime())) return "—"

  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const year = date.getFullYear()

  return `${month}/${day}/${year}`
}

export function dateToISO(date: Date | null | undefined): string | null {
  if (!date || isNaN(date.getTime())) return null

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

/**
 * Format date string to readable format
 * @param dateStr - ISO date string or Date object
 * @param format - Format pattern (currently supports "MMM dd, yyyy")
 * @returns Formatted date string or "—" if invalid
 */
export function formatDate(
  dateStr: string | Date | null | undefined, 
  format: "MMM dd, yyyy" | "MM/dd/yyyy" = "MM/dd/yyyy"
): string {
  if (!dateStr) return "—"
  
  const date = typeof dateStr === 'string' ? parseDateFromBackend(dateStr) : dateStr
  if (!date || isNaN(date.getTime())) return "—"

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  
  if (format === "MMM dd, yyyy") {
    const month = monthNames[date.getMonth()]
    const day = date.getDate()
    const year = date.getFullYear()
    return `${month} ${day}, ${year}`
  }
  
  // Default: MM/dd/yyyy
  return formatDateFromDate(date)
}
