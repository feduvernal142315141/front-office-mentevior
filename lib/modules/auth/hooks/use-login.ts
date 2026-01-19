"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";

export function useLogin() {
  const router = useRouter();
  const { login } = useAuth();

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = useCallback(
    async (email: string, password: string, companyId: string, companyName: string, companyLogo: string) => {
      setIsSubmitting(true);
      setError(null);

      const success = await login(email, password, companyId, companyName, companyLogo);

      if (success) {
        console.log("Login successful, redirecting to /dashboard");
        
        // Usar window.location.href para forzar un hard reload
        // Esto asegura que el servidor verifique la cookie recién seteada
        window.location.href = "/dashboard";
        return;
      }

      setError("Invalid credentials");
      setIsSubmitting(false);
    },
    [login, router]
  );

  return {
    onSubmit,
    error,
    isSubmitting,
  };
}
