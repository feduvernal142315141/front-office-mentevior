"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import { CompanyAccessNotice } from "@/components/auth/CompanyAccessNotice"
import { isNeutralSlug, useCompanySlug } from "@/lib/modules/auth/hooks/use-company-slug"

export default function Home() {
  const router = useRouter()
  const { companySlug } = useCompanySlug()
  // El slug sale del hostname, que no existe en el render del servidor: sin esperar
  // al montaje, el HTML del servidor y el del cliente no coincidirían.
  const [mounted, setMounted] = useState(false)

  const isNeutral = isNeutralSlug(companySlug)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && isNeutral) router.replace("/login")
  }, [mounted, isNeutral, router])

  if (!mounted || isNeutral) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <CompanyAccessNotice
      title="Company-Specific Access"
      description="MenteVior is a multi-tenant platform. To access your account, please use your organization's unique URL."
    />
  )
}
