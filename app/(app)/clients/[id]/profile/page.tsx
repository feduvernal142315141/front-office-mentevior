"use client"

import { use } from "react"
import { useSearchParams } from "next/navigation"
import { ClientProfileWizard } from "./components/ClientProfileWizard"

interface ClientProfilePageProps {
  params: Promise<{
    id: string
  }>
}

export default function ClientProfilePage({ params }: ClientProfilePageProps) {
  const { id } = use(params)
  const searchParams = useSearchParams()
  // `?step=priorAuth` abre el wizard en ese paso: así el dashboard puede enlazar
  // a donde se atiende el pendiente y no sólo al cliente.
  const step = searchParams.get("step") ?? undefined

  return <ClientProfileWizard clientId={id} initialStepId={step} />
}
