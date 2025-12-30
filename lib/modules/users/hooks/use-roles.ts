
"use client"

import { useState, useEffect } from "react"
import { getRoles } from "../services/users.service.mock"
import type { Role } from "@/lib/types/role.types"

export function useRoles() {
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRoles = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const data = await getRoles()
        setRoles(data)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load roles"
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRoles()
  }, [])

  return {
    roles,
    isLoading,
    error,
  }
}
