"use client"

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from "react"
import { AlertModal } from "@/components/custom/AlertModal"
import { registerAlertBusHandler } from "@/lib/alerts/alert-bus"
import type {
  AlertState,
  AlertActions,
  ConfirmOptions,
  AlertConfig,
} from "@/lib/types/alert.types"
import { ALERT_DEFAULTS } from "@/lib/types/alert.types"

const INITIAL_STATE: AlertState = {
  isOpen: false,
  isConfirming: false,
  type: "info",
  title: "",
}

const AlertContext = createContext<AlertActions | undefined>(undefined)

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alert, setAlert] = useState<AlertState>(INITIAL_STATE)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const close = useCallback(() => {
    clearTimer()
    setAlert((prev) => ({ ...prev, isOpen: false }))
  }, [clearTimer])

  const open = useCallback(
    (config: AlertConfig) => {
      clearTimer()

      setAlert({
        ...config,
        isOpen: true,
        isConfirming: false,
      })

      const autoClose =
        config.autoCloseDuration ?? ALERT_DEFAULTS[config.type].autoClose

      if (autoClose > 0) {
        timerRef.current = setTimeout(close, autoClose)
      }
    },
    [clearTimer, close]
  )

  const success = useCallback(
    (title: string, description?: string) => {
      open({ type: "success", title, description })
    },
    [open]
  )

  const error = useCallback(
    (title: string, description?: string) => {
      open({ type: "error", title, description, autoCloseDuration: 0 })
    },
    [open]
  )

  const warning = useCallback(
    (title: string, description?: string) => {
      open({ type: "warning", title, description })
    },
    [open]
  )

  const info = useCallback(
    (title: string, description?: string) => {
      open({ type: "info", title, description })
    },
    [open]
  )

  const confirm = useCallback(
    (options: ConfirmOptions) => {
      open({
        type: "confirm",
        title: options.title,
        description: options.description,
        confirmText: options.confirmText,
        cancelText: options.cancelText,
        onConfirm: options.onConfirm,
        onCancel: options.onCancel,
        autoCloseDuration: 0,
      })
    },
    [open]
  )

  const handleConfirm = useCallback(async () => {
    if (!alert.onConfirm) {
      close()
      return
    }

    setAlert((prev) => ({ ...prev, isConfirming: true }))

    try {
      await alert.onConfirm()
    } finally {
      setAlert((prev) => ({ ...prev, isConfirming: false }))
      close()
    }
  }, [alert.onConfirm, close])

  const handleClose = useCallback(() => {
    if (alert.type === "confirm" && alert.onCancel) {
      alert.onCancel()
    }
    close()
  }, [alert.type, alert.onCancel, close])

  const actions: AlertActions = {
    success,
    error,
    warning,
    info,
    confirm,
    close,
    showSuccess: success,
    showError: error,
    showWarning: warning,
    showInfo: info,
    showConfirm: confirm,
  }

  useEffect(() => {
    const unregister = registerAlertBusHandler((config) => {
      open(config)
    })

    return unregister
  }, [open])

  return (
    <AlertContext.Provider value={actions}>
      {children}
      <AlertModal
        alert={alert}
        onClose={handleClose}
        onConfirm={handleConfirm}
      />
    </AlertContext.Provider>
  )
}

export function useAlert(): AlertActions {
  const context = useContext(AlertContext)
  if (!context) {
    throw new Error("useAlert must be used within AlertProvider")
  }
  return context
}
