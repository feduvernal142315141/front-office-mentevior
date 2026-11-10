"use client"

import Link from "next/link"
import { UserCog, Plus } from "lucide-react"
import { Button } from "@/components/custom/Button"
import { ClientsTable } from "./components/ClientsTable"
import { PermissionGate } from "@/components/layout/PermissionGate"
import { PermissionModule, PermissionAction } from "@/lib/utils/permissions-new"

export default function ClientsPage() {
  return (
    <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6 pb-28 sm:pb-[300px]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-start sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 border border-[#037ECC]/20">
              <UserCog className="h-8 w-8 text-[#037ECC]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-transparent">
                Clients
              </h1>
              <p className="text-slate-600 mt-2">
                Manage your agency's clients and their information
              </p>
            </div>
          </div>

          <PermissionGate module={PermissionModule.CLIENTS} action={PermissionAction.CREATE}>
            <Link href="/clients/create">
              <Button variant="primary" className="gap-2 flex items-center w-full sm:w-auto">
                <Plus className="w-4 h-4" />
                Add Client
              </Button>
            </Link>
          </PermissionGate>
        </div>

        <ClientsTable />
      </div>
    </div>
  )
}
