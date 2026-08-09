"use client"

import { useCallback, useEffect, useState } from "react"
import type { CaseSupervisionLogDetail } from "@/lib/types/case-supervision-log.types"
import { getCaseSupervisionLogById } from "../services/case-supervision-log.service"

interface UseCaseSupervisionLogByIdReturn {
  report: CaseSupervisionLogDetail | null
  isLoading: boolean
  /** `true` cuando el backend respondió 404: el reporte no existe */
  notFound: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useCaseSupervisionLogById(id?: string): UseCaseSupervisionLogByIdReturn {
  const [report, setReport] = useState<CaseSupervisionLogDetail | null>(null)
  const [isLoading, setIsLoading] = useState(!!id)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchReport = useCallback(async () => {
    if (!id) {
      setReport(null)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      setNotFound(false)

      const data = await getCaseSupervisionLogById(id)
      setReport(data)
      // Un 404 no es un error de red: es una respuesta válida que merece su
      // propia pantalla, no la tarjeta roja de "algo salió mal".
      setNotFound(data === null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load case supervision log"))
      setReport(null)
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    void fetchReport()
  }, [fetchReport])

  return { report, isLoading, notFound, error, refetch: fetchReport }
}
