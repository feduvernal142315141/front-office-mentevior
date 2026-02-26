"use client"

import { useState, useEffect } from "react"
import type { LanguageCatalogItem } from "../services/languages.service"
import { getLanguagesCatalog } from "../services/languages.service"

interface UseLanguagesCatalogReturn {
  languages: LanguageCatalogItem[]
  isLoading: boolean
  error: Error | null
}

export function useLanguagesCatalog(): UseLanguagesCatalogReturn {
  const [languages, setLanguages] = useState<LanguageCatalogItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await getLanguagesCatalog()
        setLanguages(data)
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch languages"))
        setLanguages([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchLanguages()
  }, [])

  return {
    languages,
    isLoading,
    error,
  }
}
