/**
 * USE AUTH - ZUSTAND VERSION
 * Hook simplificado que reemplaza el Context API
 * 
 * Este hook es un wrapper sobre el store de Zustand
 * para mantener la misma API que usaban los componentes
 */

"use client"

import { useAuthStore, selectUser, selectToken, selectIsAuthenticated, selectHydrated } from "@/lib/store/auth.store"
import { useEffect } from "react"

export function useAuth() {
  const user = useAuthStore(selectUser)
  const token = useAuthStore(selectToken)
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  const hydrated = useAuthStore(selectHydrated)
  
  const login = useAuthStore((state) => state.login)
  const logout = useAuthStore((state) => state.logout)
  const refresh = useAuthStore((state) => state.refresh)

  // Auto-iniciar worker después de hidratar
  useEffect(() => {
    if (hydrated && isAuthenticated) {
      useAuthStore.getState().initWorker()
    }
  }, [hydrated, isAuthenticated])

  return {
    user,
    token,
    refreshToken: useAuthStore((state) => state.refreshToken),
    isAuthenticated,
    hydrated,
    login,
    logout,
    refresh,
  }
}
