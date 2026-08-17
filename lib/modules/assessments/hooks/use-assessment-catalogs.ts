"use client"

import { useEffect, useState } from "react"
import type { AssessmentCatalogItem } from "@/lib/types/assessment.types"
import { getAssessmentConductedCatalog, getGradeCatalog } from "../services/assessment-catalogs.service"

interface UseAssessmentCatalogsReturn {
  grades: AssessmentCatalogItem[]
  conductedOptions: AssessmentCatalogItem[]
  isLoading: boolean
  error: Error | null
}

/** Carga los dos catálogos del Assessment (grados y assessment conducted) en paralelo */
export function useAssessmentCatalogs(): UseAssessmentCatalogsReturn {
  const [grades, setGrades] = useState<AssessmentCatalogItem[]>([])
  const [conductedOptions, setConductedOptions] = useState<AssessmentCatalogItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let active = true

    void (async () => {
      try {
        setIsLoading(true)
        setError(null)
        const [gradeData, conductedData] = await Promise.all([
          getGradeCatalog(),
          getAssessmentConductedCatalog(),
        ])
        if (!active) return
        setGrades(gradeData)
        setConductedOptions(conductedData)
      } catch (err) {
        if (!active) return
        setError(err instanceof Error ? err : new Error("Failed to fetch assessment catalogs"))
        setGrades([])
        setConductedOptions([])
      } finally {
        if (active) setIsLoading(false)
      }
    })()

    return () => {
      active = false
    }
  }, [])

  return { grades, conductedOptions, isLoading, error }
}
