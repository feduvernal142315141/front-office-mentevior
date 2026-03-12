"use client"

import { Info } from "lucide-react"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface InfoTooltipProps {
  message: string
  side?: "top" | "bottom" | "left" | "right"
  className?: string
  iconClassName?: string
}

export function InfoTooltip({
  message,
  side = "top",
  className,
  iconClassName,
}: InfoTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "text-slate-400 hover:text-[#037ECC] transition-colors focus:outline-none",
            className,
          )}
        >
          <Info className={cn("w-4 h-4", iconClassName)} />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side={side}
        sideOffset={6}
        className="bg-slate-900 text-white max-w-[260px] px-3 py-2 text-xs leading-relaxed rounded-lg shadow-lg"
      >
        {message}
      </TooltipContent>
    </Tooltip>
  )
}
