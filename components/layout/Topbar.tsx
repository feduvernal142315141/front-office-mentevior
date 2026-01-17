"use client"

import { useRouter } from "next/navigation"
import { LogOut, KeyRound, User } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/hooks/use-auth"
import { useLogout } from "@/lib/modules/auth/hooks/use-logout"
import { Breadcrumbs } from "./Breadcrumbs"
import { useUserById } from "@/lib/modules/users/hooks/use-user-by-id"

export function Topbar() {
  const { user, hydrated } = useAuth()
  const { logout } = useLogout()
  const router = useRouter()
  
  const { user: fullUser } = useUserById(user?.id || null)
  

  const handleLogout = () => {
    logout()
  }

  return (
    <header className="navbar-glass top-0">
      <div className="flex items-center justify-between px-6 gap-6 h-16 border-b border-gray-100">
        <Breadcrumbs />

        <div className="ml-auto">
          {hydrated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-3 h-10 px-3 rounded-full hover:bg-accent/60 transition group max-w-[220px] overflow-hidden outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0"
                >
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center ring-1 ring-blue-200 shadow-sm group-hover:shadow-md transition">
                    <span className="text-sm font-semibold text-[#025f9a]">
                      {user.name?.charAt(0)}
                    </span>
                  </div>
                  <span className="hidden md:inline text-sm font-medium truncate">
                    {user.name}
                  </span>
                </Button>
              </DropdownMenuTrigger>

            <DropdownMenuContent align="end" asChild>
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="w-64 rounded-xl p-2 bg-background/80 backdrop-blur-xl border border-border/40 shadow-[0_24px_48px_rgba(0,0,0,0.14)]"
              >
                <DropdownMenuLabel className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center font-semibold text-[#025f9a] shadow-sm">
                      {user.name?.charAt(0)}
                    </div>
                    <div className="leading-tight">
                      <p className="font-semibold text-sm">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[160px]">
                        {user.email}
                      </p>
        
                      {fullUser?.role?.name && (
                        <div className="mt-1.5 inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200">
                          <span className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide">
                            {fullUser.role.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => router.push("/my-profile")}
                  className="group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm cursor-pointer transition-all duration-200 bg-white hover:bg-slate-50"
                >
                  <User className="h-4 w-4 text-muted-foreground transition-all duration-200 group-hover:text-foreground group-hover:translate-x-0.5" />
                  <span>My profile</span>
                </DropdownMenuItem>

                <div className="h-1" />

                <DropdownMenuItem
                  onClick={() => router.push("/change-password")}
                  className="group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm cursor-pointer transition-all duration-200 bg-white hover:bg-slate-50"
                >
                  <KeyRound className="h-4 w-4 text-muted-foreground transition-all duration-200 group-hover:text-foreground group-hover:translate-x-0.5" />
                  <span>Change password</span>
                </DropdownMenuItem>

                <div className="h-1" />

                <DropdownMenuItem
                  onClick={handleLogout}
                  className="group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm cursor-pointer transition-all duration-200 bg-white hover:bg-red-50 text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </motion.div>
            </DropdownMenuContent>
          </DropdownMenu>
          ) : (
          
            <div className="flex items-center gap-3 h-10 px-3">
              <div className="h-9 w-9 rounded-full bg-gray-200 animate-pulse" />
              <div className="hidden md:block h-4 w-24 bg-gray-200 rounded animate-pulse" />
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
