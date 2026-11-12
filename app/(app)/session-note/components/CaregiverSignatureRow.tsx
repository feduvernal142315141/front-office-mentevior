"use client"

import { useEffect, useRef, type ReactNode } from "react"
import { cn } from "@/lib/utils"

interface CaregiverSignatureRowProps {
  children: ReactNode
  highlightRequest: number
  hasSignature: boolean
}

export function CaregiverSignatureRow({ children, highlightRequest, hasSignature }: CaregiverSignatureRowProps) {
  const rowRef = useRef<HTMLDivElement>(null)
  const showError = highlightRequest > 0 && !hasSignature

  useEffect(() => {
    if (!highlightRequest) return

    const frame = window.requestAnimationFrame(() => {
      const row = rowRef.current
      if (!row) return

      row.focus({ preventScroll: true })
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      row.scrollIntoView({ behavior: reduceMotion ? "instant" : "smooth", block: "center" })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [highlightRequest])

  return (
    <div
      ref={rowRef}
      role="group"
      aria-label="Caregiver signature"
      aria-invalid={showError || undefined}
      tabIndex={-1}
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 border-b border-[#037ECC]/10",
        showError && "bg-red-50 ring-2 ring-inset ring-red-500",
      )}
    >
      {children}
    </div>
  )
}
