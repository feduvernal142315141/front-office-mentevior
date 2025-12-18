"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  Bell,
  Moon,
  Sun,
  LogOut,
  UserIcon,
  X,
  KeyRound,
  User,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useSession } from "@/lib/store/session.store"
import { useUi } from "@/lib/store/ui.store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

export function Topbar() {
  const [searchQuery, setSearchQuery] = useState("")
  const { user } = useAuth()
  const { logout } = useLogout()
  const { darkMode, toggleDarkMode } = useUi()
  const router = useRouter()

  const handleLogout = () => {
    logout()
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Search:", searchQuery)
  }

  const clearSearch = () => {
    setSearchQuery("")
  }

  return (
    <header className="h-16 navbar-glass top-0">
      <div className="h-full flex items-center justify-between px-6 gap-6">

        {/* SEARCH */}
        <form onSubmit={handleSearch} className="flex-1 min-w-[260px] max-w-2xl">
          {/* <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-[#9BA9B6] dark:text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search patients, appointments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-capsule text-[15px] placeholder:text-[#6B7A88] dark:placeholder:text-muted-foreground pl-12 pr-10"
            />
            <AnimatePresence>
              {searchQuery && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-accent"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </motion.button>
              )}
            </AnimatePresence>
          </div> */}
        </form>

        {/* RIGHT SIDE ACTIONS */}
        <div className="flex items-center gap-5 shrink-0">

          {/* DARK MODE */}
          {/* <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="relative h-10 w-10 rounded-full hover:bg-accent/60 transition"
          >
            <AnimatePresence mode="wait">
              {darkMode ? (
                <motion.div
                  key="sun"
                  initial={{ rotate: -180, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 180, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Sun className="h-5 w-5" />
                </motion.div>
              ) : (
                <motion.div
                  key="moon"
                  initial={{ rotate: 180, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -180, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Moon className="h-5 w-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </Button> */}

          {/* NOTIFICATIONS */}
          {/* <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="
                  flex items-center gap-3 h-10 px-3 rounded-full 
                  hover:bg-accent/60 transition group
                  max-w-[200px] overflow-hidden
                "
              >
                <Bell className="h-5 w-5 text-foreground" />
                <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-blue-500 rounded-full shadow-md border border-white dark:border-black" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 glass-card rounded-xl shadow-xl">
              <DropdownMenuLabel className="text-base font-semibold">
                Notifications
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-96 overflow-y-auto">
                <div className="p-3 text-sm hover:bg-accent/50 cursor-pointer transition-colors rounded-md mx-1">
                  <p className="font-medium">New appointment scheduled</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Alex Thompson – Tomorrow 9:00 AM
                  </p>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu> */}

          {/* USER MENU */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="
                  flex items-center gap-3 h-10 px-3 rounded-full
                  hover:bg-accent/60 transition group
                  max-w-[220px] overflow-hidden

                  outline-none
                  focus:outline-none
                  focus-visible:outline-none
                  focus-visible:ring-0
                  focus-visible:ring-offset-0
                "
              >
                {/* AVATAR */}
                <div
                  className="
                    h-9 w-9 rounded-full
                    bg-gradient-to-br from-blue-50 to-blue-100
                  
                    flex items-center justify-center
                    ring-1 ring-blue-200 
                    shadow-sm group-hover:shadow-md transition
                  "
                >
                  <span className="text-sm font-semibold text-[#025f9a]">
                    {user?.name?.charAt(0)}
                  </span>
                </div>

                <span className="hidden md:inline text-sm font-medium truncate">
                  {user?.name}
                </span>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" asChild>
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="
                  w-64 rounded-xl p-2
                  bg-background/80 backdrop-blur-xl
                  border border-border/40
                  shadow-[0_24px_48px_rgba(0,0,0,0.14)]
                "
              >
                <>
                  {/* HEADER */}
                  <DropdownMenuLabel className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="
                        h-10 w-10 rounded-full
                        bg-gradient-to-br from-blue-100 to-blue-200

                        flex items-center justify-center
                        font-semibold text-[#025f9a]
                        shadow-sm
                      ">
                        {user?.name?.charAt(0)}
                      </div>

                      <div className="leading-tight">
                        <p className="font-semibold text-sm">{user?.name}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[160px]">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator />

                  {/* CHANGE PASSWORD */}
                  <DropdownMenuItem
                    onClick={() => router.push("/my-profile")}
                    className="
                      group relative flex items-center gap-3
                      rounded-xl px-4 py-3 text-sm
                      cursor-pointer
                      transition-all duration-200

                      bg-white
                       hover:bg-slate-50                    
                    "
                  >
                    <User className="
                      h-4 w-4 text-muted-foreground
                      transition-all duration-200
                      group-hover:text-foreground
                      group-hover:translate-x-0.5
                    " />

                    <span>My profile</span>
                  </DropdownMenuItem>

                  <div className="h-1" />
                  <DropdownMenuItem
                    onClick={() => router.push("/change-password")}
                    className="
                      group relative flex items-center gap-3
                      rounded-xl px-4 py-3 text-sm
                      cursor-pointer
                      transition-all duration-200

                      bg-white
                      hover:bg-slate-50
                    "
                  >
                    <KeyRound className="
                      h-4 w-4 text-muted-foreground
                      transition-all duration-200
                      group-hover:text-foreground
                      group-hover:translate-x-0.5
                    " />

                    <span>Change password</span>
                  </DropdownMenuItem>

                  <div className="h-1" />


                  {/* SIGN OUT */}
                 <DropdownMenuItem
                    onClick={handleLogout}
                    className="
                      group relative flex items-center gap-3
                      rounded-xl px-4 py-3 text-sm
                      cursor-pointer
                      transition-all duration-200

                      bg-white
                      hover:bg-red-50
                      text-destructive
                    "
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>

                </>
              </motion.div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
