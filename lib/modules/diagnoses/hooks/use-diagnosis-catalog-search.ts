"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { DiagnosisCatalogItem } from "@/lib/types/diagnosis-catalog.types"
import { buildFilters } from "@/lib/utils/query-filters"
import { getDiagnosisCatalog } from "../services/diagnoses-catalog.service"

const MIN_SEARCH_LENGTH = 2
const INITIAL_PAGE_SIZE = 100
const SEARCH_PAGE_SIZE = 20
const DEBOUNCE_MS = 250

function buildSearchFilters(term: string) {
  const t = term.trim()
  if (t.length < MIN_SEARCH_LENGTH) return undefined
  return buildFilters([], {
    fields: ["code", "shortDescription", "longDescription"],
    search: t,
  })
}

/**
 * liveTerm: texto actual del input. Al abrir el popover se dispara el fetch en el mismo
 * ciclo con ese texto; mientras está abierto, los cambios se debouncean.
 */
export function useDiagnosisCatalogSearch(liveTerm: string, open: boolean) {
  const [termForFetch, setTermForFetch] = useState("")
  const [items, setItems] = useState<DiagnosisCatalogItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const activeRef = useRef(0)
  const prevOpenRef = useRef(false)

  const runFetch = useCallback(async (requestId: number, term: string) => {
    const trimmed = term.trim()
    setIsLoading(true)
    setError(null)
    try {
      if (trimmed.length >= MIN_SEARCH_LENGTH) {
        const filters = buildSearchFilters(trimmed)
        if (!filters?.length) {
          if (activeRef.current !== requestId) return
          setItems([])
          setTotalCount(0)
          return
        }
        const { items: nextItems, totalCount: nextTotal } = await getDiagnosisCatalog({
          page: 0,
          pageSize: SEARCH_PAGE_SIZE,
          filters,
        })
        if (activeRef.current !== requestId) return
        setItems(nextItems)
        setTotalCount(nextTotal)
      } else {
        const { items: nextItems, totalCount: nextTotal } = await getDiagnosisCatalog({
          page: 0,
          pageSize: INITIAL_PAGE_SIZE,
        })
        if (activeRef.current !== requestId) return
        setItems(nextItems)
        setTotalCount(nextTotal)
      }
    } catch (e) {
      if (activeRef.current !== requestId) return
      setError(e instanceof Error ? e : new Error("Catalog request failed"))
      setItems([])
      setTotalCount(0)
    } finally {
      if (activeRef.current === requestId) {
        setIsLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    if (!open) {
      if (prevOpenRef.current) {
        activeRef.current += 1
      }
      prevOpenRef.current = false
      setItems([])
      setTotalCount(0)
      setIsLoading(false)
      setError(null)
      return
    }

    const justOpened = !prevOpenRef.current
    prevOpenRef.current = true

    if (justOpened) {
      const t = liveTerm.trim()
      setTermForFetch(t)
      const requestId = ++activeRef.current
      void runFetch(requestId, t)
      return
    }

    const id = window.setTimeout(() => {
      const t = liveTerm.trim()
      setTermForFetch(t)
      const requestId = ++activeRef.current
      void runFetch(requestId, t)
    }, DEBOUNCE_MS)

    return () => window.clearTimeout(id)
  }, [open, liveTerm, runFetch])

  return { items, totalCount, isLoading, error, termForFetch }
}
