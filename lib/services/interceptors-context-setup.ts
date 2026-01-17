/**
 * INTERCEPTORS CONFIGURATION WITH CONTEXT API
 * 
 * This file configures Axios interceptors to use
 * the InterceptorContext instead of Redux.
 */

import { setInterceptorHandlers } from './apiConfig'
import { getLoginUrl } from '@/lib/utils/company-identifier'

// ============================================
// CONFIGURATION TYPE
// ============================================

interface InterceptorConfig {
  setLoading: (loading: boolean) => void
  showNotification: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void
  handleHttpError: (statusCode: number, message?: string) => void
  handleUnauthorized: () => void
  onActivity?: () => void
}

// ============================================
// CONTEXT API CONFIGURATION
// ============================================

/**
 * Configures interceptors using InterceptorContext
 * 
 * @example
 * ```tsx
 * // In your initialization component
 * import { useInterceptor } from '@/contexts/interceptor-context'
 * import { setupInterceptorsWithContext } from '@/lib/services/interceptors-context-setup'
 * 
 * function InterceptorsInitializer() {
 *   const interceptorContext = useInterceptor()
 *   
 *   useEffect(() => {
 *     setupInterceptorsWithContext(interceptorContext)
 *   }, [])
 *   
 *   return null
 * }
 * ```
 */
export const setupInterceptorsWithContext = (config: InterceptorConfig) => {
  setInterceptorHandlers({
    onLoadingStart: () => {
      config.setLoading(true)
    },

    onLoadingEnd: () => {
      config.setLoading(false)
    },

    onActivity: () => {
      config.onActivity?.()
    },

    onNotification: (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
      config.showNotification(message, type)
    },

    onUnauthorized: () => {
      config.handleUnauthorized()
    },

    onForbidden: (message: string) => {
      config.handleHttpError(403, message)
    },
  })
}

// ============================================
// SIMPLIFIED CONFIGURATION (ESSENTIALS ONLY)
// ============================================

/**
 * Simplified version that only requires basic functions
 * 
 * @example
 * ```tsx
 * const { setLoading, showNotification } = useInterceptor()
 * 
 * useEffect(() => {
 *   setupInterceptorsSimple({
 *     setLoading,
 *     showNotification,
 *   })
 * }, [])
 * ```
 */
export const setupInterceptorsSimple = (
  setLoading: (loading: boolean) => void,
  showNotification: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void
) => {
  setInterceptorHandlers({
    onLoadingStart: () => setLoading(true),
    onLoadingEnd: () => setLoading(false),
    onNotification: showNotification,
    onUnauthorized: () => {
      showNotification('Your session has expired. Please log in again.', 'error')
      setTimeout(() => {
        window.location.href = getLoginUrl()
      }, 10000)
    },
    onForbidden: () => {
      showNotification('You do not have permission to perform this action.', 'error')
    },
  })
}

// ============================================
// AUTO-LOGOUT CONFIGURATION
// ============================================

/**
 * Configuration that includes integration with the auto-logout system
 * 
 * @example
 * ```tsx
 * const interceptorContext = useInterceptor()
 * const { resetTimer } = useAutoLogout()
 * 
 * useEffect(() => {
 *   setupInterceptorsWithAutoLogout(interceptorContext, resetTimer)
 * }, [])
 * ```
 */
export const setupInterceptorsWithAutoLogout = (
  config: InterceptorConfig,
  resetActivityTimer: () => void
) => {
  setupInterceptorsWithContext({
    ...config,
    onActivity: resetActivityTimer
  })
}

