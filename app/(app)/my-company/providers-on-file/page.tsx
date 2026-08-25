"use client"

import { Contact, Plus } from "lucide-react"
import { Button } from "@/components/custom/Button"
import { ProvidersOnFileTable } from "./components/ProvidersOnFileTable"
import { useProvidersOnFileTable } from "./hooks/useProvidersOnFileTable"
import { CreateGate } from "@/components/layout/PermissionGate"
import { PermissionModule } from "@/lib/utils/permissions-new"

export default function ProvidersOnFilePage() {
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

          <CreateGate module={PermissionModule.PROVIDER_ON_FILE}>
            <Button variant="primary" onClick={table.openCreateModal} className="gap-2 flex items-center">
              <Plus className="w-4 h-4" />
              New Provider
            </Button>
          </CreateGate>
        </div>

        <ProvidersOnFileTable table={table} />
      </div>
    </div>
  )
}
