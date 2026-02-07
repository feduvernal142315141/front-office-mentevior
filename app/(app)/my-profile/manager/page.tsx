"use client"

import { Settings, FileText, Award, Sliders } from "lucide-react"
import { Card } from "@/components/custom/Card"
import { Tabs, type TabItem } from "@/components/custom/Tabs"
import { GeneralInformationForm } from "./general-information/components/GeneralInformationForm"

export default function ManagerPage() {
  const tabs: TabItem[] = [
    {
      id: "general",
      label: "General Information",
      icon: <Settings className="w-4 h-4" />,
      content: <GeneralInformationForm />,
    },
    {
      id: "credentials",
      label: "Credentials - Signature",
      icon: <Award className="w-4 h-4" />,
      content: (
        <div className="py-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-50 mb-4">
            <Award className="w-8 h-8 text-purple-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Credentials - Signature
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Coming soon
          </p>
        </div>
      ),
    },
    {
      id: "documents",
      label: "Required Documents",
      icon: <FileText className="w-4 h-4" />,
      content: (
        <div className="py-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 mb-4">
            <FileText className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Required Documents
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Coming soon
          </p>
        </div>
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
                Profile Management
              </h1>
              <p className="text-slate-600 mt-1">
                Advanced configuration for credentials, documents, and additional information
              </p>
            </div>
          </div>
        </div>

        <Card variant="elevated" padding="none">
          <Tabs items={tabs} />
        </Card>
      </div>
    </div>
  )
}
