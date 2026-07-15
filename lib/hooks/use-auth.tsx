
"use client"

import { useAuthStore, selectUser, selectToken, selectIsAuthenticated, selectHydrated, selectRequiredOptions } from "@/lib/store/auth.store"

export function useAuth() {
  const user = useAuthStore(selectUser)
  const company = useAuthStore((state) => state.company)
  const token = useAuthStore(selectToken)
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  const hydrated = useAuthStore(selectHydrated)
  const requiredOptions = useAuthStore(selectRequiredOptions)

  const login = useAuthStore((state) => state.login)
  const logout = useAuthStore((state) => state.logout)
  const refresh = useAuthStore((state) => state.refresh)

  return {
    user,
    company,
    token,
    refreshToken: useAuthStore((state) => state.refreshToken),
    isAuthenticated,
    hydrated,
    requiredOptions,
    login,
    logout,
    refresh,
  }
}
