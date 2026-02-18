import { emitAlert } from "@/lib/alerts/alert-bus"

type SonnerType = "success" | "error" | "warning" | "info"

interface SonnerOptions {
  description?: string
}

function normalizeNonErrorDescription(description?: string) {
  if (!description) {
    return undefined
  }

  const normalized = description.toLowerCase()

  if (normalized.includes("has been updated") || normalized.includes("has been created")) {
    return undefined
  }

  return description
}

function notify(type: SonnerType, title: string, options?: SonnerOptions) {
  emitAlert({
    type,
    title,
    description:
      type === "error"
        ? options?.description
        : normalizeNonErrorDescription(options?.description),
  })
}

function baseToast(message: string) {
  notify("info", message)
}

baseToast.success = (title: string, options?: SonnerOptions) => {
  notify("success", title, options)
}

baseToast.error = (title: string, options?: SonnerOptions) => {
  notify("error", title, options)
}

baseToast.warning = (title: string, options?: SonnerOptions) => {
  notify("warning", title, options)
}

baseToast.info = (title: string, options?: SonnerOptions) => {
  notify("info", title, options)
}

export const toast = baseToast
