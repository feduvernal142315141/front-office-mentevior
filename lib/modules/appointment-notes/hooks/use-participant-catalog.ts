"use client"

import { useEffect, useState } from "react"
import type { ParticipantCatalogItem } from "@/lib/types/appointment-note.types"
import { getParticipantCatalog } from "@/lib/modules/appointment-notes/services/participant-catalog.service"

export function useParticipantCatalog() {
  const [items, setItems] = useState<ParticipantCatalogItem[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let active = true
    setIsLoading(true)
    getParticipantCatalog()
      .then((data) => { if (active) setItems(data) })
      .catch(() => { if (active) setItems([]) })
      .finally(() => { if (active) setIsLoading(false) })
    return () => { active = false }
  }, [])

  return { items, isLoading }
}
