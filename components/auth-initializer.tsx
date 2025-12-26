"use client"

/**
 * AUTH INITIALIZER
 * Componente que inicializa el auth store en el cliente
 * Debe montarse en el layout principal
 */

import { useEffect } from "react"
import { useAuthStore } from "@/lib/store/auth.store"

export function AuthInitializer() {
  useEffect(() => {
    // El store ya se hidrata automáticamente con el middleware persist
    // Este componente solo asegura que se monte en el cliente
    const state = useAuthStore.getState()
    
    if (state.hydrated && state.isAuthenticated) {
      // Iniciar worker si hay sesión
      state.initWorker()
    }
  }, [])

  return null
}
