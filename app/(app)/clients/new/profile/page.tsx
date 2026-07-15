"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { usePermission } from "@/lib/hooks/use-permission"
import { PermissionModule } from "@/lib/utils/permissions-new"
import { ClientProfileWizardCreate } from "./components/ClientProfileWizardCreate"

export default function CreateClientProfilePage() {
  const router = useRouter()
  const { create } = usePermission()
  const canCreate = create(PermissionModule.CLIENTS)

  useEffect(() => {
    if (!canCreate) {
      router.replace("/clients")
    }
  }, [canCreate, router])

  if (!canCreate) return null

  return <ClientProfileWizardCreate />
}
