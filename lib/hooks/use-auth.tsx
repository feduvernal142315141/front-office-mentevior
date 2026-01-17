
"use client"

import { useAuthStore, selectUser, selectToken, selectIsAuthenticated, selectHydrated } from "@/lib/store/auth.store"
import { useEffect } from "react"

export function useAuth() {
  const user = useAuthStore(selectUser)
  const company = useAuthStore((state) => state.company)
  const token = useAuthStore(selectToken)
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  const hydrated = useAuthStore(selectHydrated)
  
  const login = useAuthStore((state) => state.login)
  const logout = useAuthStore((state) => state.logout)
  const refresh = useAuthStore((state) => state.refresh)

  useEffect(() => {
    if (hydrated && isAuthenticated) {
      useAuthStore.getState().initWorker()
    }
  }, [hydrated, isAuthenticated])

  return {
    user,
    company,
    token,
    refreshToken: useAuthStore((state) => state.refreshToken),
    isAuthenticated,
    hydrated,
    login,
    logout,
    refresh,
  }
}
