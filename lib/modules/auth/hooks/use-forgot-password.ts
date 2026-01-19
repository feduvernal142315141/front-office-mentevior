"use client"

import { FormEvent, useCallback, useState } from "react"
import { useRouter } from "next/navigation";
import { serviceForgotPassword } from "@/lib/services/forgot-password/forgot-password";
import { getLoginUrl } from "@/lib/utils/company-identifier";


export function useForgotPassword(companyId: string) {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isSuccess, setIsSuccess] = useState<boolean>(false)
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [touched, setTouched] = useState({ email: false })


    const onSubmit = useCallback(async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault() 
        
        setIsLoading(true)
        setError(null)
        
        try {
            const response = await serviceForgotPassword({
                email: email,
                companyId: companyId,
            });

            if (response?.status === 200) {
                setIsSuccess(true)
                setTimeout(() => {
                    router.push(getLoginUrl());
                }, 5000)

            }
        } catch (err: any) {
            console.error("Error forgot password:", err);
   
            setError(err?.response?.data?.message || err?.message || "An error occurred. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }, [email, companyId, router]);


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
