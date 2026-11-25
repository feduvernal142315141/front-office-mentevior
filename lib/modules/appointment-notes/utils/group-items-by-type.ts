import type { AppointmentNoteCategoryItem } from "@/lib/types/appointment-note.types"

export interface ItemTypeGroup {
  /** Nombre del Type; null = ítems sin Type */
  type: string | null
  items: AppointmentNoteCategoryItem[]
}

/**
 * Agrupa los ítems de una categoría por Type, en orden de primera aparición
 * y conservando el orden original dentro de cada grupo.
 */
export function groupItemsByType(items: AppointmentNoteCategoryItem[]): ItemTypeGroup[] {
  const groups: ItemTypeGroup[] = []
  const byType = new Map<string | null, ItemTypeGroup>()
  for (const item of items) {
    const type = item.type?.trim() || null
    let group = byType.get(type)
    if (!group) {
      group = { type, items: [] }
      byType.set(type, group)
      groups.push(group)
    }
    group.items.push(item)
  }
  return groups
}

/** Mismo orden que se ve agrupado, aplanado (para tabs del chart). */
export function orderItemsByType(items: AppointmentNoteCategoryItem[]): AppointmentNoteCategoryItem[] {
  return groupItemsByType(items).flatMap((g) => g.items)
}
