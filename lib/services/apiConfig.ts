import axios, {AxiosError, InternalAxiosRequestConfig} from 'axios'
import {useAuthStore} from '@/lib/store/auth.store'
import { parseApiErrorMessage } from '@/lib/utils/api-error-message'

// Tipos para los handlers que se pueden inyectar
type InterceptorHandlers = {
    onLoadingStart?: () => void
    onLoadingEnd?: () => void
    onNotification?: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void
    onUnauthorized?: () => void
    onForbidden?: (message: string) => void
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

// ============================================
// 401 RETRY - Cola de requests pendientes
// ============================================
let isRefreshingToken = false
let failedQueue: Array<{
    resolve: (token: string) => void
    reject: () => void
}> = []

const processQueue = (token: string | null) => {
    failedQueue.forEach(({ resolve, reject }) => {
        if (token) {
            resolve(token)
        } else {
            reject()
        }
    })
    failedQueue = []
}

// Rutas de auth que NO deben triggear retry en 401
const SKIP_RETRY_ROUTES = [
    '/auth/login',
    '/auth/refresh-token',
]

// Crear instancia de axios
const apiInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
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
                "/company/get-config-by-identifier",
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
    async (error: AxiosError) => {

        interceptorHandlers.onLoadingEnd?.()

        if (error.response) {
            const status = error.response.status
            const data = error.response.data as any
            const skipNotification = !!(error.config as any)?.skipNotification
            const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

            // ============================================
            // 401 - Intentar refresh + retry automático
            // ============================================
            if (status === 401) {
                const isSkipRoute = SKIP_RETRY_ROUTES.some((path) => originalRequest?.url?.includes(path))

                // Si es ruta de auth o ya se reintentó, no hacer retry
                if (isSkipRoute || originalRequest?._retry) {
                    return Promise.reject(error)
                }

                // Si ya hay un refresh en curso, encolar esta request
                if (isRefreshingToken) {
                    return new Promise((resolve, reject) => {
                        failedQueue.push({
                            resolve: (token: string) => {
                                originalRequest!.headers.Authorization = `Bearer ${token}`
                                originalRequest!._retry = true
                                resolve(apiInstance(originalRequest!))
                            },
                            reject: () => reject(error),
                        })
                    })
                }

                // Primer 401: intentar refresh
                originalRequest._retry = true
                isRefreshingToken = true

                try {
                    const success = await useAuthStore.getState().refresh()
                    const newToken = useAuthStore.getState().accessToken

                    if (success && newToken) {
                        // Refresh exitoso: reintentar request original y resolver cola
                        processQueue(newToken)
                        originalRequest.headers.Authorization = `Bearer ${newToken}`
                        return apiInstance(originalRequest)
                    }

                    // Refresh falló: rechazar cola y notificar
                    processQueue(null)
                    interceptorHandlers.onUnauthorized?.()
                    return Promise.reject(error)
                } catch (refreshError) {
                    processQueue(null)
                    interceptorHandlers.onUnauthorized?.()
                    return Promise.reject(error)
                } finally {
                    isRefreshingToken = false
                }
            }

            // ============================================
            // Otros códigos de error
            // ============================================
            switch (status) {
                case 400: {
                    if (!skipNotification) {
                        const { description: message400 } = parseApiErrorMessage(
                            data,
                            'Incorrect request. Please verify the information submitted.'
                        )

                        interceptorHandlers.onNotification?.(message400, 'error')
                    }
                    break
                }

                case 403:
                    const message403 = data?.message || 'You do not have permission to perform this action.'

                    interceptorHandlers.onForbidden?.(message403)
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
