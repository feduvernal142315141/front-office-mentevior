"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

const DEBOUNCE_MS = 400
const PAGE_SIZE = 50

/**
 * Tope de páginas que el hook pide solo cuando el descarte local vacía la lista.
 * Sin él, una búsqueda cuyos resultados estén todos ya mapeados recorrería el catálogo
 * entero a página por petición.
 */
const MAX_AUTO_PAGES = 5

export interface ItemCatalogPage<T> {
  items: T[]
  hasMore: boolean
}

interface UseItemCatalogSearchArgs<T> {
  /** El drawer está abierto: fuera de eso no se pide nada. */
  open: boolean
  /** Trae una página **ya filtrada por el backend** con el término de búsqueda. */
  fetchPage: (params: { page: number; pageSize: number; search: string }) => Promise<ItemCatalogPage<T>>
  getId: (item: T) => string
  getName: (item: T) => string
  /**
   * Descarte que el backend no puede hacer: ítems ya mapeados a la categoría, o de otra
   * categoría cuando el endpoint devuelve el catálogo completo.
   */
  isSelectable?: (item: T) => boolean
  /** Cualquier cambio aquí reinicia la búsqueda (p. ej. la categoría activa). */
  resetKey?: string
}

interface UseItemCatalogSearchReturn<T> {
  searchTerm: string
  setSearchTerm: (value: string) => void
  /** Página(s) cargadas, ya sin los ítems descartados por `isSelectable`. */
  items: T[]
  isLoading: boolean
  isLoadingMore: boolean
  /** El debounce está en vuelo: lo que se ve todavía es el resultado anterior. */
  isSearchPending: boolean
  error: string | null
  hasMore: boolean
  loadMore: () => void
  reset: () => void
}

export function useItemCatalogSearch<T>({
  open,
  fetchPage,
  getId,
  getName,
  isSelectable,
  resetKey = "",
}: UseItemCatalogSearchArgs<T>): UseItemCatalogSearchReturn<T> {
  const [searchTerm, setSearchTerm] = useState("")
  const [appliedSearch, setAppliedSearch] = useState("")
  const [raw, setRaw] = useState<T[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const requestRef = useRef(0)
  const autoPagesRef = useRef(0)
  /** `fetchPage` suele ser una arrow nueva en cada render; sin esto el efecto se relanza solo. */
  const fetchRef = useRef(fetchPage)
  useEffect(() => {
    fetchRef.current = fetchPage
  })

  const trimmedTerm = searchTerm.trim()
  const isSearchPending = trimmedTerm !== appliedSearch

  useEffect(() => {
    if (trimmedTerm === appliedSearch) return
    const timeout = window.setTimeout(() => setAppliedSearch(trimmedTerm), DEBOUNCE_MS)
    return () => window.clearTimeout(timeout)
  }, [trimmedTerm, appliedSearch])

  const reset = useCallback(() => {
    requestRef.current += 1
    autoPagesRef.current = 0
    setSearchTerm("")
    setAppliedSearch("")
    setRaw([])
    setPage(0)
    setHasMore(true)
    setIsLoading(false)
    setIsLoadingMore(false)
    setError(null)
  }, [])

  // Primera página: al abrir, al cambiar la búsqueda aplicada o al cambiar `resetKey`.
  useEffect(() => {
    if (!open) return

    const requestId = ++requestRef.current
    autoPagesRef.current = 0
    setIsLoading(true)
    setError(null)

    void (async () => {
      try {
        const result = await fetchRef.current({ page: 0, pageSize: PAGE_SIZE, search: appliedSearch })
        if (requestRef.current !== requestId) return
        setRaw(result.items)
        setPage(0)
        setHasMore(result.hasMore)
      } catch (err) {
        if (requestRef.current !== requestId) return
        setRaw([])
        setHasMore(false)
        setError(err instanceof Error ? err.message : "Failed to load the item catalog")
      } finally {
        if (requestRef.current === requestId) setIsLoading(false)
      }
    })()
  }, [open, appliedSearch, resetKey])

  useEffect(() => {
    if (!open) reset()
  }, [open, reset])

  const loadMore = useCallback(() => {
    if (isLoading || isLoadingMore || !hasMore) return

    const requestId = requestRef.current
    setIsLoadingMore(true)

    void (async () => {
      try {
        const nextPage = page + 1
        const result = await fetchRef.current({
          page: nextPage,
          pageSize: PAGE_SIZE,
          search: appliedSearch,
        })
        // Una búsqueda nueva invalidó esta página mientras estaba en vuelo.
        if (requestRef.current !== requestId) return
        setRaw((current) => {
          const seen = new Set(current.map(getId))
          return [...current, ...result.items.filter((item) => !seen.has(getId(item)))]
        })
        setPage(nextPage)
        setHasMore(result.hasMore)
      } catch (err) {
        if (requestRef.current !== requestId) return
        setError(err instanceof Error ? err.message : "Failed to load more catalog items")
        setHasMore(false)
      } finally {
        if (requestRef.current === requestId) setIsLoadingMore(false)
      }
    })()
  }, [appliedSearch, getId, hasMore, isLoading, isLoadingMore, page])

  const items = useMemo(() => {
    const visible = isSelectable ? raw.filter(isSelectable) : raw
    return [...visible].sort((a, b) =>
      getName(a).localeCompare(getName(b), undefined, { sensitivity: "base" }),
    )
  }, [raw, isSelectable, getName])

  /**
   * El descarte local puede vaciar una página entera aunque queden coincidencias más
   * adelante. Sólo se pide otra página cuando la búsqueda ya se estabilizó: hacerlo
   * mientras el debounce está en vuelo paginaba el catálogo completo sin filtro.
   */
  useEffect(() => {
    if (!open || isSearchPending || isLoading || isLoadingMore || !hasMore) return
    if (items.length > 0) return
    if (autoPagesRef.current >= MAX_AUTO_PAGES) return
    autoPagesRef.current += 1
    loadMore()
  }, [open, isSearchPending, isLoading, isLoadingMore, hasMore, items.length, loadMore])

  return {
    searchTerm,
    setSearchTerm,
    items,
    isLoading,
    isLoadingMore,
    isSearchPending,
    error,
    hasMore,
    loadMore,
    reset,
  }
}
