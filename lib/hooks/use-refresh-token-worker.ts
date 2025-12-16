"use client";

import { useEffect, useRef, useCallback } from "react";
import { createRefreshTokenWorker } from "@/lib/workers/refresh-token-worker";

interface TokenExpiration {
  accessTokenExpiresAt: number;
  refreshTokenExpiresAt: number;
}

interface UseRefreshTokenWorkerConfig {
  onNeedsRefresh?: () => void;
  onSessionExpired?: () => void;
  enabled?: boolean;
}

interface UseRefreshTokenWorkerReturn {
  setTokenExpiration: (expiration: TokenExpiration) => void;
  clearWorker: () => void;
  stopWorker: () => void;
  startWorker: () => void;
}

/**
 * Hook para manejar el Web Worker de refresh token
 * 
 * El worker corre en un hilo separado y verifica cada 5 segundos
 * si el access token está por expirar. Funciona incluso cuando
 * el usuario está en otra pestaña.
 * 
 * @example
 * ```typescript
 * const { setTokenExpiration, clearWorker } = useRefreshTokenWorker({
 *   onNeedsRefresh: () => performTokenRefresh(),
 *   onSessionExpired: () => logout(),
 *   enabled: isAuthenticated,
 * });
 * ```
 */
export const useRefreshTokenWorker = (
  config: UseRefreshTokenWorkerConfig = {}
): UseRefreshTokenWorkerReturn => {
  const { onNeedsRefresh, onSessionExpired, enabled = true } = config;

  const workerRef = useRef<Worker | null>(null);
  
  // Usar refs para los callbacks para evitar recrear el worker cuando cambian
  const onNeedsRefreshRef = useRef(onNeedsRefresh);
  const onSessionExpiredRef = useRef(onSessionExpired);
  
  // Cola de mensajes pendientes para cuando el worker aún no está listo
  const pendingExpirationRef = useRef<TokenExpiration | null>(null);

  // Mantener las refs actualizadas
  useEffect(() => {
    onNeedsRefreshRef.current = onNeedsRefresh;
  }, [onNeedsRefresh]);

  useEffect(() => {
    onSessionExpiredRef.current = onSessionExpired;
  }, [onSessionExpired]);

  /**
   * Envía los tiempos de expiración al Worker
   * Si el worker aún no existe, guarda el mensaje para enviarlo después
   */
  const setTokenExpiration = useCallback((expiration: TokenExpiration) => {
    if (workerRef.current) {
      workerRef.current.postMessage({
        type: "SET_TOKEN_EXPIRATION",
        payload: expiration,
      });
    } else {
      // Guardar para enviar cuando el worker esté listo
      pendingExpirationRef.current = expiration;
    }
  }, []);

  /**
   * Limpia el estado del Worker
   */
  const clearWorker = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: "CLEAR" });
    }
  }, []);

  /**
   * Detiene el intervalo del Worker
   */
  const stopWorker = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: "STOP" });
    }
  }, []);

  /**
   * Reinicia el intervalo del Worker
   */
  const startWorker = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: "START" });
    }
  }, []);

  /**
   * Inicializa el Worker y configura los listeners
   * Solo depende de `enabled` para evitar recrear el worker innecesariamente
   */
  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Crear el worker
    workerRef.current = createRefreshTokenWorker();

    // Manejar mensajes del worker - usa refs para siempre tener el callback más reciente
    workerRef.current.onmessage = (event: MessageEvent) => {
      const { type } = event.data;

      switch (type) {
        case "NEEDS_REFRESH":
          onNeedsRefreshRef.current?.();
          break;

        case "SESSION_EXPIRED":
          onSessionExpiredRef.current?.();
          break;

        default:
          console.error("[useRefreshTokenWorker] Unknown message type:", type);
      }
    };

    // Manejar errores del worker
    workerRef.current.onerror = (error) => {
      console.error("[useRefreshTokenWorker] Worker error:", error);
    };


    // Enviar mensaje pendiente si existe (para resolver race condition)
    if (pendingExpirationRef.current && workerRef.current) {
      workerRef.current.postMessage({
        type: "SET_TOKEN_EXPIRATION",
        payload: pendingExpirationRef.current,
      });
      pendingExpirationRef.current = null;
    }

    // Cleanup al desmontar
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [enabled]); // Solo depende de enabled

  return {
    setTokenExpiration,
    clearWorker,
    stopWorker,
    startWorker,
  };
};

export default useRefreshTokenWorker;

