"use client"

import { useMemo } from "react"
import type { ExpiringKind } from "@/lib/types/dashboard.types"
import { usePermission } from "@/lib/hooks/use-permission"
import { PermissionModule } from "@/lib/utils/permissions-new"

/**
 * A dónde manda cada KPI al hacer click. `undefined` = el tile no navega, sea
 * porque el rol no puede entrar a esa pantalla —mandarlo a un "sin permiso" es
 * peor que no ofrecer el enlace— o porque el número no tiene un destino honesto.
 */
export interface KpiHrefs {
  sessionsThisWeek?: string
  notesPendingSignature?: string
  clinicalMonthlyThisMonth?: string
}

export interface DashboardLayout {
  showAuthorizationUtilization: boolean
  showDocumentCompliance: boolean
  showTrend: boolean
  /** Fila de KPIs reducida cuando el rol no tiene alcance sobre clientes */
  compactKpis: boolean
  /** Tipos de vencimiento que este rol puede ver */
  allowedExpiringKinds: ExpiringKind[]
  kpiHrefs: KpiHrefs
}

/**
 * Qué widgets se montan según el rol.
 *
 * La práctica de dashboards clínicos es clara: mezclar indicadores clínicos,
 * operativos y financieros en una sola vista genera sobrecarga cognitiva y
 * erosiona la confianza en la herramienta. Por eso la vista se compone.
 *
 * Se deriva de **permisos** y no de nombres de rol: los nombres cambian por
 * compañía, los permisos son el mecanismo real del sistema. Quien no tiene
 * alcance sobre clientes no ve utilización de autorizaciones ni cumplimiento
 * documental de clientes — ni le corresponde, ni es su trabajo.
 *
 * ⚠️ Esto es UX, no seguridad: el scope real por rol lo tiene que aplicar el
 * backend en el propio endpoint.
 */
export function useDashboardLayout(): DashboardLayout {
  const permission = usePermission()

  return useMemo(() => {
    const canSeeClients = permission.view(PermissionModule.CLIENTS)
    const canSeeStaff = permission.view(PermissionModule.USERS_PROVIDERS)

    const allowedExpiringKinds: ExpiringKind[] = []
    if (canSeeClients) {
      allowedExpiringKinds.push("PRIOR_AUTHORIZATION", "CLIENT_DOCUMENT")
    }
    // Credenciales y documentos de RRHH: propios o del equipo, siempre visibles.
    allowedExpiringKinds.push("CREDENTIAL", "HR_DOCUMENT")

    return {
      showAuthorizationUtilization: canSeeClients,
      showDocumentCompliance: canSeeClients || canSeeStaff,
      showTrend: true,
      compactKpis: !canSeeClients,
      allowedExpiringKinds,
      kpiHrefs: {
        sessionsThisWeek: permission.view(PermissionModule.SCHEDULE) ? "/schedules" : undefined,
        notesPendingSignature: permission.view(PermissionModule.SESSION_NOTE) ? "/session-note" : undefined,
        clinicalMonthlyThisMonth: permission.view(PermissionModule.CLINICAL_MONTHLY)
          ? "/clinical-monthly"
          : undefined,
        // `authorizationUsage` queda sin enlace a propósito: es un porcentaje
        // global y no existe una pantalla de autorizaciones — viven dentro de
        // cada cliente. El widget de abajo sí lleva a la autorización concreta.
      },
    }
  }, [permission])
}
