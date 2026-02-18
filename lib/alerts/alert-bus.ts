import type { AlertConfig } from "@/lib/types/alert.types"

type AlertBusHandler = (config: AlertConfig) => void

let handler: AlertBusHandler | null = null

export function registerAlertBusHandler(nextHandler: AlertBusHandler) {
  handler = nextHandler

  return () => {
    if (handler === nextHandler) {
      handler = null
    }
  }
}

export function emitAlert(config: AlertConfig) {
  if (!handler) {
    return
  }

  handler(config)
}
