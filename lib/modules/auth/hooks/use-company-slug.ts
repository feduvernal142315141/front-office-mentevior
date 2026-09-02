"use client";

import { useMemo } from "react";

const COMPANY_SLUG_REGEX =
    /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/

export const DEFAULT_BASE_DOMAIN = "frontoffice.mentevior.com"

/**
 * Slug reservado del login neutral. No es una compañía: es la puerta común a la que
 * apunta la landing, donde el usuario entra sin saber a qué organización pertenece.
 */
export const NEUTRAL_SLUG = "app"

export function isNeutralSlug(slug: string | null | undefined): boolean {
    return slug === NEUTRAL_SLUG
}

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

/**
 * Origen de una compañía a partir de su slug, conservando protocolo y puerto del host
 * actual. Devuelve `null` si no estamos en un dominio conocido, para que el llamador
 * se quede donde está en vez de mandar al usuario a una URL inventada.
 *
 * La URL se arma siempre acá a partir del slug validado: nunca se navega a una
 * dirección que venga del backend, así este camino no puede volverse un open redirect.
 */
export function buildCompanyOrigin(slug: string): string | null {
    if (typeof window === "undefined") return null

    const normalized = slug.trim().toLowerCase()
    if (!COMPANY_SLUG_REGEX.test(normalized) || normalized === NEUTRAL_SLUG) return null

    const baseDomain = getBaseDomain(window.location.hostname)
    if (!baseDomain) return null

    const port = window.location.port ? `:${window.location.port}` : ""
    return `${window.location.protocol}//${normalized}.${baseDomain}${port}`
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
