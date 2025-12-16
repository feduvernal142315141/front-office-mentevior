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
    
    async (email: string, password: string) => {
      setIsSubmitting(true);
      setError(null);

      const success = await login(email, password);

      if (success) {
        console.log("Login successful, redirecting to /dashboard");
        router.replace("/dashboard");

        requestAnimationFrame(() => setTimeout(() => {}, 0));

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
