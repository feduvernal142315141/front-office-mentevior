"use client"

import { memo } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"

interface SidebarStatusIndicatorProps {
  isComplete: boolean
  isActive: boolean
  isCollapsed: boolean
  variant: "parent" | "child" | "standalone"
  missingCount?: number
  totalCount?: number
}

export const SidebarStatusIndicator = memo(function SidebarStatusIndicator({
  isComplete,
  isActive,
  isCollapsed,
  variant,
  missingCount = 0,
  totalCount = 0,
}: SidebarStatusIndicatorProps) {
  if (variant === "parent") {
    return (
      <ParentIndicator
        isComplete={isComplete}
        isActive={isActive}
        isCollapsed={isCollapsed}
        missingCount={missingCount}
        totalCount={totalCount}
      />
    )
  }

  if (isComplete) return null

  if (isCollapsed) {
    return <CollapsedDot isActive={isActive} />
  }

  return <ExpandedDot isActive={isActive} variant={variant} />
})

function CollapsedDot({ isActive }: { isActive: boolean }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.4, duration: 0.5 }}
          className={cn(
            "absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white z-10",
            isActive
              ? "bg-white shadow-[0_0_6px_rgba(255,255,255,0.6)]"
              : "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.4)]",
          )}
        />
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={12} className="font-medium text-sm">
        Needs attention
      </TooltipContent>
    </Tooltip>
  )
}

function ExpandedDot({
  isActive,
  variant,
}: {
  isActive: boolean
  variant: "child" | "standalone"
}) {
  const sizeClass = variant === "child" ? "h-1.5 w-1.5" : "h-2 w-2"

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.4, duration: 0.5 }}
          className={cn(
            "shrink-0 rounded-full",
            sizeClass,
            isActive
              ? "bg-white shadow-[0_0_6px_rgba(255,255,255,0.6)]"
              : "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.4)]",
          )}
        />
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={12} className="font-medium text-sm">
        Needs attention
      </TooltipContent>
    </Tooltip>
  )
}

function ParentIndicator({
  isComplete,
  isActive,
  isCollapsed,
  missingCount,
  totalCount,
}: {
  isComplete: boolean
  isActive: boolean
  isCollapsed: boolean
  missingCount: number
  totalCount: number
}) {
  if (isComplete) return null

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <sup
            className={cn(
              "absolute -top-1 -right-2 text-[9px] font-bold leading-none z-10",
              isActive ? "text-white" : "text-amber-600",
            )}
          >
            {missingCount}
          </sup>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={12} className="font-medium text-sm">
          {`${missingCount} of ${totalCount} sections need attention`}
        </TooltipContent>
      </Tooltip>
    )
  }

  return null
}

export function ParentMissingCountSup({
  missingCount,
  totalCount,
  isActive,
}: {
  missingCount: number
  totalCount: number
  isActive: boolean
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [1, 1.25, 1],
            opacity: 1,
          }}
          transition={{
            opacity: { duration: 0.2 },
            scale: {
              duration: 1.4,
              repeat: Infinity,
              repeatDelay: 0.6,
              ease: "easeInOut",
            },
          }}
          className={cn(
            "absolute -top-2 -right-2 h-[18px] min-w-[18px] px-1 rounded-full flex items-center justify-center text-[10px] font-bold leading-none ring-2 ring-white z-20",
            isActive
              ? "bg-white text-[#037ECC]"
              : "bg-amber-500 text-white shadow-[0_0_10px_rgba(245,158,11,0.7)]",
          )}
        >
          {missingCount}
        </motion.span>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={12} className="font-medium text-sm">
        {`${missingCount} of ${totalCount} sections need attention`}
      </TooltipContent>
    </Tooltip>
  )
}
