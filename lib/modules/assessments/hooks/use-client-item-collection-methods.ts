"use client"

import { useEffect, useMemo, useState } from "react"
import {
  getClientServicePlanByClientId,
  getClientServicePlanCategories,
  getClientServicePlanCategoryItems,
} from "@/lib/modules/client-service-plan/services/client-service-plan.service"
import { useTypeEventCatalog } from "@/lib/modules/service-plans/hooks/use-type-event-catalog"
import type { ClientCategoryWithItems } from "@/lib/types/assessment.types"

interface RawMethods {
  /** clientServicePlanCategory id → typeEventCatalogId configurado en la categoría */
  byCategoryId: Record<string, string>
  /** nombre de categoría (lowercase) → typeEventCatalogId; fallback si los ids no coinciden */
  byCategoryName: Record<string, string>
  /** clientServicePlanCategoryItem id → typeEventCatalogId propio del item (override) */
  byItemId: Record<string, string>
}

const EMPTY_RAW: RawMethods = { byCategoryId: {}, byCategoryName: {}, byItemId: {} }

interface UseClientItemCollectionMethodsReturn {
  /**
   * Nombre del tipo de colección efectivo por item del Assessment
   * (override del item, si no el de su categoría). Sin entrada = desconocido.
   */
  methodByItemId: Record<string, string>
  isLoading: boolean
}

/**
 * El `GET .../category-items` del Assessment no expone el método de colección,
 * así que se resuelve con los endpoints del Service Plan del cliente (los mismos
 * que usa Configuration > Data Collection): tipo de la categoría + override del
 * item, traducidos a nombre con el catálogo de type-event.
 * Cualquier fallo deja el mapa vacío: la UI trata "desconocido" como visible.
 */
export function useClientItemCollectionMethods(
  clientId: string | null | undefined,
  categories: ClientCategoryWithItems[],
): UseClientItemCollectionMethodsReturn {
  const { itemsMap: typeEventMap, isLoading: catalogLoading } = useTypeEventCatalog()
  const [raw, setRaw] = useState<RawMethods>(EMPTY_RAW)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!clientId) {
      setRaw(EMPTY_RAW)
      return
    }

    let active = true
    setIsLoading(true)

    void (async () => {
      try {
        const servicePlan = await getClientServicePlanByClientId(clientId)
        if (!servicePlan) {
          if (active) setRaw(EMPTY_RAW)
          return
        }

        const spCategories = await getClientServicePlanCategories(servicePlan.id)
        const byCategoryId: Record<string, string> = {}
        const byCategoryName: Record<string, string> = {}
        for (const category of spCategories) {
          if (!category.typeEventCatalogId) continue
          byCategoryId[category.id] = category.typeEventCatalogId
          byCategoryName[category.categoryName.trim().toLowerCase()] = category.typeEventCatalogId
        }

        const itemLists = await Promise.all(
          spCategories.map((category) =>
            getClientServicePlanCategoryItems(category.id).catch(() => []),
          ),
        )
        const byItemId: Record<string, string> = {}
        for (const items of itemLists) {
          for (const item of items) {
            const override = item.dataCollection?.typeEventCatalogId
            if (override) byItemId[item.id] = override
          }
        }

        if (active) setRaw({ byCategoryId, byCategoryName, byItemId })
      } catch {
        if (active) setRaw(EMPTY_RAW)
      } finally {
        if (active) setIsLoading(false)
      }
    })()

    return () => {
      active = false
    }
  }, [clientId])

  const methodByItemId = useMemo(() => {
    const result: Record<string, string> = {}
    for (const category of categories) {
      const categoryTypeId =
        raw.byCategoryId[category.id] ?? raw.byCategoryName[category.name.trim().toLowerCase()]
      for (const item of category.items) {
        const typeId = raw.byItemId[item.id] ?? categoryTypeId
        const name = typeId ? typeEventMap.get(typeId)?.name : undefined
        if (name) result[item.id] = name
      }
    }
    return result
  }, [categories, raw, typeEventMap])

  return { methodByItemId, isLoading: isLoading || catalogLoading }
}
