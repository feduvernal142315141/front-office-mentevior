"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import { useAlert } from "@/lib/contexts/alert-context"
import { getLoginUrl } from "@/lib/utils/company-identifier"

interface InterceptorContextType {
  isLoading: boolean
  activeRequests: number
  setLoading: (loading: boolean) => void

  showNotification: (message: string, type: "success" | "error" | "warning" | "info") => void
  showAlert: (title: string, description: string, type?: "error" | "warning" | "info") => void
  closeAlert: () => void

  handleHttpError: (statusCode: number, message?: string) => void
  handleUnauthorized: () => void

  onActivity?: () => void
  setOnActivity: (callback: () => void) => void
}

const InterceptorContext = createContext<InterceptorContextType | undefined>(undefined)

export function InterceptorProvider({ children }: { children: ReactNode }) {
  const alert = useAlert()

  const [isLoading, setIsLoading] = useState(false)
  const [activeRequests, setActiveRequests] = useState(0)
  const [onActivity, setOnActivity] = useState<(() => void) | undefined>(undefined)

  const setLoading = (loading: boolean) => {
    setActiveRequests((prev) => {
      const newCount = loading ? prev + 1 : Math.max(0, prev - 1)
      setIsLoading(newCount > 0)
      return newCount
    })
  }

  const showNotification = (message: string, type: "success" | "error" | "warning" | "info") => {
    alert[type](
      type.charAt(0).toUpperCase() + type.slice(1),
      message
    )
  }

  const showAlert = (
    title: string,
    description: string,
    type: "error" | "warning" | "info" = "info"
  ) => {
    alert[type](title, description)
  }

  const closeAlert = () => {
    alert.close()
  }

  const handleHttpError = (statusCode: number, message?: string) => {
    switch (statusCode) {
      case 400:
        alert.error("Invalid Request", message || "The request contains invalid data")
        break
      case 401:
        handleUnauthorized()
        break
      case 403:
        alert.error(
          "Access Denied",
          message || "You do not have the necessary permissions to perform this action. Contact the administrator if you believe this is an error."
        )
        break
      case 404:
        alert.warning("Not Found", message || "The requested resource does not exist")
        break
      case 422:
        alert.error("Validation Error", message || "The provided data is not valid")
        break
      case 500:
        alert.error(
          "Server Error",
          message || "A server error occurred. Please try again later."
        )
        break
      case 502:
        alert.error(
          "Service Unavailable",
          "The server is not responding. Please try again in a few moments."
        )
        break
      case 503:
        alert.warning(
          "Service Under Maintenance",
          "The service is temporarily offline. Please try again later."
        )
        break
      default:
        alert.error("Error", message || "An unexpected error occurred")
    }
  }

  const handleUnauthorized = () => {
    alert.warning(
      "Session Expired",
      "Your session has expired. You will be redirected to the login page."
    )

    if (typeof window !== "undefined") {
      setTimeout(async () => {
        const { useAuthStore } = await import("@/lib/store/auth.store")
        useAuthStore.getState().logout()
        window.location.href = getLoginUrl()
      }, 3000)
    }
  }

  const value: InterceptorContextType = {
    isLoading,
    activeRequests,
    setLoading,
    showNotification,
    showAlert,
    closeAlert,
    handleHttpError,
    handleUnauthorized,
    onActivity,
    setOnActivity,
  }

  return (
    <InterceptorContext.Provider value={value}>
      {children}
    </InterceptorContext.Provider>
  )
}

export function useInterceptor(): InterceptorContextType {
  const context = useContext(InterceptorContext)
  if (!context) {
    throw new Error("useInterceptor must be used within an InterceptorProvider")
  }
  return context
}

export function useGlobalLoading() {
  const { isLoading, activeRequests } = useInterceptor()
  return { isLoading, activeRequests }
}

export function useNotifications() {
  const { showNotification } = useInterceptor()
  return {
    showNotification,
    showSuccess: (message: string) => showNotification(message, "success"),
    showError: (message: string) => showNotification(message, "error"),
    showWarning: (message: string) => showNotification(message, "warning"),
    showInfo: (message: string) => showNotification(message, "info"),
  }
}

export function useAlerts() {
  const { showAlert, closeAlert } = useInterceptor()
  return {
    showAlert,
    closeAlert,
    showError: (title: string, description: string) => showAlert(title, description, "error"),
    showWarning: (title: string, description: string) => showAlert(title, description, "warning"),
    showInfo: (title: string, description: string) => showAlert(title, description, "info"),
  }
}
