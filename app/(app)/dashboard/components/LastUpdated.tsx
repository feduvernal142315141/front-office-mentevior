"use client"

import { useEffect, useState } from "react"
import { Clock3 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LastUpdatedProps {
  /** `generatedAt` del backend, ISO */
  generatedAt?: string
  isRefreshing?: boolean
  className?: string
}

/** El dato se considera viejo pasada media hora */
const STALE_AFTER_MS = 30 * 60 * 1000

function formatRelative(generatedAt: string): { label: string; isStale: boolean } | null {
  const timestamp = Date.parse(generatedAt)
  if (Number.isNaN(timestamp)) return null

  // Un reloj de cliente adelantado da diferencias negativas: se tratan como
  // "recién", no como un futuro imposible. Es la misma lección de `auth.store`.
  const elapsed = Math.max(0, Date.now() - timestamp)
  const minutes = Math.floor(elapsed / 60_000)
  const isStale = elapsed >= STALE_AFTER_MS

  if (minutes < 1) return { label: "Updated just now", isStale }
  if (minutes < 60) return { label: `Updated ${minutes} min ago`, isStale }

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return { label: `Updated ${hours} h ago`, isStale }

  const days = Math.floor(hours / 24)
  return { label: days === 1 ? "Updated yesterday" : `Updated ${days} days ago`, isStale }
}

/**
 * Cuándo se generó lo que estás viendo.
 *
 * Un dashboard sin marca de tiempo obliga a asumir que el dato es de ahora, y
 * esa suposición es exactamente la que rompe la confianza cuando resulta falsa.
 * `generatedAt` viene en el contrato justamente para poder decirlo.
 *
 * Se calcula sólo después de montar: el HTML del servidor no puede conocer la
 * hora del navegador sin provocar un desajuste de hidratación.
 */
export function LastUpdated({ generatedAt, isRefreshing, className }: LastUpdatedProps) {
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    setNow(Date.now())
    const interval = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(interval)
  }, [])

  if (!generatedAt || now === null) return null

  const relative = formatRelative(generatedAt)
  if (!relative) return null

  const absolute = new Date(generatedAt).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  })

  return (
    <span
      title={absolute}
      className={cn(
        "inline-flex items-center gap-1.5 text-xs transition-colors",
        relative.isStale ? "text-amber-600" : "text-slate-400",
        className,
      )}
    >
      <Clock3 className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} aria-hidden />
      {isRefreshing ? "Updating…" : relative.label}
    </span>
  )
}
