"use client"

import { useAuth } from "@/lib/hooks/use-auth"
import { clearCompanyIdentifier, getLoginUrl } from "@/lib/utils/company-identifier"

export function useLogout() {
  const { logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    clearCompanyIdentifier()

    // Navegación dura, no `router.replace`: el Router Cache de Next puede servir
    // el árbol de `(app)` ya renderizado y dejar la UI de la sesión anterior
    // accesible con el botón Atrás.
    window.location.replace(getLoginUrl())
  }

  return { logout: handleLogout }
}
