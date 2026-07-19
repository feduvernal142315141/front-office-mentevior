"use client"

import { useEffect, useMemo, useState } from "react"
import type { ModalityCatalogItem } from "@/lib/types/appointment-note.types"
import { getModalityCatalog } from "@/lib/modules/appointment-notes/services/modality-catalog.service"

export function useModalityCatalog() {
  const [items, setItems] = useState<ModalityCatalogItem[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let active = true
    setIsLoading(true)
    getModalityCatalog()
      .then((data) => { if (active) setItems(data) })
      .catch(() => { if (active) setItems([]) })
      .finally(() => { if (active) setIsLoading(false) })
    return () => { active = false }
  }, [])

  const selectOptions = useMemo(
    () => items.map((m) => ({ value: m.id, label: m.name })),
    [items],
  )

  return { items, selectOptions, isLoading }
}
