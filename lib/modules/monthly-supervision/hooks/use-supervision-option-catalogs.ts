"use client"

import { useCallback, useEffect, useState } from "react"
import type { SupervisionOptionCatalogItem } from "@/lib/types/monthly-supervision.types"
import {
  getAppliedOptionCatalog,
  getConductedOptionCatalog,
  getDocumentOptionCatalog,
  getEvaluationOptionCatalog,
} from "../services/monthly-supervision-catalogs.service"

interface UseSupervisionOptionCatalogsReturn {
  documentOptions: SupervisionOptionCatalogItem[]
  appliedOptions: SupervisionOptionCatalogItem[]
  conductedOptions: SupervisionOptionCatalogItem[]
  evaluationOptions: SupervisionOptionCatalogItem[]
  isLoading: boolean
  /** Los endpoints respondieron pero sin opciones: el formulario tiene que avisar */
  isUnavailable: boolean
  refetch: () => Promise<void>
}

/**
 * Los catálogos de opciones, en una sola carga.
 *
 * Van juntos porque el formulario los necesita a la vez y no tiene sentido
 * renderizar media lista de checkboxes.
 *
 * Si un catálogo no está disponible, el formulario permite agregar sus
 * elementos manualmente y conserva disponibles los demás catálogos.
 */
export function useSupervisionOptionCatalogs({
  loadCustomOptions = true,
}: { loadCustomOptions?: boolean } = {}): UseSupervisionOptionCatalogsReturn {
  const [documentOptions, setDocumentOptions] = useState<SupervisionOptionCatalogItem[]>([])
  const [appliedOptions, setAppliedOptions] = useState<SupervisionOptionCatalogItem[]>([])
  const [conductedOptions, setConductedOptions] = useState<SupervisionOptionCatalogItem[]>([])
  const [evaluationOptions, setEvaluationOptions] = useState<SupervisionOptionCatalogItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const [documents, applied, conducted, evaluation] = await Promise.all([
        getDocumentOptionCatalog(),
        getAppliedOptionCatalog(),
        loadCustomOptions ? getConductedOptionCatalog() : Promise.resolve([]),
        loadCustomOptions ? getEvaluationOptionCatalog() : Promise.resolve([]),
      ])
      setDocumentOptions(documents)
      setAppliedOptions(applied)
      setConductedOptions(conducted)
      setEvaluationOptions(evaluation)
    } finally {
      setIsLoading(false)
    }
  }, [loadCustomOptions])

  useEffect(() => {
    void load()
  }, [load])

  return {
    documentOptions,
    appliedOptions,
    conductedOptions,
    evaluationOptions,
    isLoading,
    isUnavailable: !isLoading && documentOptions.length === 0 && appliedOptions.length === 0,
    refetch: load,
  }
}
