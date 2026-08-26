"use client"

import { BrandSection } from "./BrandSection"
import { LoginForm } from "./LoginForm"
import { useCompanyConfig } from "@/lib/modules/auth/hooks/use-company-config"
import { Loader2 } from "lucide-react"
import { CompanyAccessNotice } from "@/components/auth/CompanyAccessNotice"

export default function LoginPage() {
  const { companyConfig, isLoading, error } = useCompanyConfig()

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

  if (error || !companyConfig) {
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

  return (
    <div className="min-h-screen login-background flex relative overflow-hidden">
      <BrandSection 
        companyName={companyConfig.legalName} 
        companyLogo={companyConfig.logo} 
      />

      <div className="
        w-full lg:w-[40%] 2xl:w-[45%]
        flex items-center justify-center
        p-6 lg:p-12 2xl:p-20
        relative z-10
        bg-white/70 backdrop-blur-xl
      ">
        <LoginForm 
          companyId={companyConfig.id}
          companyName={companyConfig.legalName}
          companyLogo={companyConfig.logo}
        />
      </div>
    </div>
  )
}
