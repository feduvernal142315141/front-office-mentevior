"use client"

import { useEffect, useState } from "react"
import type { AssessmentCatalogItem, IntensityCatalogItem } from "@/lib/types/assessment.types"
import {
  getAssessmentConductedCatalog,
  getGradeCatalog,
  getIntensityCatalog,
} from "../services/assessment-catalogs.service"

interface UseAssessmentCatalogsReturn {
  grades: AssessmentCatalogItem[]
  conductedOptions: AssessmentCatalogItem[]
  intensities: IntensityCatalogItem[]
  isLoading: boolean
  error: Error | null
}

/** Carga los catálogos del Assessment (grados, conducted, intensity) en paralelo */
export function useAssessmentCatalogs(): UseAssessmentCatalogsReturn {
  const [grades, setGrades] = useState<AssessmentCatalogItem[]>([])
  const [conductedOptions, setConductedOptions] = useState<AssessmentCatalogItem[]>([])
  const [intensities, setIntensities] = useState<IntensityCatalogItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let active = true

    void (async () => {
      try {
        setIsLoading(true)
        setError(null)
        const [gradeData, conductedData, intensityData] = await Promise.all([
          getGradeCatalog(),
          getAssessmentConductedCatalog(),
          getIntensityCatalog().catch(() => [] as IntensityCatalogItem[]),
        ])
        if (!active) return
        setGrades(gradeData)
        setConductedOptions(conductedData)
        setIntensities(intensityData)
      } catch (err) {
        if (!active) return
        setError(err instanceof Error ? err : new Error("Failed to fetch assessment catalogs"))
        setGrades([])
        setConductedOptions([])
        setIntensities([])
      } finally {
        if (active) setIsLoading(false)
      }
    })()

    return () => {
      active = false
    }
  }, [])

  return { grades, conductedOptions, intensities, isLoading, error }
}
