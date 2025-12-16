"use client"

import type { ReactNode } from "react"
import { useSession } from "@/lib/store/session.store"
import type { Role } from "@/lib/types/domain"

interface RoleGateProps {
  children: ReactNode
  allowedRoles: Role[]
  fallback?: ReactNode
}

export function RoleGate({ children, allowedRoles, fallback = null }: RoleGateProps) {
  const { user, isAuthenticated } = useSession()

  if (!isAuthenticated || !user) {
    return <>{fallback}</>
  }

  if (!allowedRoles.includes(user.role)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
