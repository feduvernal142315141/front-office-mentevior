"use client"

import { useState, useEffect } from "react"
import type { InterventionCatalogItem } from "@/lib/types/appointment-note.types"
import {
  getAntecedentInterventionCatalog,
  getConsequenceInterventionCatalog,
} from "../services/intervention-catalogs.service"

interface UseInterventionCatalogsReturn {
  antecedentInterventions: InterventionCatalogItem[]
  consequenceInterventions: InterventionCatalogItem[]
  isLoading: boolean
  error: Error | null
}

export function useInterventionCatalogs(): UseInterventionCatalogsReturn {
  const [antecedentInterventions, setAntecedent] = useState<InterventionCatalogItem[]>([])
  const [consequenceInterventions, setConsequence] = useState<InterventionCatalogItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false

    const fetchBoth = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const [antecedent, consequence] = await Promise.all([
          getAntecedentInterventionCatalog(),
          getConsequenceInterventionCatalog(),
        ])
        if (cancelled) return
        setAntecedent(antecedent)
        setConsequence(consequence)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err : new Error("Failed to fetch intervention catalogs"))
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void fetchBoth()
    return () => { cancelled = true }
  }, [])

  return { antecedentInterventions, consequenceInterventions, isLoading, error }
}
