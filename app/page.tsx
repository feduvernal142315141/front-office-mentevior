"use client"

import { CompanyAccessNotice } from "@/components/auth/CompanyAccessNotice"

export default function Home() {
  return (
    <CompanyAccessNotice
      title="Company-Specific Access"
      description="MenteVior is a multi-tenant platform. To access your account, please use your organization's unique URL."
    />
  )
}
