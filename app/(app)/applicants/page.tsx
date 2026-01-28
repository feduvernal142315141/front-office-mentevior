"use client"

import { UserPlus } from "lucide-react"
import { ApplicantsTable } from "./components/ApplicantsTable"

export default function ApplicantsPage() {
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 border border-[#037ECC]/20">
            <UserPlus className="h-8 w-8 text-[#037ECC]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-transparent">
              Applicants
            </h1>
            <p className="text-slate-600 mt-1">Manage job applicants and recruitment</p>
          </div>
        </div>

        <ApplicantsTable />
      </div>
    </div>
  )
}
