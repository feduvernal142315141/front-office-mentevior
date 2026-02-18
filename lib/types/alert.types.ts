export type AlertType = "success" | "error" | "warning" | "info" | "confirm"

export interface AlertConfig {
  type: AlertType
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void
  autoCloseDuration?: number
}

export interface AlertState extends AlertConfig {
  isOpen: boolean
  isConfirming: boolean
}

export interface AlertActions {
  success: (title: string, description?: string) => void
  error: (title: string, description?: string) => void
  warning: (title: string, description?: string) => void
  info: (title: string, description?: string) => void
  confirm: (options: ConfirmOptions) => void
  close: () => void
  showSuccess: (title: string, description?: string) => void
  showError: (title: string, description?: string) => void
  showWarning: (title: string, description?: string) => void
  showInfo: (title: string, description?: string) => void
  showConfirm: (options: ConfirmOptions) => void
}

export interface ConfirmOptions {
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void | Promise<void>
  onCancel?: () => void
}

export const ALERT_DEFAULTS: Record<AlertType, { title: string; autoClose: number }> = {
  success: { title: "Success", autoClose: 3000 },
  error: { title: "Error", autoClose: 0 },
  warning: { title: "Warning", autoClose: 5000 },
  info: { title: "Information", autoClose: 4000 },
  confirm: { title: "Confirm Action", autoClose: 0 },
}
