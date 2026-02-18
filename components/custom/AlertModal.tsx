"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogPortal,
  AlertDialogOverlay,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/custom/Button"
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Loader2,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type { AlertState } from "@/lib/types/alert.types"

const ICON_MAP = {
  success: {
    Icon: CheckCircle2,
    iconBg: "bg-[hsl(var(--success)/0.1)]",
    iconBorder: "border-[hsl(var(--success)/0.2)]",
    iconColor: "text-[hsl(var(--success))]",
  },
  error: {
    Icon: XCircle,
    iconBg: "bg-[hsl(var(--destructive)/0.1)]",
    iconBorder: "border-[hsl(var(--destructive)/0.2)]",
    iconColor: "text-[hsl(var(--destructive))]",
  },
  warning: {
    Icon: AlertTriangle,
    iconBg: "bg-[hsl(44_96%_53%/0.14)]",
    iconBorder: "border-[hsl(40_92%_45%/0.28)]",
    iconColor: "text-[hsl(40_92%_42%)]",
  },
  info: {
    Icon: Info,
    iconBg: "bg-[hsl(var(--primary)/0.11)]",
    iconBorder: "border-[hsl(var(--primary)/0.3)]",
    iconColor: "text-[hsl(var(--primary))]",
  },
  confirm: {
    Icon: AlertTriangle,
    iconBg: "bg-[hsl(var(--primary)/0.11)]",
    iconBorder: "border-[hsl(var(--primary)/0.3)]",
    iconColor: "text-[hsl(var(--primary))]",
  },
} as const

interface AlertModalProps {
  alert: AlertState
  onClose: () => void
  onConfirm: () => void
}

export function AlertModal({ alert, onClose, onConfirm }: AlertModalProps) {
  const { Icon, iconBg, iconBorder, iconColor } = ICON_MAP[alert.type]
  const primaryActionVariant = "primary"
  const isError = alert.type === "error"
  const isSuccess = alert.type === "success"

  const initialScale = 0.97
  const animationDuration = isSuccess ? 0.16 : 0.2

  const containerClassName = `
    fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
    w-[calc(100%-2rem)] max-w-[520px]
    rounded-[20px]
    bg-[hsl(var(--card))]
    text-[hsl(var(--card-foreground))]
    border
    ${isError ? "border-[hsl(var(--destructive)/0.15)]" : "border-[hsl(var(--border))]"}
    ${isError
      ? "shadow-[0_34px_92px_-24px_rgba(15,23,42,0.34),0_14px_42px_-18px_rgba(15,23,42,0.2)]"
      : "shadow-[0_30px_84px_-26px_rgba(15,23,42,0.26),0_12px_34px_-18px_rgba(15,23,42,0.14)]"
    }
    ${isSuccess ? "px-8 py-6" : "px-8 py-5"}
    z-[100]
    overflow-hidden
  `

  const titleClassName = isError
    ? "text-[20px] font-bold leading-tight tracking-tight text-[hsl(var(--foreground))]"
    : isSuccess
      ? "text-[20px] font-semibold leading-tight tracking-tight text-[hsl(var(--foreground)/0.92)]"
      : "text-[20px] font-semibold leading-tight tracking-tight text-[hsl(var(--foreground))]"

  const bodyClassName = "mt-1.5 text-[15px] leading-relaxed text-[hsl(var(--muted-foreground))] break-words"

  const primaryButtonClassName = isError
    ? "min-w-[140px] shadow-[0_10px_26px_-14px_hsl(var(--primary)/0.55)]"
    : "min-w-[140px] shadow-[0_8px_20px_-15px_hsl(var(--primary)/0.32)]"

  return (
    <AlertDialog open={alert.isOpen} onOpenChange={onClose}>
      <AlertDialogPortal>
        <AlertDialogOverlay className="z-[90] bg-[hsl(var(--foreground)/0.08)] backdrop-blur-[7px]" />
        <AnimatePresence>
          {alert.isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: initialScale, y: 6 }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{ opacity: 0, scale: initialScale, y: 6 }}
              transition={{ duration: animationDuration, ease: [0.22, 1, 0.36, 1] }}
              className={containerClassName}
              role="alertdialog"
              aria-modal="true"
            >
              <div className={`relative z-10 flex flex-col items-center text-center ${isError ? "gap-3.5" : "gap-4"}`}>
                <div className="flex w-full justify-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.88 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.05, duration: 0.18 }}
                    className={`relative flex h-10 w-10 items-center justify-center rounded-full border ${iconBg} ${iconBorder}`}
                  >
                    {isError && (
                      <span className="pointer-events-none absolute inset-[2px] rounded-full border border-[hsl(var(--destructive)/0.25)]" />
                    )}
                    <Icon className={`h-[18px] w-[18px] ${iconColor}`} strokeWidth={2.3} />
                  </motion.div>
                </div>

                <div className="min-w-0">
                  <AlertDialogTitle className={titleClassName}>
                    {alert.title}
                  </AlertDialogTitle>

                  {alert.description && (
                    <AlertDialogDescription className={bodyClassName}>
                      {alert.description}
                    </AlertDialogDescription>
                  )}
                </div>

                <div className="flex w-full items-center justify-end gap-3">
                  {alert.type === "confirm" ? (
                    <>
                      <AlertDialogCancel asChild>
                        <Button variant="ghost" className="min-w-[120px]">
                          {alert.cancelText ?? "Cancel"}
                        </Button>
                      </AlertDialogCancel>
                      <AlertDialogAction asChild>
                        <Button
                          variant={primaryActionVariant}
                          className={primaryButtonClassName}
                          disabled={alert.isConfirming}
                          onClick={(e) => {
                            e.preventDefault()
                            onConfirm()
                          }}
                        >
                          {alert.isConfirming ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            alert.confirmText ?? "Confirm"
                          )}
                        </Button>
                      </AlertDialogAction>
                    </>
                  ) : (
                    <Button variant={primaryActionVariant} onClick={onClose} className={primaryButtonClassName}>
                      OK
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </AlertDialogPortal>
    </AlertDialog>
  )
}
