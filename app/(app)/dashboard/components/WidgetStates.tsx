import { Inbox, PlugZap } from "lucide-react"
import { cn } from "@/lib/utils"

/** Esqueleto de carga. Sin animación de "pulso" agresiva: respira, no parpadea. */
export function WidgetSkeleton({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)} aria-busy>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-3">
          <div className="h-9 w-9 animate-pulse rounded-xl bg-slate-100" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-2/5 animate-pulse rounded-full bg-slate-100" />
            <div className="h-2.5 w-1/4 animate-pulse rounded-full bg-slate-50" />
          </div>
          <div className="h-5 w-16 animate-pulse rounded-full bg-slate-100" />
        </div>
      ))}
    </div>
  )
}

/**
 * Estado vacío. En un dashboard de vencimientos "vacío" es una buena noticia,
 * así que se comunica como logro y no como ausencia de datos.
 */
export function WidgetEmptyState({
  icon,
  title,
  description,
}: {
  icon?: React.ReactNode
  title: string
  description?: string
}) {
  return (
    <div className="py-10 text-center">
      <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-[#0ca30c]">
        {icon ?? <Inbox className="h-5 w-5" />}
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-800">{title}</p>
      {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
    </div>
  )
}

/**
 * La sección todavía no llega desde el backend.
 *
 * Es un estado de primera clase, no un accidente: el contrato entrega por
 * partes, y este widget se apaga solo sin tumbar a los demás.
 */
export function WidgetPendingBackend({ label }: { label: string }) {
  return (
    <div className="py-10 text-center">
      <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
        <PlugZap className="h-5 w-5" />
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-700">{label}</p>
      <p className="mt-1 text-xs text-slate-500">Waiting for this section from the backend.</p>
    </div>
  )
}
