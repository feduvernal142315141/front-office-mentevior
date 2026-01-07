"use client"

import { FileSignature } from "lucide-react"

export default function SignaturesCaregiverPage() {
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

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <div className="max-w-4xl mx-auto text-center py-12">
            <div className="w-fit p-4 rounded-2xl bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 border border-[#037ECC]/20 mx-auto mb-6">
              <FileSignature className="h-16 w-16 text-[#037ECC]" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              Caregiver Signature Management
            </h2>
            <p className="text-slate-600 leading-relaxed mb-8">
              Streamline the signature collection process for caregivers. Review pending documents, 
              collect digital signatures, and maintain a complete audit trail of all signed documents.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                <h3 className="font-semibold text-slate-800 mb-2">Digital Signatures</h3>
                <p className="text-sm text-slate-600">
                  Secure digital signature capture with full legal compliance
                </p>
              </div>
              <div className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                <h3 className="font-semibold text-slate-800 mb-2">Audit Trail</h3>
                <p className="text-sm text-slate-600">
                  Complete tracking of who signed what and when
                </p>
              </div>
              <div className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                <h3 className="font-semibold text-slate-800 mb-2">Document Review</h3>
                <p className="text-sm text-slate-600">
                  Easy review and approval workflow for caregivers
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-gradient-to-br from-[#037ECC]/5 to-[#079CFB]/5 rounded-2xl border border-[#037ECC]/10 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Coming Soon</h3>
          <p className="text-slate-600 leading-relaxed">
            This module is currently under development. Soon you'll be able to manage all caregiver signature workflows from this centralized hub.
          </p>
        </div>
      </div>
    </div>
  )
}
