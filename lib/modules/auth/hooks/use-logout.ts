"use client"

import { useAuth } from "@/lib/hooks/use-auth"
import { useRouter } from "next/navigation"
import { getLoginUrl } from "@/lib/utils/company-identifier"

export function useLogout() {
  const { logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.replace(getLoginUrl())
  }

  return { logout: handleLogout }
}
