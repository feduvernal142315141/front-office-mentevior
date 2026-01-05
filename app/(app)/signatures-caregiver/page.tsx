"use client"

import { FileSignature, CheckSquare, PenTool } from "lucide-react"
import Link from "next/link"

export default function SignaturesCaregiverPage() {
  const subModules = [
    {
      title: "Check Signatures",
      description: "Review and verify caregiver signatures",
      href: "/signatures-caregiver/check",
      icon: CheckSquare,
    },
    {
      title: "Sign Signatures",
      description: "Sign pending documents as caregiver",
      href: "/signatures-caregiver/sign",
      icon: PenTool,
    },
  ]

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 border border-[#037ECC]/20">
            <FileSignature className="h-8 w-8 text-[#037ECC]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-transparent">
              Signatures Caregiver
            </h1>
            <p className="text-slate-600 mt-1">Manage caregiver signatures and approvals</p>
          </div>
        </div>

        {/* Sub-modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          {subModules.map((module) => {
            const IconComponent = module.icon
            return (
              <Link
                key={module.href}
                href={module.href}
                className="group block"
              >
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 transition-all duration-200 hover:shadow-lg hover:border-[#037ECC]/30 hover:-translate-y-1 min-h-[240px] flex flex-col">
                  <div className="w-fit p-3 rounded-xl bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 border border-[#037ECC]/20 mb-4">
                    <IconComponent className="h-8 w-8 text-[#037ECC]" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-3 group-hover:text-[#037ECC] transition-colors">
                    {module.title}
                  </h3>
                  <p className="text-slate-600 flex-1 leading-relaxed">
                    {module.description}
                  </p>
                  <div className="mt-4 flex items-center text-sm font-medium text-[#037ECC] group-hover:translate-x-1 transition-transform pt-3 border-t border-slate-100">
                    Open →
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Info Card */}
        <div className="mt-8 bg-gradient-to-br from-[#037ECC]/5 to-[#079CFB]/5 rounded-2xl border border-[#037ECC]/10 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-2">About Caregiver Signatures</h3>
          <p className="text-slate-600 leading-relaxed">
            Streamline the signature collection process for caregivers. Review pending documents, 
            collect digital signatures, and maintain a complete audit trail of all signed documents.
          </p>
        </div>
      </div>
    </div>
  )
}
