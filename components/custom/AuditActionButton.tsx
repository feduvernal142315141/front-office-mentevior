"use client"

import type { MouseEvent } from "react"
import { Eye } from "lucide-react"
import { cn } from "@/lib/utils"

interface AuditActionButtonProps {
  label: string
  onClick: (event: MouseEvent<HTMLButtonElement>) => void
}

export function AuditActionButton({ label, onClick }: AuditActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group/audit relative h-9 w-9",
        "flex items-center justify-center rounded-xl",
        "bg-gradient-to-b from-blue-50 to-blue-100/80",
        "border border-blue-200/60 shadow-sm shadow-blue-900/5",
        "hover:from-blue-100 hover:to-blue-200/90",
        "hover:border-blue-300/80 hover:shadow-md hover:shadow-blue-900/10",
        "hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm",
        "transition-all duration-200 ease-out",
        "focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-2",
      )}
      title="View audit"
      aria-label={label}
    >
      <Eye className="h-4 w-4 text-blue-600 transition-colors duration-200 group-hover/audit:text-blue-700" />
    </button>
  )
}
