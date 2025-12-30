"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { Fragment } from "react"

// Helper function to detect if a segment is a UUID or ID
function isUUID(segment: string): boolean {
  // Match UUID pattern: 8-4-4-4-12 hexadecimal characters
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(segment)
}

export function Breadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  // Filter out UUID/ID segments first
  const filteredSegments = segments.filter(segment => !isUUID(segment))

  // Build breadcrumbs from filtered segments
  const breadcrumbs = filteredSegments.map((segment, index) => {
    const href = "/" + filteredSegments.slice(0, index + 1).join("/")
    const label = segment.charAt(0).toUpperCase() + segment.slice(1)
    const isLast = index === filteredSegments.length - 1

    return {
      href,
      label,
      isLast,
    }
  })

  // Solo mostrar breadcrumbs si hay más de un segmento visible después de filtrar
  // Ejemplo: /users/create → ["Users", "Create"] ✅ (2 visible)
  // Ejemplo: /users → ["Users"] ❌ (1 visible)
  // Ejemplo: /users/uuid/edit → ["Users", "Edit"] ✅ (2 visible, href correcto: /users y /users/edit)
  if (breadcrumbs.length <= 1) return null

  return (
    <nav className="flex items-center gap-2 text-sm text-gray-500">
      {breadcrumbs.map((crumb, index) => (
        <Fragment key={crumb.href}>
          {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-gray-400" />}
          {crumb.isLast ? (
            <span className="text-gray-900 font-medium">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="hover:text-gray-900 transition-colors">
              {crumb.label}
            </Link>
          )}
        </Fragment>
      ))}
    </nav>
  )
}
