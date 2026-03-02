"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function CreateClientPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/clients/new/profile")
  }, [router])

  return null
}
