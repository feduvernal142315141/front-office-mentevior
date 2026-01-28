"use client"

import { FileCheck } from "lucide-react"
import { AgreementsTable } from "./components/AgreementsTable"

export default function AgreementsPage() {
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 border border-[#037ECC]/20">
            <FileCheck className="h-8 w-8 text-[#037ECC]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-transparent">
              Agreements
            </h1>
            <p className="text-slate-600 mt-1">Manage agreements and contracts</p>
          </div>
        </div>

        <AgreementsTable />
      </div>
    </div>
  )
}
