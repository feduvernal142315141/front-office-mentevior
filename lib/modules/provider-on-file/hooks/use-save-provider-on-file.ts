"use client"

import { useCallback, useState } from "react"
import { toast } from "sonner"
import type { SaveProviderOnFileDto } from "@/lib/types/provider-on-file.types"
import { createProviderOnFile, updateProviderOnFile } from "../services/provider-on-file.service"

interface UseSaveProviderOnFileReturn {
  /** Crea (sin id) o actualiza (con id); devuelve el id guardado o null si falló */
  save: (data: SaveProviderOnFileDto, id?: string) => Promise<string | null>
  isSaving: boolean
}

export function useSaveProviderOnFile(): UseSaveProviderOnFileReturn {
  const [isSaving, setIsSaving] = useState(false)

  const save = useCallback(async (data: SaveProviderOnFileDto, id?: string): Promise<string | null> => {
    setIsSaving(true)
    try {
      const savedId = id ? await updateProviderOnFile(id, data) : await createProviderOnFile(data)
      toast.success(id ? "Provider updated" : "Provider created")
      return savedId
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save provider"
      toast.error("Error saving provider", { description: message })
      return null
    } finally {
      setIsSaving(false)
    }
  }, [])

  return { save, isSaving }
}
