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
  allowSelectOverflow?: boolean
  constrainHeight?: boolean
  showCloseButton?: boolean
  hideHeader?: boolean
  onOpenAutoFocus?: (e: Event) => void
  onInteractOutside?: (e: Event) => void
  onPointerDownOutside?: (e: Event) => void
  onEscapeKeyDown?: (e: KeyboardEvent) => void
}

export function CustomModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  maxWidthClassName = "sm:max-w-[860px]",
  contentClassName,
  allowSelectOverflow = false,
  constrainHeight = false,
  showCloseButton = true,
  hideHeader = false,
  onOpenAutoFocus,
  onInteractOutside,
  onPointerDownOutside,
  onEscapeKeyDown,
}: CustomModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={showCloseButton}
        onOpenAutoFocus={onOpenAutoFocus}
        onInteractOutside={(e) => {
          const target = e.target as HTMLElement | null
          if (target?.closest?.("[data-portal-dropdown]")) {
            e.preventDefault()
            return
          }
          onInteractOutside?.(e)
        }}
        onPointerDownOutside={(e) => {
          const target = e.target as HTMLElement | null
          if (target?.closest?.("[data-portal-dropdown]")) {
            e.preventDefault()
            return
          }
          onPointerDownOutside?.(e)
        }}
        onEscapeKeyDown={onEscapeKeyDown}
        className={cn(
          "p-0 gap-0 rounded-2xl shadow-[0_30px_80px_rgba(2,12,27,0.28)] overflow-hidden bg-transparent",
          constrainHeight && "max-h-[85vh] flex flex-col",
          maxWidthClassName,
          contentClassName
        )}
      >
        <div className={cn(
          "w-full rounded-2xl border border-slate-200/80 bg-white/98 backdrop-blur-xl",
          constrainHeight
            ? "flex max-h-[85vh] flex-col overflow-hidden"
            : allowSelectOverflow
              ? "overflow-visible"
              : "overflow-hidden",
        )}>
          {hideHeader && (
            <DialogHeader className="sr-only">
              <DialogTitle>{title || "Dialog"}</DialogTitle>
              {description && <DialogDescription>{description}</DialogDescription>}
            </DialogHeader>
          )}
          {!hideHeader && (
            <DialogHeader className="shrink-0 px-6 py-5 border-b border-slate-200/80 bg-gradient-to-b from-white via-slate-50/70 to-white rounded-t-2xl">
              <DialogTitle className="text-xl font-semibold text-gray-900">{title}</DialogTitle>
              {description && <DialogDescription className="text-sm text-gray-600">{description}</DialogDescription>}
            </DialogHeader>
          )}
          <div
            className={cn(
              "bg-gradient-to-b from-white to-slate-50/40 rounded-b-2xl",
              constrainHeight && "flex min-h-0 flex-1 flex-col overflow-hidden",
            )}
          >
            {children}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
