"use client"

import {FormEvent, useCallback, useState} from "react"
import {serviceResetPassword} from "@/lib/services/reset-password/reset-password";
import { useRouter, useSearchParams} from "next/navigation";
import {encryptRsa} from "@/lib/utils/encrypt";


export function useResetPassword() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isSuccess, setIsSuccess] = useState<boolean | null>(false)
    const router = useRouter()
    const param = useSearchParams()
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [touched, setTouched] = useState({current: false, new: false, confirm: false})


    const onSubmit = useCallback(async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)
        
        try {
            const code = param.get("code") ?? "";
            const encryptedNewPassword = await encryptRsa(newPassword);
            const response = await serviceResetPassword({
                code: code,
                password: encryptedNewPassword,
            });

            if (response?.status === 200) {
                setIsSuccess(true)
                setTimeout(() => {
                    router.push("/login");
                }, 5000)
            }
        } catch (err: any) {
            console.error("Error saving reset password:", err);
            setError(err?.response?.data?.message || err?.message || "An error occurred. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }, [param, router, newPassword]); // ← Agregué newPassword a las dependencias


    return {
        onSubmit,
        isLoading,
        error,
        confirmPassword,
        setConfirmPassword,
        newPassword,
        setNewPassword,
        touched,
        setTouched,
        isSuccess
    }
}
