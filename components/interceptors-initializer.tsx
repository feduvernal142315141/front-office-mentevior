"use client";

import { useEffect, useState } from "react";
import {useAuth} from "@/lib/hooks/use-auth";
import {useInterceptor} from "@/lib/contexts/interceptor-context";
import {setupInterceptorsWithContext} from "@/lib/services/interceptors-context-setup";


export function InterceptorsInitializer() {
  const { logout } = useAuth();
  const [showWarningModal, setShowWarningModal] = useState(false);

  const interceptorContext = useInterceptor();


  useEffect(() => {
    setupInterceptorsWithContext({
      setLoading: interceptorContext.setLoading,
      showNotification: interceptorContext.showNotification,
      handleHttpError: interceptorContext.handleHttpError,
      handleUnauthorized: interceptorContext.handleUnauthorized,
      onActivity: () => {
          console.log("TEST")},
    });
  }, [interceptorContext]);

  const handleAutoLogout = async () => {
    setShowWarningModal(false);
    setTimeout(async () => {
      await logout();
    }, 100);
  };

  const handleContinue = () => {
    setShowWarningModal(false);
  };

  return (
    <>
    </>
  );
}
