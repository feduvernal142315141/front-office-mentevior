"use client"

import { useEffect, useState } from "react"
import type { RelationshipCatalogItem } from "../services/relationships.service"
import { getRelationshipCatalog } from "../services/relationships.service"

interface UseRelationshipCatalogReturn {
  relationships: RelationshipCatalogItem[]
  isLoading: boolean
  error: Error | null
}

export function useRelationshipCatalog(): UseRelationshipCatalogReturn {
  const [relationships, setRelationships] = useState<RelationshipCatalogItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchRelationships = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await getRelationshipCatalog()
        setRelationships(data)
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch relationships"))
        setRelationships([])
      } finally {
        setIsLoading(false)
      }
    }

    void fetchRelationships()
  }, [])

  return {
    relationships,
    isLoading,
    error,
  }
}
