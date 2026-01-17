"use client";

import { useState, useEffect } from "react";
import { serviceGetCompanyConfig } from "@/lib/services/login/login";
import type { CompanyConfigResponse } from "@/lib/models/login/login";

interface UseCompanyConfigReturn {
  companyConfig: CompanyConfigResponse | null;
  isLoading: boolean;
  error: string | null;
}

export function useCompanyConfig(identifier: string): UseCompanyConfigReturn {
  const [companyConfig, setCompanyConfig] = useState<CompanyConfigResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!identifier) {
      setError("Company identifier is required");
      setIsLoading(false);
      return;
    }

    const fetchCompanyConfig = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await serviceGetCompanyConfig(identifier);

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

    fetchCompanyConfig();
  }, [identifier]);

  return {
    companyConfig,
    isLoading,
    error,
  };
}
