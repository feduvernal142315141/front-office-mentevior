"use client"

import { useState } from "react"
import { Building2, Settings } from "lucide-react"
import { Card } from "@/components/custom/Card"
import { Button } from "@/components/custom/Button"
import { AuditLogsModal } from "@/components/custom/AuditLogsModal"
import { useAccountProfile } from "@/lib/modules/account-profile/hooks/use-account-profile"
import { AccountProfileForm } from "./components/AccountProfileForm"

export default function AccountProfilePage() {
  const [auditOpen, setAuditOpen] = useState(false)
  const { accountProfile } = useAccountProfile()

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 border border-[#037ECC]/20">
                <Building2 className="h-8 w-8 text-[#037ECC]" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-transparent">
                  Account Profile
                </h1>
                <p className="text-slate-600 mt-1">
                  Manage your company account information
                </p>
              </div>
            </div>

            <Button
              variant="secondary"
              onClick={() => setAuditOpen(true)}
              className="flex items-center gap-2 px-4"
              aria-label="View account profile audit logs"
              title="View account profile audit logs"
            >
              <Settings className="h-4 w-4" />
              Logs
            </Button>
          </div>
        </div>

        <Card variant="elevated" padding="lg">
          <AccountProfileForm />
        </Card>
      </div>

      <AuditLogsModal
        open={auditOpen}
        onOpenChange={setAuditOpen}
        entityName="Company"
        title="Audit Logs - Account Profile"
      />
    </div>
  )
}
