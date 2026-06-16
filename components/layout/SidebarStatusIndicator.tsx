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

  if (isCollapsed) {
    return (
      <CollapsedDot isComplete={isComplete} isActive={isActive} />
    )
  }

  return (
    <ExpandedDot
      isComplete={isComplete}
      isActive={isActive}
      variant={variant}
    />
  )
})

function CollapsedDot({ isComplete, isActive }: { isComplete: boolean; isActive: boolean }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={
            isComplete
              ? { scale: 1, opacity: 1 }
              : { scale: 1, opacity: 1 }
          }
          transition={{ type: "spring", bounce: 0.4, duration: 0.5 }}
          className={cn(
            "absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white z-10",
            isActive
              ? isComplete
                ? "bg-white/60"
                : "bg-white shadow-[0_0_6px_rgba(255,255,255,0.6)]"
              : isComplete
                ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]"
                : "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.4)]",
          )}
        />
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={12} className="font-medium text-sm">
        {isComplete ? "Complete" : "Needs attention"}
      </TooltipContent>
    </Tooltip>
  )
}

function ExpandedDot({
  isComplete,
  isActive,
  variant,
}: {
  isComplete: boolean
  isActive: boolean
  variant: "child" | "standalone"
}) {
  const sizeClass = variant === "child" ? "h-1.5 w-1.5" : "h-2 w-2"

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={
            isComplete
              ? { scale: 1, opacity: 1 }
              : { scale: 1, opacity: 1 }
          }
          transition={{ type: "spring", bounce: 0.4, duration: 0.5 }}
          className={cn(
            "shrink-0 rounded-full",
            sizeClass,
            isActive
              ? isComplete
                ? "bg-white/60"
                : "bg-white shadow-[0_0_6px_rgba(255,255,255,0.6)]"
              : isComplete
                ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]"
                : "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.4)]",
          )}
        />
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={12} className="font-medium text-sm">
        {isComplete ? "Complete" : "Needs attention"}
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
  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={
              isComplete
                ? { scale: 1, opacity: 1 }
                : { scale: 1, opacity: 1 }
            }
            transition={{ type: "spring", bounce: 0.4, duration: 0.5 }}
            className={cn(
              "absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white z-10",
              isActive
                ? isComplete
                  ? "bg-white/60"
                  : "bg-white shadow-[0_0_6px_rgba(255,255,255,0.6)]"
                : isComplete
                  ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]"
                  : "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.4)]",
            )}
          />
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={12} className="font-medium text-sm">
          {isComplete
            ? "All sections complete"
            : `${missingCount} of ${totalCount} sections need attention`}
        </TooltipContent>
      </Tooltip>
    )
  }

  if (isComplete) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.4, duration: 0.5 }}
            className={cn(
              "shrink-0 h-2 w-2 rounded-full",
              isActive
                ? "bg-white/60"
                : "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]",
            )}
          />
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={12} className="font-medium text-sm">
          All sections complete
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
          className={cn(
            "shrink-0 h-5 min-w-[20px] px-1.5 rounded-full flex items-center justify-center text-[10px] font-bold leading-none",
            isActive
              ? "bg-white/20 text-white"
              : "bg-amber-50 text-amber-700 border border-amber-200",
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
