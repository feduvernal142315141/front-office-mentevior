"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useSession } from "@/lib/store/session.store"

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isAuthenticated && pathname !== "/login") {
      router.push("/login")
    }
  }, [isAuthenticated, pathname, router])

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
