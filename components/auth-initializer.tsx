"use client"

/**
 * AUTH INITIALIZER
 * Componente que inicializa el auth store en el cliente.
 * El worker se inicializa en onRehydrateStorage del store,
 * este componente solo asegura que el store se monte en el cliente.
 */

import { useEffect } from "react"
import { useAuthStore } from "@/lib/store/auth.store"

export function AuthInitializer() {
  useEffect(() => {
    // El store se hidrata automáticamente con el middleware persist.
    // onRehydrateStorage ya inicializa el worker si hay sesión válida.
    useAuthStore.getState()
  }, [])

  return null
}
