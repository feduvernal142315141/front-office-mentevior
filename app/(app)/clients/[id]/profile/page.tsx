"use client"

import { use } from "react"
import { ClientProfileWizard } from "./components/ClientProfileWizard"

interface ClientProfilePageProps {
  params: Promise<{
    id: string
  }>
}

export default function ClientProfilePage({ params }: ClientProfilePageProps) {
  const { id } = use(params)

  return <ClientProfileWizard clientId={id} />
}
