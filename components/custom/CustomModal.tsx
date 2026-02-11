"use client"

import type { ReactNode } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface CustomModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  maxWidthClassName?: string
  contentClassName?: string
}

export function CustomModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  maxWidthClassName = "sm:max-w-[860px]",
  contentClassName,
}: CustomModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "p-0 gap-0 rounded-2xl overflow-hidden border border-slate-200/80 shadow-[0_30px_80px_rgba(2,12,27,0.28)]",
          "bg-white/98 backdrop-blur-xl",
          maxWidthClassName,
          contentClassName
        )}
      >
        <DialogHeader className="px-6 py-5 border-b border-slate-200/80 bg-gradient-to-b from-white via-slate-50/70 to-white">
          <DialogTitle className="text-xl font-semibold text-gray-900">{title}</DialogTitle>
          {description && <DialogDescription className="text-sm text-gray-600">{description}</DialogDescription>}
        </DialogHeader>
        <div className="bg-gradient-to-b from-white to-slate-50/40">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  )
}
