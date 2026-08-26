"use client";

import { useMemo } from "react";

const COMPANY_SLUG_REGEX =
    /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/

export const DEFAULT_BASE_DOMAIN = "frontoffice.mentevior.com"

const BASE_DOMAINS = [
    "frontoffice.dev.mentevior.com",
    "frontoffice.mentevior.com",
    "localhost",
]

/**
 * Devuelve el dominio base (sin el slug de compañía) al que pertenece el host
 * actual, o `null` si el host no es ninguno de los conocidos. Sirve para armar
 * la URL de ejemplo con el dominio real donde está corriendo la app en vez de
 * uno hardcodeado.
 */
export function getBaseDomain(hostname: string): string | null {
    const normalizedHostname = hostname.toLowerCase().replace(/\.$/, "")

    for (const baseDomain of BASE_DOMAINS) {
        if (
            normalizedHostname === baseDomain ||
            normalizedHostname.endsWith(`.${baseDomain}`)
        ) {
            return baseDomain
        }
    }

    return null
}

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
