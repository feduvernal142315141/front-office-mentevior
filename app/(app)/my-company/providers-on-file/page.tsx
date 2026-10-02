"use client"

import { useState } from "react"
import { Contact, Plus, Settings } from "lucide-react"
import { Button } from "@/components/custom/Button"
import { AuditLogsModal } from "@/components/custom/AuditLogsModal"
import { ProvidersOnFileTable } from "./components/ProvidersOnFileTable"
import { useProvidersOnFileTable } from "./hooks/useProvidersOnFileTable"
import { CreateGate } from "@/components/layout/PermissionGate"
import { PermissionModule } from "@/lib/utils/permissions-new"

const DELETED_PROVIDER_ON_FILE_AUDIT_FILTERS = ["action__EQ__Delete__AND"]

export default function ProvidersOnFilePage() {
  const [deletedAuditOpen, setDeletedAuditOpen] = useState(false)
  const table = useProvidersOnFileTable()

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 border border-[#037ECC]/20">
              <Contact className="h-8 w-8 text-[#037ECC]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-transparent">
                Providers on File
              </h1>
              <p className="text-slate-600 mt-1">Manage other providers involved with your clients</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={() => setDeletedAuditOpen(true)}
              className="gap-2 flex items-center px-4"
              aria-label="View deleted provider on file audit logs"
              title="View deleted provider on file audit logs"
            >
              <Settings className="w-4 h-4" />
              Logs
            </Button>

            <CreateGate module={PermissionModule.PROVIDER_ON_FILE}>
              <Button variant="primary" onClick={table.openCreateModal} className="gap-2 flex items-center">
                <Plus className="w-4 h-4" />
                New Provider
              </Button>
            </CreateGate>
          </div>
        </div>

        <ProvidersOnFileTable table={table} />
      </div>

      <AuditLogsModal
        open={deletedAuditOpen}
        onOpenChange={setDeletedAuditOpen}
        entityName="ProviderOnFile"
        title="Deleted Provider on File Audit Logs"
        filters={DELETED_PROVIDER_ON_FILE_AUDIT_FILTERS}
      />
    </div>
  )
}
