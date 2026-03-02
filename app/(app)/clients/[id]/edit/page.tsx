"use client"

import { use, useEffect } from "react"
import { useRouter } from "next/navigation"

interface EditClientPageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditClientPage({ params }: EditClientPageProps) {
  const { id } = use(params)
  const router = useRouter()

  useEffect(() => {
    router.replace(`/clients/${id}/profile`)
  }, [id, router])

  return null
}
