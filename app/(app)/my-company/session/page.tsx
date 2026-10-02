"use client"

import { useState } from "react"
import { CalendarCheck, Settings } from "lucide-react"
import { Button } from "@/components/custom/Button"
import { AuditLogsModal } from "@/components/custom/AuditLogsModal"
import { useAppointmentConfig } from "@/lib/modules/appointment-config/hooks/use-appointment-config"
import { AppointmentConfigForm } from "./components/AppointmentConfigForm"
import { AppointmentConfigSkeleton } from "./components/AppointmentConfigSkeleton"

export default function AppointmentPage() {
  const [auditOpen, setAuditOpen] = useState(false)
  const { config, isLoading } = useAppointmentConfig()

  if (isLoading) {
    return <AppointmentConfigSkeleton />
  }

  return (
    <div className="bg-gray-50/50 p-6 pb-28">
      <div className="mx-auto max-w-5xl xl:max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="rounded-xl border border-[#037ECC]/20 bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 p-3">
              <CalendarCheck className="h-8 w-8 text-[#037ECC]" />
            </div>
            <div>
              <h1 className="bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-3xl font-bold text-transparent">
                Session
              </h1>
              <p className="mt-1 text-slate-600">Schedule and manage client sessions</p>
            </div>
          </div>

          <Button
            variant="secondary"
            onClick={() => setAuditOpen(true)}
            className="gap-2 flex items-center px-4"
            aria-label="View session configuration audit logs"
            title="View session configuration audit logs"
          >
            <Settings className="w-4 h-4" />
            Logs
          </Button>
        </div>

        <AppointmentConfigForm config={config} />
      </div>

      <AuditLogsModal
        open={auditOpen}
        onOpenChange={setAuditOpen}
        entityName="AppointmentConfig"
        title="Audit Logs - Session"
      />
    </div>
  )
}
