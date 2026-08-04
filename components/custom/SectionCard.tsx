import { cn } from "@/lib/utils"

interface SectionCardProps {
  icon?: React.ReactNode
  title: string
  subtitle?: string
  /** Acción al extremo derecho del header: "Ver todos", un filtro, etc. */
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  /** Sin padding interno, para tablas que van pegadas al borde */
  flush?: boolean
}

/**
 * Tarjeta de sección con header e icono.
 *
 * Es el patrón que ya usaban Session Note y Clinical Monthly con su propia copia
 * local; se extrajo acá para que exista una sola definición.
 */
export function SectionCard({
  icon,
  title,
  subtitle,
  action,
  children,
  className,
  flush = false,
}: SectionCardProps) {
  return (
    <div className={cn("rounded-2xl border border-slate-200 bg-white shadow-sm", className)}>
      <div className="flex items-center gap-2.5 px-5 py-3 border-b border-slate-100">
        {icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#037ECC]/10 text-[#037ECC]">
            {icon}
          </div>
        )}
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {subtitle && <span className="truncate text-xs text-slate-400">{subtitle}</span>}
        </div>
        {action && <div className="ml-auto">{action}</div>}
      </div>
      <div className={flush ? "" : "px-5 py-4"}>{children}</div>
    </div>
  )
}
