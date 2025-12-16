"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/store/session.store"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard")
    }
  }, [isAuthenticated, router])

  return <>{children}</>
}
