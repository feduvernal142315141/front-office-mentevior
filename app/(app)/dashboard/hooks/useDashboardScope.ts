"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { DashboardScope } from "@/lib/types/dashboard.types"
import { useAuth } from "@/lib/hooks/use-auth"
import { usePermission } from "@/lib/hooks/use-permission"
import { PermissionModule } from "@/lib/utils/permissions-new"

const STORAGE_KEY = "dashboard:scope"

export interface DashboardScopeState {
  /** `null` mientras se resuelve: nadie debe pedir datos todavía */
  scope: DashboardScope | null
  setScope: (scope: DashboardScope) => void
  /** Si tiene sentido ofrecer el selector para este usuario */
  canSwitch: boolean
}

function readStoredScope(): DashboardScope | null {
  if (typeof window === "undefined") return null
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === "me" || stored === "company" ? stored : null
}

/**
 * Alcance del dashboard: toda la compañía o sólo lo mío.
 *
 * El backend decide de verdad —un rol no administrativo que pida `company`
 * recibe igual sus propios datos— así que esto es una **preferencia**, no un
 * permiso. Por eso el selector sólo se ofrece a quien alcanza el módulo de
 * staff: para el resto las dos opciones devolverían lo mismo y el control sería
 * decorativo.
 *
 * Y por eso mismo quien no puede cambiarlo pide `me` en vez de `company`: es la
 * petición honesta, y evita depender de que el backend degrade bien.
 *
 * **Empieza en `null` a propósito.** El alcance depende de permisos, que salen
 * del store de auth rehidratado, y de la preferencia guardada, que sólo existe
 * en el navegador. Resolverlo antes de eso significaba pedir con un alcance y
 * corregirlo enseguida: dos requests y un parpadeo de datos ajenos.
 */
export function useDashboardScope(): DashboardScopeState {
  const { hydrated } = useAuth()
  const permission = usePermission()

  const canSwitch = useMemo(
    () => permission.view(PermissionModule.USERS_PROVIDERS),
    [permission],
  )

  const [scope, setScopeState] = useState<DashboardScope | null>(null)

  useEffect(() => {
    if (!hydrated) return
    // Se resuelve una sola vez; después manda la elección del usuario.
    setScopeState((current) => current ?? readStoredScope() ?? (canSwitch ? "company" : "me"))
  }, [hydrated, canSwitch])

  // Red de seguridad: si el rol cambia y deja de alcanzar, la preferencia
  // guardada no puede seguir pidiendo el alcance de compañía.
  useEffect(() => {
    if (scope && !canSwitch && scope !== "me") setScopeState("me")
  }, [canSwitch, scope])

  const setScope = useCallback((next: DashboardScope) => {
    setScopeState(next)
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, next)
  }, [])

  return { scope, setScope, canSwitch }
}
