"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"

import { CompanyAccessNotice } from "@/components/auth/CompanyAccessNotice"
import { serviceGetCompanyConfig } from "@/lib/services/login/login"
import { useAuthStore } from "@/lib/store/auth.store"
import { useCompanySlug } from "@/lib/modules/auth/hooks/use-company-slug"
import { readSessionHandoffTokens } from "@/lib/modules/auth/session-handoff"
import type { CompanyInfo } from "@/lib/types/auth.types"

/**
 * Punto de llegada del login neutral. El usuario se autenticó en `app.frontoffice…`,
 * pero la sesión tiene que vivir en el subdominio de su compañía, que es otro origen:
 * acá se leen los tokens del fragmento de la URL y recién ahora se abre la sesión.
 */
export default function SessionHandoffPage() {
  const establishSession = useAuthStore((state) => state.establishSession)
  const { companySlug } = useCompanySlug()
  const [failed, setFailed] = useState(false)
  // React 18 monta dos veces en desarrollo; sin esto el handoff correría duplicado
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    const tokens = readSessionHandoffTokens(window.location.hash)

    // Los tokens salen de la URL apenas se leen: no deben quedar en el historial
    // ni ser visibles si el usuario comparte la pantalla.
    window.history.replaceState(null, "", window.location.pathname)

    if (!tokens) {
      setFailed(true)
      return
    }

    let cancelled = false

    const run = async () => {
      let company: CompanyInfo | null = null

      if (companySlug) {
        const config = await serviceGetCompanyConfig(companySlug)
        if (config?.status === 200 && config.data) {
          company = { id: config.data.id, name: config.data.legalName, logo: config.data.logo }
        }
      }

      const opened = await establishSession(tokens, company)
      if (cancelled) return

      if (!opened) {
        setFailed(true)
        return
      }

      // Recarga dura para que el layout del servidor vea la cookie recién puesta
      window.location.href = "/dashboard"
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [companySlug, establishSession])

  if (failed) {
    return (
      <CompanyAccessNotice
        tone="error"
        title="We couldn't complete your sign in"
        description="Your sign-in link is no longer valid. Please sign in again to continue."
      />
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-sm text-gray-600">Signing you in...</p>
      </div>
    </div>
  )
}
