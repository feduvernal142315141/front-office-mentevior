"use client"

import { useEffect, useState } from "react"
import type { CatalogItem } from "@/lib/types/appointment-note-97155.types"
import {
  getProtocolObservationCatalog,
  getProtocolAdjustmentCatalog,
  getQhpImplementationCatalog,
  getActiveDirectionCatalog,
} from "../services/97155-catalogs.service"

interface Use97155CatalogsReturn {
  protocolObservationItems: CatalogItem[]
  protocolAdjustmentItems: CatalogItem[]
  qhpImplementationItems: CatalogItem[]
  activeDirectionItems: CatalogItem[]
  isLoading: boolean
  error: Error | null
}

export function use97155Catalogs(): Use97155CatalogsReturn {
  const [protocolObservationItems, setProtocolObservationItems] = useState<CatalogItem[]>([])
  const [protocolAdjustmentItems, setProtocolAdjustmentItems] = useState<CatalogItem[]>([])
  const [qhpImplementationItems, setQhpImplementationItems] = useState<CatalogItem[]>([])
  const [activeDirectionItems, setActiveDirectionItems] = useState<CatalogItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)

    Promise.all([
      getProtocolObservationCatalog(),
      getProtocolAdjustmentCatalog(),
      getQhpImplementationCatalog(),
      getActiveDirectionCatalog(),
    ])
      .then(([obs, adj, qhp, dir]) => {
        if (cancelled) return
        setProtocolObservationItems(obs)
        setProtocolAdjustmentItems(adj)
        setQhpImplementationItems(qhp)
        setActiveDirectionItems(dir)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err : new Error("Failed to load 97155 catalogs"))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  return {
    protocolObservationItems,
    protocolAdjustmentItems,
    qhpImplementationItems,
    activeDirectionItems,
    isLoading,
    error,
  }
}
