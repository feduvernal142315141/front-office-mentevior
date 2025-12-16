"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/store/session.store"
import { Loader2 } from "lucide-react"

export default function HomePage() {
  const { isAuthenticated } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard")
    } else {
      router.push("/login")
    }
  }, [isAuthenticated, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}
