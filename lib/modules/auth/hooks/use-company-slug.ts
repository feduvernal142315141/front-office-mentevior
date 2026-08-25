"use client";

import { useMemo } from "react";

const COMPANY_SLUG_REGEX =
    /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/

const BASE_DOMAINS = [
    "frontoffice.dev.mentevior.com",
    "frontoffice.mentevior.com",
    "localhost",
]

function getCompanySlug(hostname: string): string | null {
    const normalizedHostname = hostname
        .toLowerCase()
        .replace(/\.$/, "")

    for (const baseDomain of BASE_DOMAINS) {
        const suffix = `.${baseDomain}`
        if (!normalizedHostname.endsWith(suffix)) {
            continue
        }
        const slug = normalizedHostname.slice(0, -suffix.length)

        if (slug.includes(".")) {
            return null
        }

        return COMPANY_SLUG_REGEX.test(slug) ? slug : null
    }

    return null
}

export function useCompanySlug() {
    const companySlug = useMemo(() => {
        if (typeof window === "undefined") return null
        return getCompanySlug(window.location.hostname)
    }, [])

    return {
        companySlug,
        error: null as string | null,
    };
}
