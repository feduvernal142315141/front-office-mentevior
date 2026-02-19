"use client"

import { use, useState, useCallback } from "react"
import { Settings, FileText, Award, Sliders } from "lucide-react"
import { Card } from "@/components/custom/Card"
import { Tabs, type TabItem } from "@/components/custom/Tabs"
import { GeneralInformationForm } from "@/app/(app)/my-profile/manager/general-information/components/GeneralInformationForm"
import { CredentialsSignatureOverview } from "@/app/(app)/my-profile/manager/credentials-signature/components/CredentialsSignatureOverview"
import { RequiredDocumentsOverview } from "@/app/(app)/my-profile/manager/required-documents/components/RequiredDocumentsOverview"
import { useAuth } from "@/lib/hooks/use-auth"

interface UserManagerPageProps {
  params: Promise<{
    id: string
  }>
}

export default function UserManagerPage({ params }: UserManagerPageProps) {
  const { id } = use(params)
  const { requiredOptions } = useAuth()
  const [activeTab, setActiveTab] = useState("general")
  const [documentsAlertCount, setDocumentsAlertCount] = useState(0)

  const handleDocumentsAlertChange = useCallback((count: number) => {
    setDocumentsAlertCount(count)
  }, [])

  const tabs: TabItem[] = [
    {
      id: "general",
      label: "General Information",
      icon: <Settings className="w-4 h-4" />,
      content: (
        <GeneralInformationForm
          memberUserId={id}
          onCancelRoute={`/users/${id}/edit`}
          onSuccessRoute={`/users/${id}/edit`}
        />
      ),
    },
    ...(requiredOptions.credentialsSignature
      ? [
          {
            id: "credentials",
            label: "Credentials - Signature",
            icon: <Award className="w-4 h-4" />,
            content: (
              <CredentialsSignatureOverview
                isActive={activeTab === "credentials"}
                memberUserId={id}
              />
            ),
          },
        ]
      : []),
    {
      id: "documents",
      label: "Required Documents",
      icon: <FileText className="w-4 h-4" />,
      badge: documentsAlertCount > 0 ? documentsAlertCount : undefined,
      content: (
        <RequiredDocumentsOverview
          isActive={activeTab === "documents"}
          memberUserId={id}
          onAlertCountChange={handleDocumentsAlertChange}
        />
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 border border-[#037ECC]/20">
              <Sliders className="h-8 w-8 text-[#037ECC]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-transparent">
                User Management
              </h1>
              <p className="text-slate-600 mt-1">
                Advanced configuration for credentials, documents, and additional information
              </p>
            </div>
          </div>
        </div>

        <Card variant="elevated" padding="none">
          <Tabs items={tabs} defaultTab="general" onChange={setActiveTab} />
        </Card>
      </div>
    </div>
  )
}
