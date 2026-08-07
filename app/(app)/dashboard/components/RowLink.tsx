import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface RowLinkProps {
  /** Ya validado como ruta interna por el normalizador; sin él la fila es inerte */
  href?: string
  className?: string
  children: React.ReactNode
}

/**
 * Fila del dashboard que lleva a donde se resuelve el pendiente.
 *
 * Es un `<a>` de verdad y no un `div` con `onClick`. Sobre una lista que se
 * despacha de a uno, cmd/ctrl+click y "abrir en pestaña nueva" SON el flujo:
 * `router.push` los mata a los dos, no muestra la URL en la barra de estado, y
 * encima se anuncia como *botón* cuando lo que hace es navegar.
 *
 * Sin `href` degrada a un contenedor inerte —sin cursor, sin hover, sin foco—
 * en vez de simular un enlace que no lleva a ningún lado.
 */
export function RowLink({ href, className, children }: RowLinkProps) {
  if (!href) return <div className={className}>{children}</div>

  return (
    <Link
      href={href}
      // `group/row` con nombre: estas filas se anidan dentro de tarjetas que ya
      // usan `group` sin nombrar, y el chevron no debe reaccionar a ésas.
      className={cn(
        "group/row cursor-pointer",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#037ECC]/40",
        className,
      )}
    >
      {children}
    </Link>
  )
}

/**
 * La punta que dice "esto abre otra pantalla".
 *
 * El hover de fondo por sí solo no es afordancia: aparece cuando el puntero ya
 * está encima, o sea después de que el usuario decidió apuntar. El chevron se ve
 * siempre, en gris recesivo, y sólo se colorea al pasar por encima.
 */
export function RowChevron({ className }: { className?: string }) {
  return (
    <ChevronRight
      className={cn(
        "h-4 w-4 shrink-0 text-slate-300 transition-all duration-200",
        "group-hover/row:translate-x-0.5 group-hover/row:text-[#037ECC]",
        className,
      )}
      aria-hidden
    />
  )
}
