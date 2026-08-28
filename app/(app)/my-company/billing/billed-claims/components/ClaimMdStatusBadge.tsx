"use client"

import { TONE_CLASSES, type StatusBadge } from "@/lib/modules/batch-claims/claim-md-status"
import { cn } from "@/lib/utils"

interface ClaimMdStatusBadgeProps {
  badge: StatusBadge | null
  className?: string
}

export function ClaimMdStatusBadge({ badge, className }: ClaimMdStatusBadgeProps) {
  if (!badge) return null

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap",
        TONE_CLASSES[badge.tone],
        className,
      )}
    >
      {badge.label}
    </span>
  )
}
