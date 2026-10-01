"use client"

import { useState, useRef } from "react"
import { Plus, Award, Settings } from "lucide-react"
import { Button } from "@/components/custom/Button"
import { AuditLogsModal } from "@/components/custom/AuditLogsModal"
import { CredentialsTable, type CredentialsTableRef } from "./components/CredentialsTable"
import { CredentialDrawer } from "./components/CredentialDrawer"
import { NoActiveServiceGate } from "@/components/custom/NoActiveServiceGate"
import { useHasActiveService } from "@/lib/modules/services/hooks/use-has-active-service"
import { CreateGate } from "@/components/layout/PermissionGate"
import { PermissionModule } from "@/lib/utils/permissions-new"

const DELETED_CREDENTIAL_AUDIT_FILTERS = ["action__EQ__Delete__AND"]

export default function CredentialsPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [deletedAuditOpen, setDeletedAuditOpen] = useState(false)
  const tableRef = useRef<CredentialsTableRef>(null)
  const { hasActiveService, isLoading } = useHasActiveService()

  const handleSuccess = () => {
    setIsDrawerOpen(false)
    tableRef.current?.refetch()
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 border border-[#037ECC]/20">
              <Award className="h-8 w-8 text-[#037ECC]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-transparent">
                Credentials
              </h1>
              <p className="text-slate-600 mt-1">Manage credentials for your organization</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={() => setDeletedAuditOpen(true)}
              className="gap-2 flex items-center px-4"
              aria-label="View deleted credential audit logs"
              title="View deleted credential audit logs"
            >
              <Settings className="w-4 h-4" />
              Logs
            </Button>

            {hasActiveService && (
              <CreateGate module={PermissionModule.ACCOUNT_PROFILE}>
              <Button
                variant="primary"
                onClick={() => setIsDrawerOpen(true)}
                className="gap-2 flex items-center"
              >
                <Plus className="w-4 h-4" />
                Add Credential
              </Button>
              </CreateGate>
            )}
          </div>
        </div>

        <NoActiveServiceGate
          isLoading={isLoading}
          hasActiveService={hasActiveService}
          moduleName="credentials"
        >
          <CredentialsTable ref={tableRef} />

          <CredentialDrawer
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            onSuccess={handleSuccess}
          />
        </NoActiveServiceGate>
      </div>

      <AuditLogsModal
        open={deletedAuditOpen}
        onOpenChange={setDeletedAuditOpen}
        entityName="Credential"
        title="Deleted Credential Audit Logs"
        filters={DELETED_CREDENTIAL_AUDIT_FILTERS}
      />
    </div>
  )
}
