"use client";

import {useState, useEffect} from "react";
import {serviceGetCompanyConfig} from "@/lib/services/login/login";
import type {CompanyConfigResponse} from "@/lib/models/login/login";
import {useCompanySlug} from "@/lib/modules/auth/hooks/use-company-slug";

interface UseCompanyConfigReturn {
    companyConfig: CompanyConfigResponse | null;
    isLoading: boolean;
    error: string | null;
}

export function useCompanyConfig(): UseCompanyConfigReturn {
    const [companyConfig, setCompanyConfig] = useState<CompanyConfigResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const {companySlug} = useCompanySlug()

    useEffect(() => {
        if (companySlug === null) {
            setCompanyConfig(null)
            setError("Company identifier is required")
            setIsLoading(false)
            return
        }

        let cancelled = false

        const fetchCompanyConfig = async (slug: string) => {
            setIsLoading(true)
            setError(null)

            try {
                const response = await serviceGetCompanyConfig(slug)

                if (cancelled) return

                if (response?.status === 200 && response.data) {
                    setCompanyConfig(response.data)
                } else {
                    setCompanyConfig(null)
                    setError("Company not found")
                }
            } catch (err) {
                if (cancelled) return
                console.error("[useCompanyConfig] Error fetching company config:", err)
                setCompanyConfig(null)
                setError("Failed to load company information")
            } finally {
                if (!cancelled) setIsLoading(false)
            }
        }

        void fetchCompanyConfig(companySlug as string)

        return () => {
            cancelled = true
        }
    }, [companySlug])

    return {
        companyConfig,
        isLoading,
        error,
    };
}
