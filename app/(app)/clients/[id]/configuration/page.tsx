"use client"

import { use } from "react"
import { useSearchParams } from "next/navigation"
import { ClientConfigurationLayout } from "./components/ClientConfigurationLayout"

interface ClientConfigurationPageProps {
  params: Promise<{ id: string }>
}

export default function ClientConfigurationPage({ params }: ClientConfigurationPageProps) {
  const { id } = use(params)
  const searchParams = useSearchParams()
  const spId = searchParams.get("spId") ?? null
  const section = searchParams.get("section") ?? undefined

  return <ClientConfigurationLayout key={id} clientId={id} clientServicePlanId={spId} initialSection={section} />
}
