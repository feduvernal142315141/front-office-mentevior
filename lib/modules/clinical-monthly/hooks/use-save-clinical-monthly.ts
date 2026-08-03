"use client"

import { useCallback, useRef, useState } from "react"
import { toast } from "sonner"
import type { SaveClinicalMonthlyDto } from "@/lib/types/clinical-monthly.types"
import { createClinicalMonthly, updateClinicalMonthly } from "../services/clinical-monthly.service"
import { validateMonthRange, validateUniqueItems } from "../utils/month-range"

interface UseSaveClinicalMonthlyOptions {
  /** Id del reporte cuando se está editando uno existente */
  clinicalMonthlyId?: string
}

interface UseSaveClinicalMonthlyReturn {
  /** Crea la primera vez y actualiza a partir de ahí. Devuelve el id, o null si falló */
  save: (data: SaveClinicalMonthlyDto) => Promise<string | null>
  /** Id del reporte una vez creado (útil para pedir el PDF) */
  clinicalMonthlyId: string | null
  isSaving: boolean
  error: string | null
}

/**
 * Guardado del Clinical Monthly.
 *
 * `POST /reports/clinical-monthly/preview` **persiste** aunque se llame preview:
 * llamarlo dos veces deja dos registros. Por eso este hook recuerda el id y a
 * partir del segundo guardado usa `PUT`, de modo que previsualizar varias veces
 * no ensucie la base.
 */
export function useSaveClinicalMonthly(
  options?: UseSaveClinicalMonthlyOptions,
): UseSaveClinicalMonthlyReturn {
  const [clinicalMonthlyId, setClinicalMonthlyId] = useState<string | null>(
    options?.clinicalMonthlyId ?? null,
  )
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // En ref además del estado: dos "Preview" seguidos no deben crear dos registros
  // por leer un `clinicalMonthlyId` todavía sin re-renderizar.
  const idRef = useRef<string | null>(options?.clinicalMonthlyId ?? null)

  const save = useCallback(async (data: SaveClinicalMonthlyDto): Promise<string | null> => {
    const rangeError = validateMonthRange(data.startMonthYear, data.endMonthYear)
    const itemsError = rangeError ? null : validateUniqueItems(data.items ?? [])
    const validationError = rangeError ?? itemsError

    if (validationError) {
      setError(validationError)
      toast.error("Check the report range", { description: validationError })
      return null
    }

    setIsSaving(true)
    setError(null)

    try {
      const existingId = idRef.current
      const id = existingId
        ? await updateClinicalMonthly(existingId, data)
        : await createClinicalMonthly(data)

      idRef.current = id
      setClinicalMonthlyId(id)
      return id
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save clinical monthly"
      setError(message)
      toast.error("Error saving Clinical Monthly", { description: message })
      return null
    } finally {
      setIsSaving(false)
    }
  }, [])

  return { save, clinicalMonthlyId, isSaving, error }
}
