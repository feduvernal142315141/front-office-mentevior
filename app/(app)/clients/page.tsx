"use client"

import Link from "next/link"
import { UserCog, Plus } from "lucide-react"
import { Button } from "@/components/custom/Button"
import { ClientsTable } from "./components/ClientsTable"

export default function ClientsPage() {
  return (
    <div className="min-h-screen bg-gray-50/50 p-6 pb-[300px]">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 border border-[#037ECC]/20">
              <UserCog className="h-8 w-8 text-[#037ECC]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-transparent">
                Clients
              </h1>
              <p className="text-slate-600 mt-2">
                Manage your agency's clients and their information
              </p>
            </div>
          </div>

          <Link href="/clients/create">
            <Button variant="primary" className="gap-2 flex items-center">
              <Plus className="w-4 h-4" />
              Add Client
            </Button>
          </Link>
        </div>

        <ClientsTable />
      </div>
    </div>
  )
}
