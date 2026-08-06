"use client"

import { useCallback, useRef, useState } from "react"
import { toast } from "sonner"
import type { SaveMonthlySupervisionDto } from "@/lib/types/monthly-supervision.types"
import {
  createMonthlySupervision,
  updateMonthlySupervision,
} from "../services/monthly-supervision.service"

interface UseSaveMonthlySupervisionOptions {
  /** Id del reporte cuando se está editando uno existente */
  monthlySupervisionId?: string
}

interface UseSaveMonthlySupervisionReturn {
  /** Crea la primera vez y actualiza a partir de ahí; devuelve el id o `null` */
  save: (data: SaveMonthlySupervisionDto) => Promise<string | null>
  monthlySupervisionId: string | null
  isSaving: boolean
  error: string | null
}

/**
 * Guardado del Monthly Supervision.
 *
 * Mismo patrón que Clinical Monthly: el id se recuerda en un `ref` para que
 * "Save & Preview PDF" pulsado dos veces seguidas actualice el registro en vez
 * de crear uno nuevo — el estado todavía no se re-renderizó entre clics.
 */
export function useSaveMonthlySupervision(
  options?: UseSaveMonthlySupervisionOptions,
): UseSaveMonthlySupervisionReturn {
  const [monthlySupervisionId, setMonthlySupervisionId] = useState<string | null>(
    options?.monthlySupervisionId ?? null,
  )
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const idRef = useRef<string | null>(options?.monthlySupervisionId ?? null)

  const save = useCallback(async (data: SaveMonthlySupervisionDto): Promise<string | null> => {
    setIsSaving(true)
    setError(null)

    try {
      const existingId = idRef.current
      const id = existingId
        ? await updateMonthlySupervision(existingId, data)
        : await createMonthlySupervision(data)

      idRef.current = id
      setMonthlySupervisionId(id)
      return id
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save monthly supervision"
      setError(message)
      toast.error("Error saving Monthly Supervision", { description: message })
      return null
    } finally {
      setIsSaving(false)
    }
  }, [])

  return { save, monthlySupervisionId, isSaving, error }
}
