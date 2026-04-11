"use client"

import { useEffect, useState } from "react"
import type { TimingCatalogItem } from "@/lib/types/timing.types"
import { getTimingCatalog } from "../services/timing-catalog.service"

interface UseTimingCatalogReturn {
  timings: TimingCatalogItem[]
  isLoading: boolean
  error: Error | null
}

export function useTimingCatalog(): UseTimingCatalogReturn {
  const [timings, setTimings] = useState<TimingCatalogItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await getTimingCatalog()
        if (active) setTimings(data)
      } catch (e) {
        if (active) {
          setError(e instanceof Error ? e : new Error("Failed to load timing catalog"))
          setTimings([])
        }
      } finally {
        if (active) setIsLoading(false)
      }
    }

    void load()
    return () => { active = false }
  }, [])

  return { timings, isLoading, error }
}
