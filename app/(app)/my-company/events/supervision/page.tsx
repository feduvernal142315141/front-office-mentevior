"use client"

import { useState } from "react"
import { Eye, Settings } from "lucide-react"
import { Button } from "@/components/custom/Button"
import { AuditLogsModal } from "@/components/custom/AuditLogsModal"
import { useSupervisionConfig } from "@/lib/modules/supervision-config/hooks/use-supervision-config"
import { SupervisionConfigForm } from "./components/SupervisionConfigForm"
import { SupervisionConfigSkeleton } from "./components/SupervisionConfigSkeleton"

export default function SupervisionPage() {
  const [auditOpen, setAuditOpen] = useState(false)
  const { config, isLoading } = useSupervisionConfig()

  if (isLoading) {
    return <SupervisionConfigSkeleton />
  }

  return (
    <div className="bg-gray-50/50 p-6 pb-28">
      <div className="mx-auto max-w-5xl xl:max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="rounded-xl border border-[#037ECC]/20 bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 p-3">
              <Eye className="h-8 w-8 text-[#037ECC]" />
            </div>
            <div>
              <h1 className="bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-3xl font-bold text-transparent">
                Supervision
              </h1>
              <p className="mt-1 text-slate-600">Configure supervision event settings</p>
            </div>
          </div>

          <Button
            variant="secondary"
            onClick={() => setAuditOpen(true)}
            className="gap-2 flex items-center px-4"
            aria-label="View supervision configuration audit logs"
            title="View supervision configuration audit logs"
          >
            <Settings className="w-4 h-4" />
            Logs
          </Button>
        </div>

        <SupervisionConfigForm config={config} />
      </div>

      <AuditLogsModal
        open={auditOpen}
        onOpenChange={setAuditOpen}
        entityName="SupervisionConfig"
        title="Audit Logs - Supervision"
      />
    </div>
  )
}
