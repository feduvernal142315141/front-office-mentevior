import type { ConfigBillingCodeItem } from "@/lib/types/appointment.types"
import {
  formatBillingCodeDisplay,
  formatBillingCodeLabel,
  normalizeBillingCodeFields,
} from "@/lib/utils/billing-code-display"

/** Shape returned by appointment / service-plan / supervision billing-codes endpoints */
export interface AppointmentBillingCodeApiItem {
  id: string
  name: string
  modifier?: string | null
  type?: string | null
}

export function mapAppointmentBillingCodeApiItem(
  item: AppointmentBillingCodeApiItem,
): ConfigBillingCodeItem {
  const type = (item.type ?? "").trim()
  const code = (item.name ?? "").trim()
  const modifier = (item.modifier ?? "").trim() || undefined
  const label = formatBillingCodeDisplay({ type, code, modifier }) || code || item.id

  return {
    id: item.id,
    type: type || undefined,
    code: code || undefined,
    modifier,
    label,
  }
}

export function normalizeConfigBillingCodeItem(
  raw: Record<string, unknown>,
): ConfigBillingCodeItem | null {
  const id = String(raw.id ?? "").trim()
  if (!id) return null

  // Appointment billing-codes API: { id, name, modifier, type } — `name` is the code
  if ("name" in raw && !("code" in raw)) {
    return mapAppointmentBillingCodeApiItem({
      id,
      name: String(raw.name ?? ""),
      modifier: raw.modifier as string | null | undefined,
      type: raw.type as string | null | undefined,
    })
  }

  const { type, code, modifier } = normalizeBillingCodeFields(raw)
  const label = formatBillingCodeLabel(raw)

  return {
    id,
    type: type ?? undefined,
    code: code ?? undefined,
    modifier: modifier ?? undefined,
    label: label || id,
  }
}

export function normalizeConfigBillingCodeList(data: unknown): ConfigBillingCodeItem[] {
  const list = unwrapBillingCodeList(data)
  if (!list) return []

  return list
    .map((item) =>
      normalizeConfigBillingCodeItem(
        item && typeof item === "object" ? (item as Record<string, unknown>) : {},
      ),
    )
    .filter((item): item is ConfigBillingCodeItem => item !== null)
}

function unwrapBillingCodeList(data: unknown): unknown[] | null {
  if (Array.isArray(data)) return data

  if (data && typeof data === "object") {
    const wrapped = data as { data?: unknown; entities?: unknown }
    if (Array.isArray(wrapped.data)) return wrapped.data
    if (Array.isArray(wrapped.entities)) return wrapped.entities
  }

  return null
}
