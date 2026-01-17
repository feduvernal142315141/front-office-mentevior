"use client"

import { FormEvent, useCallback, useState } from "react"
import { useRouter } from "next/navigation";
import { serviceForgotPassword } from "@/lib/services/forgot-password/forgot-password";
import { getLoginUrl } from "@/lib/utils/company-identifier";


export function useForgotPassword() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isSuccess, setIsSuccess] = useState<boolean>(false)
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [touched, setTouched] = useState({ email: false })


    const onSubmit = useCallback(async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault() // ← Previene que la página se recargue
        
        setIsLoading(true)
        setError(null)
        
        try {
            const response = await serviceForgotPassword({
                email: email,
            });

            if (response?.status === 200) {
                setIsSuccess(true)
                setTimeout(() => {
                    router.push(getLoginUrl());
                }, 5000)

            }
        } catch (err: any) {
            console.error("Error forgot password:", err);
            // Captura el mensaje de error del backend
            setError(err?.response?.data?.message || err?.message || "An error occurred. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }, [email, router]);

    // Valor derivado: true si el email actual es válido
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValidEmail = emailRegex.test(email);

    return {
        onSubmit,
        isLoading,
        error,
        email,
        setEmail,
        touched,
        setTouched,
        isValidEmail,
        isSuccess,
        setIsSuccess
    }
}
