"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export interface PaginatedResource<T> {
  items: T[]
  totalCount: number
}

interface UsePaginatedResourceOptions<T, P> {
  params?: P
  paramsKey: string
  fetcher: (params?: P) => Promise<PaginatedResource<T>>
  enabled?: boolean
}

interface UsePaginatedResourceReturn<T, P> {
  items: T[]
  totalCount: number
  isLoading: boolean
  error: Error | null
  refetch: (params?: P) => Promise<void>
}

/**
 * Shared lifecycle for paginated resources.
 * The consumer only needs to provide the current params, a stable key and a fetcher.
 */
export function usePaginatedResource<T, P>({
  params,
  paramsKey,
  fetcher,
  enabled = true,
}: UsePaginatedResourceOptions<T, P>): UsePaginatedResourceReturn<T, P> {
  const [items, setItems] = useState<T[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(enabled)
  const [error, setError] = useState<Error | null>(null)
  const requestIdRef = useRef(0)
  const paramsRef = useRef(params)
  const fetcherRef = useRef(fetcher)

  paramsRef.current = params
  fetcherRef.current = fetcher

  const fetchResource = useCallback(async (overrideParams?: P) => {
    if (!enabled) return

    const requestId = ++requestIdRef.current
    try {
      setIsLoading(true)
      setError(null)
      const data = await fetcherRef.current(overrideParams ?? paramsRef.current)
      if (requestId !== requestIdRef.current) return
      setItems(data.items)
      setTotalCount(data.totalCount)
    } catch (err) {
      if (requestId !== requestIdRef.current) return
      setError(err instanceof Error ? err : new Error("Failed to fetch resource"))
      setItems([])
      setTotalCount(0)
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false)
    }
  }, [enabled, paramsKey])

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false)
      return
    }

    void fetchResource()
  }, [enabled, fetchResource])

  return { items, totalCount, isLoading, error, refetch: fetchResource }
}
