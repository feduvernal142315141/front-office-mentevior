"use client";

import { useEffect } from "react";
import { useInterceptor } from "@/lib/contexts/interceptor-context";
import { setupInterceptorsWithContext } from "@/lib/services/interceptors-context-setup";

export function InterceptorsInitializer() {
  const interceptorContext = useInterceptor();

  useEffect(() => {
    setupInterceptorsWithContext({
      setLoading: interceptorContext.setLoading,
      showNotification: interceptorContext.showNotification,
      handleHttpError: interceptorContext.handleHttpError,
      handleUnauthorized: interceptorContext.handleUnauthorized,
      onActivity: () => {
        // Activity tracking (para futuro auto-logout por inactividad)
      },
    });
  }, [interceptorContext]);

  return null;
}
