"use client"

import { useEffect, useState } from "react"
import type { MemberUserTypeCatalogItem } from "@/lib/types/user.types"
import { getMemberUserTypeCatalog } from "../services/member-user-type-catalog.service"

interface UseMemberUserTypeCatalogReturn {
  memberUserTypes: MemberUserTypeCatalogItem[]
  isLoading: boolean
  error: Error | null
}

export function useMemberUserTypeCatalog(): UseMemberUserTypeCatalogReturn {
  const [memberUserTypes, setMemberUserTypes] = useState<MemberUserTypeCatalogItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await getMemberUserTypeCatalog()
        if (active) setMemberUserTypes(data)
      } catch (e) {
        if (active) {
          setError(e instanceof Error ? e : new Error("Failed to load member user types"))
          setMemberUserTypes([])
        }
      } finally {
        if (active) setIsLoading(false)
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [])

  return { memberUserTypes, isLoading, error }
}
