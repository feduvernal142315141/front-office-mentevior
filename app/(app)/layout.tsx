import type React from "react"

import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import ShellLayout from "./ShellLayout"

export default async function AppLayout({ children }: { children: React.ReactNode }) {

  const cookieStore = await cookies()
  const token = cookieStore.get("mv_fo_token")?.value

  if (!token) {
    redirect("/login")
  }


  return <ShellLayout>{children}</ShellLayout>
}
