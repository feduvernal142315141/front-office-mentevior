"use client"

import { BrandSection } from "./BrandSection"
import { LoginForm } from "./LoginForm"
import { useCompanyConfig } from "@/lib/modules/auth/hooks/use-company-config"
import { useParams } from "next/navigation"
import { Loader2, AlertCircle } from "lucide-react"
import { useEffect } from "react"
import { setCompanyIdentifier } from "@/lib/utils/company-identifier"

export default function LoginPage() {
  const params = useParams()
  const companyIdentifier = params?.companyIdentifier as string

  const { companyConfig, isLoading, error } = useCompanyConfig(companyIdentifier)

  useEffect(() => {
    if (companyIdentifier) {
      setCompanyIdentifier(companyIdentifier)
    }
  }, [companyIdentifier])

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-white">
        <div className="flex flex-col items-center gap-4 max-w-md text-center p-8">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Company Not Found</h2>
          <p className="text-sm text-gray-600">
            {error || "The company you're trying to access doesn't exist or is not available."}
          </p>
        </div>
      </div>
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
