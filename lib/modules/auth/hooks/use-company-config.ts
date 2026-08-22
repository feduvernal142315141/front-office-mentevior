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
        if (!companySlug) {
            setError("Company identifier is required");
            setIsLoading(false);
            return;
        }

        const fetchCompanyConfig = async (companySlug:string) => {
            setIsLoading(true);
            setError(null);

            try {
                const response = await serviceGetCompanyConfig(companySlug);

                if (response?.status === 200 && response.data) {
                    setCompanyConfig(response.data);
                } else {
                    setError("Company not found");
                }
            } catch (err) {
                console.error("[useCompanyConfig] Error fetching company config:", err);
                setError("Failed to load company information");
            } finally {
                setIsLoading(false);
            }
        };

        fetchCompanyConfig(companySlug as string);
    }, [companySlug]);

    return {
        companyConfig,
        isLoading,
        error,
    };
}
