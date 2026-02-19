"use client"

import { emitAlert } from "@/lib/alerts/alert-bus"

type ToastVariant = "default" | "destructive"

interface ToastPayload {
  title: string
  description?: string
  variant?: ToastVariant
}

interface ToastHelpers {
  toast: (payload: ToastPayload) => void
}

export function useToast(): ToastHelpers {
  const toast = ({ title, description, variant = "default" }: ToastPayload) => {
    emitAlert({
      type: variant === "destructive" ? "error" : "info",
      title,
      description,
    })
  }

  return { toast }
}
