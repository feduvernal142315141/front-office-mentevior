"use client"

import { use, useState, useCallback } from "react"
import { 
  User, 
  MapPin, 
  Users, 
  Pill, 
  Stethoscope, 
  Activity, 
  Shield, 
  FileCheck, 
  UserCog,
  FileText,
  UserSquare2
} from "lucide-react"
import { Card } from "@/components/custom/Card"
import { Tabs, type TabItem } from "@/components/custom/Tabs"
import { PersonalInformationOverview } from "../components/PersonalInformationOverview"

interface ClientProfilePageProps {
  params: Promise<{
    id: string
  }>
}

export default function ClientProfilePage({ params }: ClientProfilePageProps) {
  const { id } = use(params)
  const [activeTab, setActiveTab] = useState("personal")
  const [documentsAlertCount, setDocumentsAlertCount] = useState(0)

  const handleDocumentsAlertChange = useCallback((count: number) => {
    setDocumentsAlertCount(count)
  }, [])

  const tabs: TabItem[] = [
    {
      id: "personal",
      label: "Personal Information",
      icon: <User className="w-4 h-4" />,
      content: (
        <PersonalInformationOverview
          isActive={activeTab === "personal"}
          clientId={id}
        />
      ),
    },
    {
      id: "addresses",
      label: "Addresses",
      icon: <MapPin className="w-4 h-4" />,
      content: (
        <div className="p-8 text-center text-slate-500">
          <MapPin className="w-12 h-12 mx-auto mb-3 text-slate-400" />
          <p className="font-medium">Addresses</p>
          <p className="text-sm mt-1">Coming soon - SCRUM-124</p>
        </div>
      ),
    },
    {
      id: "caregivers",
      label: "Caregivers",
      icon: <Users className="w-4 h-4" />,
      content: (
        <div className="p-8 text-center text-slate-500">
          <Users className="w-12 h-12 mx-auto mb-3 text-slate-400" />
          <p className="font-medium">Caregivers</p>
          <p className="text-sm mt-1">Coming soon - SCRUM-125</p>
        </div>
      ),
    },
    {
      id: "medications",
      label: "Medications",
      icon: <Pill className="w-4 h-4" />,
      content: (
        <div className="p-8 text-center text-slate-500">
          <Pill className="w-12 h-12 mx-auto mb-3 text-slate-400" />
          <p className="font-medium">Medications</p>
          <p className="text-sm mt-1">Coming soon - SCRUM-132</p>
        </div>
      ),
    },
    {
      id: "physicians",
      label: "Physicians",
      icon: <Stethoscope className="w-4 h-4" />,
      content: (
        <div className="p-8 text-center text-slate-500">
          <Stethoscope className="w-12 h-12 mx-auto mb-3 text-slate-400" />
          <p className="font-medium">Physicians</p>
          <p className="text-sm mt-1">Coming soon - SCRUM-126</p>
        </div>
      ),
    },
    {
      id: "diagnoses",
      label: "Diagnoses",
      icon: <Activity className="w-4 h-4" />,
      content: (
        <div className="p-8 text-center text-slate-500">
          <Activity className="w-12 h-12 mx-auto mb-3 text-slate-400" />
          <p className="font-medium">Diagnoses</p>
          <p className="text-sm mt-1">Coming soon - SCRUM-127</p>
        </div>
      ),
    },
    {
      id: "insurances",
      label: "Insurances",
      icon: <Shield className="w-4 h-4" />,
      content: (
        <div className="p-8 text-center text-slate-500">
          <Shield className="w-12 h-12 mx-auto mb-3 text-slate-400" />
          <p className="font-medium">Insurances</p>
          <p className="text-sm mt-1">Coming soon - SCRUM-128</p>
        </div>
      ),
    },
    {
      id: "prior-auth",
      label: "Prior Authorizations",
      icon: <FileCheck className="w-4 h-4" />,
      content: (
        <div className="p-8 text-center text-slate-500">
          <FileCheck className="w-12 h-12 mx-auto mb-3 text-slate-400" />
          <p className="font-medium">Prior Authorizations</p>
          <p className="text-sm mt-1">Coming soon - SCRUM-48</p>
        </div>
      ),
    },
    {
      id: "providers",
      label: "Providers",
      icon: <UserCog className="w-4 h-4" />,
      content: (
        <div className="p-8 text-center text-slate-500">
          <UserCog className="w-12 h-12 mx-auto mb-3 text-slate-400" />
          <p className="font-medium">Providers</p>
          <p className="text-sm mt-1">Coming soon - SCRUM-129</p>
        </div>
      ),
    },
    {
      id: "documents",
      label: "Required Documents",
      icon: <FileText className="w-4 h-4" />,
      badge: documentsAlertCount > 0 ? documentsAlertCount : undefined,
      content: (
        <div className="p-8 text-center text-slate-500">
          <FileText className="w-12 h-12 mx-auto mb-3 text-slate-400" />
          <p className="font-medium">Required Documents</p>
          <p className="text-sm mt-1">Coming soon - SCRUM-130</p>
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
              <UserSquare2 className="h-8 w-8 text-[#037ECC]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-transparent">
                Client Profile
              </h1>
              <p className="text-slate-600 mt-1">
                Complete client information, insurances, authorizations, and clinical data
              </p>
            </div>
          </div>
        </div>

        <Card variant="elevated" padding="none">
          <Tabs items={tabs} defaultTab="personal" onChange={setActiveTab} />
        </Card>
      </div>
    </div>
  )
}
