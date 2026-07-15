"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { usePermission } from "@/lib/hooks/use-permission"
import { PermissionModule } from "@/lib/utils/permissions-new"

export default function CreateClientPage() {
  const router = useRouter()
  const { create } = usePermission()

  useEffect(() => {
    if (!create(PermissionModule.CLIENTS)) {
      router.replace("/clients")
      return
    }
    router.replace("/clients/new/profile")
  }, [router, create])

  return null
}
