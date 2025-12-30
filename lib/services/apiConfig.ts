import axios, {AxiosError, InternalAxiosRequestConfig} from 'axios'
import { useAuthStore } from '@/lib/store/auth.store'

// Tipos para los handlers que se pueden inyectar
type InterceptorHandlers = {
    onLoadingStart?: () => void
    onLoadingEnd?: () => void
    onNotification?: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void
    onUnauthorized?: () => void
    onForbidden?: () => void
    onActivity?: () => void
}

// Variable para almacenar los handlers
let interceptorHandlers: InterceptorHandlers = {}

/**
 * Función para configurar los handlers de los interceptores
 */
export const setInterceptorHandlers = (handlers: Partial<InterceptorHandlers>) => {
    interceptorHandlers = {...interceptorHandlers, ...handlers}
}

// Crear instancia de axios
const apiInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    timeout: 30000, // 30 segundos
    headers: {
        'Content-Type': 'application/json',
    }
})

// ============================================
// INTERCEPTOR DE REQUEST
// ============================================
apiInstance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        // Activar indicador de carga
        interceptorHandlers.onLoadingStart?.()

        // Registrar actividad
        interceptorHandlers.onActivity?.()

        try {
            // Rutas públicas que NO deben enviar token
            const PUBLIC_ROUTES = [
                "/auth/login",
                "/security/public-key",
                "/dashboard/public-info",
            ]

            const isPublicRoute = PUBLIC_ROUTES.some((path) => config.url?.includes(path))

            if (!isPublicRoute) {
                // Obtener token desde Zustand store
                const token = useAuthStore.getState().accessToken
                
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`
                }
            }
        } catch (error) {
            console.error("Error inserting token in Authorization: ", error)
        }

        return config
    },
    (error: AxiosError) => {
        interceptorHandlers.onLoadingEnd?.()
        return Promise.reject(error)
    }
)

// ============================================
// INTERCEPTOR DE RESPONSE
// ============================================
apiInstance.interceptors.response.use(
    (response) => {
        interceptorHandlers.onLoadingEnd?.()

        return response
    },
    (error: AxiosError) => {

        interceptorHandlers.onLoadingEnd?.()

        if (error.response) {
            const status = error.response.status
            const data = error.response.data as any

            switch (status) {
                case 400:
                    const message400 = data?.message || 'Incorrect request. Please verify the information submitted.'

                    interceptorHandlers.onNotification?.(message400, 'error')

                    console.error('Error 400 - Bad Request:', data)
                    break

                case 401:
                    // Solo mostrar el AlertDialog, no el toast (evita notificación duplicada)
                    if (!error.request.responseURL.includes('auth/login')) {
                        console.error('🔴 401 Unauthorized Error Details:', {
                            url: error.request.responseURL,
                            method: error.config?.method,
                            headers: error.config?.headers,
                            response: data,
                            message: data?.message || 'No message provided'
                        })
                        interceptorHandlers.onUnauthorized?.()
                    }
                    console.error('Error 401 - Unauthorized:', data)
                    break

                case 403:
                    const message403 = data?.message || 'You do not have permission to perform this action.'

                    interceptorHandlers.onNotification?.(message403, 'error')

                    interceptorHandlers.onForbidden?.()
                    console.error('Error 403 - Forbidden:', data)
                    break

                case 404:
                    const message404 = data?.message || 'The requested resource was not found.'

                    interceptorHandlers.onNotification?.(message404, 'warning')

                    console.error('Error 404 - Not Found:', data)
                    break

                case 422:

                    console.error('Error 422 - Validation Error:', data)
                    break

                case 500:
                    const message500 = data?.message || 'Internal server error. Please try again later.'

                    interceptorHandlers.onNotification?.(message500, 'error')

                    console.error('Error 500 - Internal Server Error:', data)
                    break

                case 502:

                    interceptorHandlers.onNotification?.('Service temporarily unavailable.', 'error')

                    console.error('Error 502 - Bad Gateway:', data)
                    break

                case 503:
                    interceptorHandlers.onNotification?.('Service is currently under maintenance. Please try again later.', 'error')

                    console.error('Error 503 - Service Unavailable:', data)
                    break

                default:
                    const messageDefault = data?.message || `Error ${status}: ${error.message}`

                    interceptorHandlers.onNotification?.(messageDefault, 'error')

                    console.error(`Error ${status}:`, data)
            }
        } else if (error.request) {

            interceptorHandlers.onNotification?.(
                'We were unable to connect to the server. Please check your internet connection.',
                'error'
            )

            console.error('Network error - No response from the server:', error.request)
        } else {
            interceptorHandlers.onNotification?.(
                'Error processing the request.',
                'error'
            )
            console.error('Error configuring the request:', error.message)
        }

        return Promise.reject(error)
    }
)

export default apiInstance