"use client"

import { useEffect } from "react"
import { PersonalInformationForm } from "./PersonalInformationForm"
import { PersonalInformationSkeleton } from "./PersonalInformationSkeleton"
import { useClientById } from "@/lib/modules/clients/hooks/use-client-by-id"
import { AlertCircle } from "lucide-react"

interface PersonalInformationOverviewProps {
  isActive: boolean
  clientId: string
}

export function PersonalInformationOverview({
  isActive,
  clientId,
}: PersonalInformationOverviewProps) {
  const { client, isLoading } = useClientById(clientId)

  if (isLoading) {
    return <PersonalInformationSkeleton />
  }

  if (!client) {
    return (
      <div className="p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Client Not Found</h3>
        <p className="text-gray-600">The requested client could not be found.</p>
      </div>
    )
  }

  return <PersonalInformationForm client={client} />
}
