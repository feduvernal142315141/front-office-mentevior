"use client"

/**
 * CONTEXT API FOR INTERCEPTORS
 * 
 * This context manages the global state of:
 * - Global Loading/Spinner
 * - Notifications and alerts
 * - HTTP error handling
 * 
 * Integrates seamlessly with Axios interceptors
 */

import { createContext, useContext, useState, ReactNode } from "react"
import { toast } from "sonner"

// ============================================
// TYPES
// ============================================

type NotificationType = 'success' | 'error' | 'warning' | 'info'

interface Notification {
  id: string
  message: string
  type: NotificationType
  timestamp: number
}

interface AlertDialogData {
  isOpen: boolean
  title: string
  description: string
  type: 'error' | 'warning' | 'info'
}

interface InterceptorContextType {
  // Loading state
  isLoading: boolean
  activeRequests: number
  setLoading: (loading: boolean) => void
  
  // Notifications
  notifications: Notification[]
  showNotification: (message: string, type: NotificationType) => void
  clearNotification: (id: string) => void
  clearAllNotifications: () => void
  
  // Alert Dialog (for critical errors)
  alertDialog: AlertDialogData
  showAlert: (title: string, description: string, type?: 'error' | 'warning' | 'info') => void
  closeAlert: () => void
  
  // HTTP error handling
  handleHttpError: (statusCode: number, message?: string) => void
  
  // Unauthorized handling (401)
  handleUnauthorized: () => void
  
  // Activity reset (for auto-logout)
  onActivity?: () => void
  setOnActivity: (callback: () => void) => void
}

// ============================================
// CONTEXT
// ============================================

const InterceptorContext = createContext<InterceptorContextType | undefined>(undefined)

// ============================================
// PROVIDER
// ============================================

export function InterceptorProvider({ children }: { children: ReactNode }) {
  // Loading state
  const [isLoading, setIsLoading] = useState(false)
  const [activeRequests, setActiveRequests] = useState(0)
  
  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([])
  
  // AlertDialog state
  const [alertDialog, setAlertDialog] = useState<AlertDialogData>({
    isOpen: false,
    title: '',
    description: '',
    type: 'info'
  })
  
  // Activity callback (for auto-logout)
  const [onActivity, setOnActivity] = useState<(() => void) | undefined>(undefined)

  // ============================================
  // LOADING FUNCTIONS
  // ============================================
  
  const setLoading = (loading: boolean) => {
    setActiveRequests(prev => {
      const newCount = loading ? prev + 1 : Math.max(0, prev - 1)
      setIsLoading(newCount > 0)
      return newCount
    })
  }

  // ============================================
  // NOTIFICATION FUNCTIONS
  // ============================================
  
  const showNotification = (message: string, type: NotificationType) => {
    const notification: Notification = {
      id: `${Date.now()}-${Math.random()}`,
      message,
      type,
      timestamp: Date.now()
    }
    
    setNotifications(prev => [...prev, notification])
    
    // Show toast
    switch (type) {
      case 'success':
        toast.success(message)
        break
      case 'error':
        toast.error(message)
        break
      case 'warning':
        toast.warning(message)
        break
      case 'info':
        toast.info(message)
        break
    }
    
    // Auto-clear after 5 seconds
    setTimeout(() => {
      clearNotification(notification.id)
    }, 5000)
  }
  
  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }
  
  const clearAllNotifications = () => {
    setNotifications([])
  }

  // ============================================
  // ALERT DIALOG FUNCTIONS
  // ============================================
  
  const showAlert = (
    title: string, 
    description: string, 
    type: 'error' | 'warning' | 'info' = 'info'
  ) => {
    setAlertDialog({
      isOpen: true,
      title,
      description,
      type
    })
  }
  
  const closeAlert = () => {
    setAlertDialog(prev => ({ ...prev, isOpen: false }))
  }

  // ============================================
  // HTTP ERROR HANDLING
  // ============================================
  
  const handleHttpError = (statusCode: number, message?: string) => {
    switch (statusCode) {
      case 400:
        showNotification(message || 'The request contains invalid data', 'error')
        break
      case 401:
        handleUnauthorized()
        break
      case 403:
        showAlert(
          'Access Denied',
          message || 'You do not have the necessary permissions to perform this action. Contact the administrator if you believe this is an error.',
          'error'
        )
        break
      case 404:
        showNotification(message || 'The requested resource does not exist', 'error')
        break
      case 422:
        showNotification(message || 'The provided data is not valid', 'error')
        break
      case 500:
        showAlert(
          'Server Error',
          message || 'A server error occurred. Please try again later.',
          'error'
        )
        break
      case 502:
        showAlert(
          'Service Unavailable',
          'The server is not responding. Please try again in a few moments.',
          'error'
        )
        break
      case 503:
        showAlert(
          'Service Under Maintenance',
          'The service is temporarily offline. Please try again later.',
          'warning'
        )
        break
      default:
        showNotification(message || 'An unexpected error occurred', 'error')
    }
  }
  
  const handleUnauthorized = () => {
    showAlert(
      'Session Expired',
      'Your session has expired. You will be redirected to the login page',
      'warning'
    )
    
    // Importar logout desde el store
    if (typeof window !== 'undefined') {
      setTimeout(async () => {
        const { useAuthStore } = await import('@/lib/store/auth.store')
        useAuthStore.getState().logout()
        window.location.href = '/login'
      }, 5000)
    }
  }

  // ============================================
  // CONTEXT VALUE
  // ============================================
  
  const value: InterceptorContextType = {
    // Loading
    isLoading,
    activeRequests,
    setLoading,
    
    // Notifications
    notifications,
    showNotification,
    clearNotification,
    clearAllNotifications,
    
    // Alert Dialog
    alertDialog,
    showAlert,
    closeAlert,
    
    // HTTP Errors
    handleHttpError,
    handleUnauthorized,
    
    // Activity
    onActivity,
    setOnActivity
  }

  return (
    <InterceptorContext.Provider value={value}>
      {children}
    </InterceptorContext.Provider>
  )
}

// ============================================
// CUSTOM HOOK
// ============================================

export function useInterceptor(): InterceptorContextType {
  const context = useContext(InterceptorContext)
  if (!context) {
    throw new Error("useInterceptor must be used within an InterceptorProvider")
  }
  return context
}

// ============================================
// UTILITY HOOKS
// ============================================

/**
 * Hook to get only the loading state
 */
export function useGlobalLoading() {
  const { isLoading, activeRequests } = useInterceptor()
  return { isLoading, activeRequests }
}

/**
 * Hook to easily show notifications
 */
export function useNotifications() {
  const { showNotification, notifications, clearNotification, clearAllNotifications } = useInterceptor()
  return { 
    showNotification,
    notifications, 
    clearNotification, 
    clearAllNotifications,
    // Helpers
    showSuccess: (message: string) => showNotification(message, 'success'),
    showError: (message: string) => showNotification(message, 'error'),
    showWarning: (message: string) => showNotification(message, 'warning'),
    showInfo: (message: string) => showNotification(message, 'info'),
  }
}

/**
 * Hook to handle alerts
 */
export function useAlerts() {
  const { alertDialog, showAlert, closeAlert } = useInterceptor()
  return { 
    alertDialog, 
    showAlert, 
    closeAlert,
    // Helpers
    showError: (title: string, description: string) => showAlert(title, description, 'error'),
    showWarning: (title: string, description: string) => showAlert(title, description, 'warning'),
    showInfo: (title: string, description: string) => showAlert(title, description, 'info'),
  }
}
