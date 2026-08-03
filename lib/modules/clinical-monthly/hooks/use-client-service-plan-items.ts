"use client"

import { useCallback, useEffect, useState } from "react"
import {
  getClientServicePlanByClientId,
  getClientServicePlanCategories,
  getClientServicePlanCategoryItems,
} from "@/lib/modules/client-service-plan/services/client-service-plan.service"
import { getClients } from "@/lib/modules/clients/services/clients.service"
import { buildFilters } from "@/lib/utils/query-filters"
import { FilterOperator } from "@/lib/models/filterOperator"

/** Item del Service Plan del cliente, listo para pintar en el formulario */
export interface ClinicalMonthlyFormItem {
  /** Es el `clientServicePlanCategoryItemId` que espera el POST/PUT */
  id: string
  name: string
  description?: string
}

export interface ClinicalMonthlyFormCategory {
  id: string
  name: string
  items: ClinicalMonthlyFormItem[]
}

interface UseClientServicePlanItemsReturn {
  categories: ClinicalMonthlyFormCategory[]
  isLoading: boolean
  error: Error | null
  reload: () => Promise<void>
}

/**
 * Service Plan **activo** del cliente.
 *
 * El propio cliente trae `clientServicePlanId`, y es el que usa toda la app para
 * navegar a la configuración del plan (ver `useClientsTable.tsx:216`): esa es la
 * fuente autoritativa. `getClientServicePlanByClientId` queda de respaldo, pero
 * resuelve filtrando por `active` y quedándose con el último de la página, así
 * que si el cliente tuvo más de un plan puede devolver uno viejo — y entonces el
 * backend rechaza todos los items con "do not belong to the client's active
 * service plan".
 */
async function resolveClientServicePlanId(clientId: string): Promise<string | null> {
  try {
    const { clients } = await getClients({
      page: 0,
      pageSize: 1,
      filters: buildFilters([
        { field: "id", operator: FilterOperator.eq, value: clientId, type: "uuid" },
      ]),
    })

    const fromClient = clients[0]?.clientServicePlanId
    if (fromClient) return fromClient
  } catch (error) {
    console.warn("[ClinicalMonthly] Could not read clientServicePlanId from the client:", error)
  }

  const servicePlan = await getClientServicePlanByClientId(clientId)
  return servicePlan?.id ?? null
}

/**
 * Categorías e items del Service Plan del cliente, que son las filas del
 * formulario de Clinical Monthly.
 *
 * El `GET /reports/clinical-monthly/{id}` también los devuelve, pero sólo de un
 * reporte que ya existe; al crear uno nuevo hay que resolverlos desde el Service
 * Plan del cliente. El `id` del item mapeado ES el `clientServicePlanCategoryItemId`
 * que piden el POST y el PUT (ver `normalizeClientCategoryMappedItem`).
 */
export function useClientServicePlanItems(clientId?: string | null): UseClientServicePlanItemsReturn {
  const [categories, setCategories] = useState<ClinicalMonthlyFormCategory[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    if (!clientId) {
      setCategories([])
      setError(null)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const servicePlanId = await resolveClientServicePlanId(clientId)
      if (!servicePlanId) {
        setCategories([])
        return
      }

      const categorySummaries = await getClientServicePlanCategories(servicePlanId)

      // Una llamada por categoría; en paralelo para no encadenar latencias
      const withItems = await Promise.all(
        categorySummaries.map(async (category) => {
          const items = await getClientServicePlanCategoryItems(category.id)
          return {
            id: category.id,
            name: category.categoryName,
            items: items
              .filter((item) => item.active !== false && item.id)
              .map((item) => ({
                id: item.id,
                name: item.itemName,
                description: item.description,
              })),
          }
        }),
      )

      setCategories(withItems.filter((category) => category.items.length > 0))
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load service plan items"))
      setCategories([])
    } finally {
      setIsLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    void load()
  }, [load])

  return { categories, isLoading, error, reload: load }
}
