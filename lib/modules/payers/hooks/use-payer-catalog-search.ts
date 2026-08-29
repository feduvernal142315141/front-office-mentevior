"use client"

import { useEffect, useRef, useState } from "react"
import type { PayerCatalogSearchItem } from "@/lib/types/payer.types"
import { getPayersService } from "../services/payers.service"

const DEBOUNCE_MS = 500

/**
 * Clearing houses que ya respondieron "no tiene proveedor de catálogo". Vive fuera del
 * hook a propósito: es una característica del clearing house, no del montaje del
 * componente, así que sobrevive a navegar entre pantallas dentro de la misma sesión.
 *
 * Sin esto, cada tecla del nombre lanzaba otra petición condenada a 422 — nueve letras,
 * nueve peticiones fallidas — porque el error dejaba la lista vacía y el campo volvía a
 * pedirse a sí mismo una sugerencia.
 */
const unsupportedClearingHouses = new Set<string>()

interface UsePayerCatalogSearchArgs {
  clearingHouseId: string
  searchText: string
  payerState?: string
  enabled: boolean
}

export function usePayerCatalogSearch({
  clearingHouseId,
  searchText,
  payerState,
  enabled,
}: UsePayerCatalogSearchArgs) {
  const [items, setItems] = useState<PayerCatalogSearchItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isUnsupported, setIsUnsupported] = useState(false)
  const requestIdRef = useRef(0)

  // Se recalcula en cada render para reflejar lo aprendido en peticiones anteriores.
  const knownUnsupported = Boolean(clearingHouseId) && unsupportedClearingHouses.has(clearingHouseId)

  useEffect(() => {
    setIsUnsupported(knownUnsupported)
  }, [knownUnsupported])

  useEffect(() => {
    if (!enabled || !clearingHouseId || !searchText.trim() || knownUnsupported) {
      requestIdRef.current += 1
      setItems([])
      setTotalCount(0)
      setIsLoading(false)
      return
    }

    const timeoutId = window.setTimeout(async () => {
      const requestId = ++requestIdRef.current
      setIsLoading(true)
      try {
        const result = await getPayersService().searchPayerCatalog(clearingHouseId, {
          searchText,
          payerState,
          page: 0,
          pageSize: 20,
        })

        if (result.unsupported) {
          unsupportedClearingHouses.add(clearingHouseId)
          if (requestIdRef.current !== requestId) return
          setIsUnsupported(true)
          setItems([])
          setTotalCount(0)
          return
        }

        if (requestIdRef.current !== requestId) return
        setIsUnsupported(false)
        setItems(result.items)
        setTotalCount(result.totalCount)
      } catch {
        if (requestIdRef.current !== requestId) return
        setItems([])
        setTotalCount(0)
      } finally {
        if (requestIdRef.current === requestId) {
          setIsLoading(false)
        }
      }
    }, DEBOUNCE_MS)

    return () => window.clearTimeout(timeoutId)
  }, [clearingHouseId, searchText, payerState, enabled, knownUnsupported])

  return { items, totalCount, isLoading, isUnsupported }
}
