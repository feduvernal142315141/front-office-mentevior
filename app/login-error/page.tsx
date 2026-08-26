"use client"

import { CompanyAccessNotice } from "@/components/auth/CompanyAccessNotice"

export default function LoginErrorPage() {
  return (
    <CompanyAccessNotice
      tone="error"
      title="Access Not Available"
      description="Your session has expired or you don't have a valid company URL saved. Please access the platform through your organization's specific login URL."
    />
  )
}
