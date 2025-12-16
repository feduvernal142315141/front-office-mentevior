"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/hooks/use-auth"

export function useLogout() {
  const router = useRouter()
  const { logout: authLogout } = useAuth()

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { 
        method: "POST",
        credentials: "include",
      })
    } catch (error) {
      console.error("Logout API error:", error)
    }

    authLogout()

    router.replace("/login")
  }

  return { logout }
}
