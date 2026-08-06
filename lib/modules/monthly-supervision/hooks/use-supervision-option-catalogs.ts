"use client"

import { useCallback, useEffect, useState } from "react"
import type { SupervisionOptionCatalogItem } from "@/lib/types/monthly-supervision.types"
import {
  getAppliedOptionCatalog,
  getDocumentOptionCatalog,
} from "../services/monthly-supervision-catalogs.service"

interface UseSupervisionOptionCatalogsReturn {
  documentOptions: SupervisionOptionCatalogItem[]
  appliedOptions: SupervisionOptionCatalogItem[]
  isLoading: boolean
  /** Los endpoints respondieron pero sin opciones: el formulario tiene que avisar */
  isUnavailable: boolean
  refetch: () => Promise<void>
}

/**
 * Los dos catálogos de opciones, en una sola carga.
 *
 * Van juntos porque el formulario los necesita a la vez y no tiene sentido
 * renderizar media lista de checkboxes.
 *
 * ⚠️ Si el backend todavía no expone los endpoints (ver el contrato del
 * 2026-08-05), los servicios devuelven `[]` y `isUnavailable` queda en `true`:
 * el formulario muestra el aviso y no deja guardar un reporte sin opciones.
 */
export function useSupervisionOptionCatalogs(): UseSupervisionOptionCatalogsReturn {
  const [documentOptions, setDocumentOptions] = useState<SupervisionOptionCatalogItem[]>([])
  const [appliedOptions, setAppliedOptions] = useState<SupervisionOptionCatalogItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const [documents, applied] = await Promise.all([
        getDocumentOptionCatalog(),
        getAppliedOptionCatalog(),
      ])
      setDocumentOptions(documents)
      setAppliedOptions(applied)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return {
    documentOptions,
    appliedOptions,
    isLoading,
    isUnavailable: !isLoading && documentOptions.length === 0 && appliedOptions.length === 0,
    refetch: load,
  }
}
