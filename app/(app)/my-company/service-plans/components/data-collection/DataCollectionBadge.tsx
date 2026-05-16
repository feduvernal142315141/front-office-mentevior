"use client"

import { cn } from "@/lib/utils"

interface DataCollectionBadgeProps {
  hasConfig: boolean
  isCustomOverride?: boolean
}

export function DataCollectionBadge({
  hasConfig,
  isCustomOverride = false,
}: DataCollectionBadgeProps) {
  if (!hasConfig) return null

  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide leading-none",
        isCustomOverride
          ? "bg-amber-100 text-amber-700"
          : "bg-blue-100 text-blue-700"
      )}
    >
      {isCustomOverride ? "DC Custom" : "DC"}
    </span>
  )
}
