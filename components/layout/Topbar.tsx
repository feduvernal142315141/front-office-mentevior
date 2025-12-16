"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from 'next/navigation'
import { Search, Bell, Moon, Sun, LogOut, UserIcon, X } from 'lucide-react'
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

export function Topbar() {
  const [searchQuery, setSearchQuery] = useState("")
  const { user, logout } = useSession()
  const { darkMode, toggleDarkMode } = useUi()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Search:", searchQuery)
  }

  const clearSearch = () => {
    setSearchQuery("")
  }

  return (
   <header className="h-16 navbar-glass sticky top-0 z-40">
  <div className="h-full flex items-center justify-between px-6 gap-6">

    {/* SEARCH */}
    <form onSubmit={handleSearch} className="flex-1 min-w-[260px] max-w-2xl">
      <div className="relative">
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
      </div>
    </form>

    {/* RIGHT SIDE ACTIONS */}
    <div className="flex items-center gap-5 shrink-0">

  {/* DARK MODE */}
  <Button
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
  </Button>

  {/* NOTIFICATIONS */}
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button
  variant="ghost"
  className="
    flex items-center gap-3 h-10 px-3 rounded-full 
    hover:bg-accent/60 transition group
    max-w-[200px] overflow-hidden

    !outline-none focus-visible:!outline-none focus-visible:!ring-0
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
  </DropdownMenu>

  {/* USER MENU PREMIUM */}
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button
        variant="ghost"
        className="
          flex items-center gap-3 h-10 px-3 rounded-full 
          hover:bg-accent/60 transition group
          max-w-[200px] overflow-hidden
        "
      >
        {/* AVATAR PREMIUM */}
        <div
          className="
            h-9 w-9 rounded-full bg-gradient-to-br 
            from-blue-50 to-blue-100 dark:from-[#037ECC]/10 dark:to-[#037ECC]/20
            flex items-center justify-center
            ring-1 ring-blue-200 dark:ring-[#037ECC]/30
            shadow-sm group-hover:shadow-md transition
          "
        >
          <span className="text-sm font-semibold text-[#025f9a] dark:text-primary">
            {user?.name.charAt(0)}
          </span>
        </div>

        {/* NOMBRE ELEGANTE */}
        <span className="hidden md:inline text-sm font-medium text-foreground truncate">
          {user?.name}
        </span>
      </Button>
    </DropdownMenuTrigger>

    <DropdownMenuContent
      align="end"
      className="
        w-64 glass-card rounded-xl shadow-xl p-2
        border border-border/40
      "
    >
      <DropdownMenuLabel className="pb-2">
        <div>
          <p className="font-semibold text-[15px]">{user?.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{user?.email}</p>
        </div>
      </DropdownMenuLabel>

      <DropdownMenuSeparator />

      <DropdownMenuItem
        onClick={() => router.push("/settings")}
        className="cursor-pointer text-[14px] py-2"
      >
        <UserIcon className="mr-2 h-4 w-4" />
        Profile
      </DropdownMenuItem>

      <DropdownMenuItem
        onClick={handleLogout}
        className="cursor-pointer text-[14px] text-destructive py-2"
      >
        <LogOut className="mr-2 h-4 w-4" />
        Sign out
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</div>

  </div>
</header>

  )
}
