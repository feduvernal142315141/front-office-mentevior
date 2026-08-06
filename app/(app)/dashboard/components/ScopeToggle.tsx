"use client"

import { Building2, User } from "lucide-react"
import type { DashboardScope } from "@/lib/types/dashboard.types"
import { cn } from "@/lib/utils"

interface ScopeToggleProps {
  scope: DashboardScope
  onChange: (scope: DashboardScope) => void
  disabled?: boolean
}

const OPTIONS: { value: DashboardScope; label: string; icon: React.ElementType }[] = [
  { value: "company", label: "Company", icon: Building2 },
  { value: "me", label: "Just me", icon: User },
]

/**
 * Selector de alcance.
 *
 * Control segmentado y no un `select`: son dos opciones excluyentes que definen
 * de qué habla toda la pantalla, así que ambas tienen que estar a la vista —un
 * desplegable escondería que existe la otra mitad del dashboard.
 *
 * La píldora se desliza en vez de aparecer: el movimiento explica que es el
 * mismo dashboard cambiando de lente, no una vista nueva.
 */
export function ScopeToggle({ scope, onChange, disabled }: ScopeToggleProps) {
  const activeIndex = OPTIONS.findIndex((option) => option.value === scope)

  return (
    <div
      role="radiogroup"
      aria-label="Dashboard scope"
      className={cn(
        "relative inline-flex rounded-full border border-slate-200 bg-slate-50 p-0.5",
        disabled && "pointer-events-none opacity-60",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded-full bg-white shadow-sm",
          "ring-1 ring-[#037ECC]/15 transition-transform duration-300 ease-out",
        )}
        style={{ transform: `translateX(${activeIndex * 100}%)` }}
      />

      {OPTIONS.map((option) => {
        const Icon = option.icon
        const active = option.value === scope

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative z-10 inline-flex min-w-[104px] items-center justify-center gap-1.5 rounded-full",
              "px-3.5 py-1.5 text-xs font-semibold transition-colors duration-200",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#037ECC]/30 focus-visible:ring-offset-1",
              active ? "text-[#037ECC]" : "text-slate-500 hover:text-slate-700",
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
