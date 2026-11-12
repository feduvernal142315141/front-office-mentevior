import { getCredentials } from "@/lib/modules/credentials/services/credentials.service"

export async function shortenAppointmentNoteCredentials(...values: string[]): Promise<string[]> {
  if (!values.some((value) => value.trim())) return values

  const labels: { name: string; shortName: string }[] = []
  const pageSize = 100

  try {
    for (let page = 0; ; page++) {
      const { credentials, totalCount } = await getCredentials({ page, pageSize })
      for (const { name: label } of credentials) {
        // The company list returns `Name (ShortName)` in its name field.
        const match = /^(.*) \(([^()]*)\)$/.exec(label.trim())
        const name = (match?.[1] ?? label).trim().toLowerCase()
        if (name) labels.push({ name, shortName: match?.[2].trim() ?? "" })
      }
      if (!credentials.length || (page + 1) * pageSize >= totalCount) break
    }
  } catch {
    // A credentials lookup failure should still let the session note open.
    return values
  }

  labels.sort((a, b) => b.name.length - a.name.length)

  return values.map((value) => {
    const trimmed = value.trim()
    const normalized = trimmed.toLowerCase()
    const label = labels.find(({ name }) =>
      normalized.startsWith(name) && (normalized.length === name.length || /\s/.test(normalized[name.length])),
    )
    if (!label?.shortName) return value

    const identificationNumber = trimmed.slice(label.name.length).trim()
    return identificationNumber ? `${label.shortName} ${identificationNumber}` : label.shortName
  })
}
