"use client";

import {useState, useEffect} from "react";
import {serviceGetCompanyConfig} from "@/lib/services/login/login";
import type {CompanyConfigResponse} from "@/lib/models/login/login";

interface UseCompanyConfigReturn {
    companySlug: String | null;
    error: string | null;
}

const COMPANY_SLUG_REGEX =
    /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/

const BASE_DOMAINS = [
    "frontoffice.dev.mentevior.com",
    "frontoffice.mentevior.com",
    "localhost",
]

export function useCompanySlug(): UseCompanyConfigReturn {
    const [companySlug, setCompanySlug] = useState<String | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const slug = getCompanySlug(window.location.hostname);
        setCompanySlug(slug)
    }, []);

    const getCompanySlug = (hostname: string): string | null => {
        const normalizedHostname = hostname
            .toLowerCase()
            .replace(/\.$/, "")

        for (const baseDomain of BASE_DOMAINS) {
            const suffix = `.${baseDomain}`
            if (!normalizedHostname.endsWith(suffix)) {
                continue
            }
            const slug = normalizedHostname.slice(0, -suffix.length)

            // Evita aceptar subdominios con varios niveles.
            if (slug.includes(".")) {
                return null
            }

            return COMPANY_SLUG_REGEX.test(slug) ? slug : null
        }

        return null
    }

    return {
        companySlug,
        error,
    };
}
