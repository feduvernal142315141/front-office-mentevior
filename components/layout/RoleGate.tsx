"use client"

import type { ReactNode } from "react"
import { useAuth } from "@/lib/hooks/use-auth"
import type { Role } from "@/lib/types/auth.types"

interface RoleGateProps {
  children: ReactNode
  allowedRoles: Role[]
  fallback?: ReactNode
}

export function RoleGate({ children, allowedRoles, fallback = null }: RoleGateProps) {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated || !user) {
    return <>{fallback}</>
  }

  if (!allowedRoles.includes(user.role)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
