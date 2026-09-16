"use client"

import { useEffect, useState } from "react"
import type { AssessmentCatalogItem, IntensityCatalogItem, PrevalentSetting } from "@/lib/types/assessment.types"
import {
  getAssessmentConductedCatalog,
  getGradeCatalog,
  getIntensityCatalog,
  getPrevalentSettingCatalog,
} from "../services/assessment-catalogs.service"

interface UseAssessmentCatalogsReturn {
  grades: AssessmentCatalogItem[]
  conductedOptions: AssessmentCatalogItem[]
  intensities: IntensityCatalogItem[]
  prevalentSettings: PrevalentSetting[]
  isLoading: boolean
  error: Error | null
}

/** Carga los catálogos del Assessment (grados, conducted, intensity, prevalent setting) en paralelo */
export function useAssessmentCatalogs(): UseAssessmentCatalogsReturn {
  const [grades, setGrades] = useState<AssessmentCatalogItem[]>([])
  const [conductedOptions, setConductedOptions] = useState<AssessmentCatalogItem[]>([])
  const [intensities, setIntensities] = useState<IntensityCatalogItem[]>([])
  const [prevalentSettings, setPrevalentSettings] = useState<PrevalentSetting[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let active = true

    void (async () => {
      try {
        setIsLoading(true)
        setError(null)
        const [gradeData, conductedData, intensityData, prevalentData] = await Promise.all([
          getGradeCatalog(),
          getAssessmentConductedCatalog(),
          getIntensityCatalog().catch(() => [] as IntensityCatalogItem[]),
          getPrevalentSettingCatalog().catch(() => [] as PrevalentSetting[]),
        ])
        if (!active) return
        setGrades(gradeData)
        setConductedOptions(conductedData)
        setIntensities(intensityData)
        setPrevalentSettings(prevalentData)
      } catch (err) {
        if (!active) return
        setError(err instanceof Error ? err : new Error("Failed to fetch assessment catalogs"))
        setGrades([])
        setConductedOptions([])
        setIntensities([])
        setPrevalentSettings([])
      } finally {
        if (active) setIsLoading(false)
      }
    })()

    return () => {
      active = false
    }
  }, [])

  return { grades, conductedOptions, intensities, prevalentSettings, isLoading, error }
}
