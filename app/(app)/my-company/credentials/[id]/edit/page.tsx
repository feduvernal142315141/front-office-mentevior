"use client"

import { Award } from "lucide-react"
import { Card } from "@/components/custom/Card"
import { CredentialForm } from "../../components/CredentialForm"
import { use } from "react"

interface EditCredentialPageProps {
  params: Promise<{ id: string }>
}

export default function EditCredentialPage({ params }: EditCredentialPageProps) {
  const { id } = use(params)

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 border border-[#037ECC]/20">
            <Award className="h-8 w-8 text-[#037ECC]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-transparent">
              Edit Credential
            </h1>
            <p className="text-slate-600 mt-1">Update credential information</p>
          </div>
        </div>
        
        <Card variant="elevated" padding="lg">
          <CredentialForm credentialId={id} />
        </Card>
      </div>
    </div>
  )
}
