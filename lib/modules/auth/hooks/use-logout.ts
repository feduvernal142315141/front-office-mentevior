"use client"

import { useAuth } from "@/lib/hooks/use-auth"

export function useLogout() {
  const { logout } = useAuth()

  return { logout }
}
