"use client"

import { Loader2 } from "lucide-react"

import { CompanyAccessNotice } from "@/components/auth/CompanyAccessNotice"
import { useCompanyConfig } from "@/lib/modules/auth/hooks/use-company-config"
import type { CompanyInfo } from "@/lib/types/auth.types"

import { BrandSection } from "./BrandSection"
import { LoginForm } from "./LoginForm"

/** Marca de la plataforma para el login neutral, donde todavía no hay compañía. */
const NEUTRAL_BRAND = {
  name: "Mentevior",
  logo: "/logoMenteVior.png",
}

export default function LoginPage() {
  const { companyConfig, isLoading, error, isNeutral } = useCompanyConfig()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          <p className="text-sm text-gray-600">Loading company information...</p>
        </div>
      </div>
    )
  }

  // En el login neutral no hay compañía que resolver, así que la falta de config
  // no es un error: es justamente el caso que este flujo viene a cubrir.
  if (!isNeutral && (error || !companyConfig)) {
    return (
      <CompanyAccessNotice
        tone="error"
        title="Company Not Found"
        description={
          error === "Company identifier is required"
            ? "This URL is not tied to any organization. Please use your organization's unique URL."
            : "The company you're trying to access doesn't exist or is not available. Please check your organization's URL."
        }
      />
    )
  }

  const company: CompanyInfo | null = companyConfig
    ? { id: companyConfig.id, name: companyConfig.legalName, logo: companyConfig.logo }
    : null

  return (
    <div className="min-h-screen login-background flex relative overflow-hidden">
      <BrandSection
        companyName={company?.name ?? NEUTRAL_BRAND.name}
        companyLogo={company?.logo || NEUTRAL_BRAND.logo}
      />

      <div className="
        w-full lg:w-[40%] 2xl:w-[45%]
        flex items-center justify-center
        p-6 lg:p-12 2xl:p-20
        relative z-10
        bg-white/70 backdrop-blur-xl
      ">
        <LoginForm company={company} />
      </div>
    </div>
  )
}
