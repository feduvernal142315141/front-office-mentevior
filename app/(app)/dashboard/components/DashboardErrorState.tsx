"use client"

import { Building2, CloudOff, LockKeyhole, ServerCrash } from "lucide-react"
import type { DashboardError, DashboardErrorKind } from "@/lib/modules/dashboard/services/dashboard-error"
import { Button } from "@/components/custom/Button"

interface DashboardErrorStateProps {
  error: DashboardError
  onRetry: () => void
}

const ICON_BY_KIND: Record<DashboardErrorKind, React.ElementType> = {
  forbidden: Building2,
  unauthorized: LockKeyhole,
  offline: CloudOff,
  server: ServerCrash,
  "bad-request": ServerCrash,
  unknown: ServerCrash,
}

/**
 * El error, con su causa real.
 *
 * "Algo salió mal" no le sirve a nadie: el contrato distingue *no tenés sesión*,
 * *tu usuario no está asociado a una compañía* y *el servidor falló*, y cada uno
 * exige algo distinto del usuario. Por eso el botón de reintentar sólo aparece
 * cuando reintentar puede funcionar — ofrecerlo ante un 403 es invitar a repetir
 * un fallo garantizado.
 */
export function DashboardErrorState({ error, onRetry }: DashboardErrorStateProps) {
  const Icon = ICON_BY_KIND[error.kind]
  const isBlocking = error.kind === "forbidden" || error.kind === "unauthorized"

  return (
    <div
      role="alert"
      className={
        isBlocking
          ? "rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center shadow-sm"
          : "rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center"
      }
    >
      <div
        className={
          isBlocking
            ? "inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500"
            : "inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-[#d03b3b]"
        }
      >
        <Icon className="h-6 w-6" aria-hidden />
      </div>

      <p className={isBlocking ? "mt-4 text-base font-semibold text-slate-900" : "mt-4 text-base font-semibold text-red-700"}>
        {error.title}
      </p>
      <p className={isBlocking ? "mx-auto mt-1.5 max-w-md text-sm text-slate-500" : "mx-auto mt-1.5 max-w-md text-sm text-red-500"}>
        {error.message}
      </p>

      {error.canRetry && (
        <Button variant="secondary" onClick={onRetry} className="mt-5">
          Try again
        </Button>
      )}

      {/* El volcado del servidor, plegado. No es para quien abre el dashboard,
          pero tenerlo a mano evita el ida y vuelta de "mandame la captura". */}
      {error.technicalDetail && (
        <details className="mx-auto mt-5 max-w-xl text-left">
          <summary className="cursor-pointer list-none text-center text-xs font-medium text-slate-400 underline underline-offset-2 hover:text-slate-600">
            Technical details
          </summary>
          <pre className="mt-2 max-h-40 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-600">
            {error.status ? `HTTP ${error.status} — ` : ""}
            {error.technicalDetail}
          </pre>
        </details>
      )}
    </div>
  )
}
