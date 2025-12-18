"use client"

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
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
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

type AlertType = "confirm" | "success" | "error"

interface AlertState {
  type: AlertType
  title: string
  description?: React.ReactNode
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void
}

interface AlertContextType {
  showConfirm: (options: Omit<AlertState, "type">) => void
  showSuccess: (title: string, description?: string) => void
  showError: (title: string, description?: string) => void
  close: () => void
}

const AlertContext = createContext<AlertContextType | undefined>(undefined)

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alert, setAlert] = useState<AlertState | null>(null)

  const close = () => setAlert(null)

  const showConfirm = (options: Omit<AlertState, "type">) => {
    setAlert({ ...options, type: "confirm" })
    setTimeout(close, 15000)
  }

  const showSuccess = (title: string, description?: string) => {
    setAlert({ type: "success", title, description })
    setTimeout(close, 5000)
  }

  const showError = (title: string, description?: string) => {
    setAlert({ type: "error", title, description })
    setTimeout(close, 5000)
  }

  return (
    <AlertContext.Provider
      value={{ showConfirm, showSuccess, showError, close }}
    >
      {children}

      <AlertDialog open={!!alert} onOpenChange={close}>
        <AlertDialogPortal>
          <AlertDialogOverlay className="z-[90]" />
          <AnimatePresence>
            {alert && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 10 }}
                transition={{
                  duration: 0.22,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="
                  fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]
                  max-w-[360px] w-full
                  rounded-[22px]
                  bg-white dark:bg-gray-900
                  border border-gray-200 dark:border-gray-800
                  shadow-[0_18px_36px_-14px_rgba(2,6,23,0.18)]
                  px-6 py-5
                  space-y-4
                  z-[100]
                "
                role="alertdialog"
                aria-modal="true"
              >
                {/* ICON */}
                <div className="flex justify-center">
                  {alert.type === "success" && (
                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                  )}

                  {alert.type === "error" && (
                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                      <XCircle className="w-5 h-5 text-red-600" />
                    </div>
                  )}

                  {alert.type === "confirm" && (
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-blue-600" />
                    </div>
                  )}
                </div>

                {/* TITLE */}
                <AlertDialogTitle className="text-center text-base font-semibold text-gray-900 dark:text-white">
                  {alert.title}
                </AlertDialogTitle>

                {/* DESCRIPTION */}
                {alert.description && (
                  <AlertDialogDescription className="text-center text-[13px] text-gray-600 dark:text-gray-400">
                    {alert.description}
                  </AlertDialogDescription>
                )}

                {/* ACTIONS */}
                <div className="flex justify-center gap-3 pt-1">
                  {alert.type === "confirm" ? (
                    <>
                      <AlertDialogCancel asChild>
                        <Button variant="secondary">
                          {alert.cancelText ?? "Cancel"}
                        </Button>
                      </AlertDialogCancel>

                      <AlertDialogAction asChild>
                        <Button
                          variant="primary"
                          onClick={() => {
                            alert.onConfirm?.()
                            close()
                          }}
                        >
                          {alert.confirmText ?? "Confirm"}
                        </Button>
                      </AlertDialogAction>
                    </>
                  ) : (
                    <Button variant="primary" onClick={close}>
                      OK
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </AlertDialogPortal>
      </AlertDialog>
    </AlertContext.Provider>
  )
}

export function useAlert() {
  const context = useContext(AlertContext)
  if (!context) {
    throw new Error("useAlert must be used within AlertProvider")
  }
  return context
}
