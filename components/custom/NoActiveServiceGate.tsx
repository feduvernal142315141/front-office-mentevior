"use client"

import Link from "next/link"
import { HeartPulse, ArrowRight, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface NoActiveServiceGateProps {
  isLoading: boolean
  hasActiveService: boolean | null
  children: React.ReactNode
  moduleName?: string
}

export function NoActiveServiceGate({
  isLoading,
  hasActiveService,
  children,
  moduleName = "this module",
}: NoActiveServiceGateProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#037ECC] animate-spin" />
          <p className="text-sm text-slate-500">Checking service configuration...</p>
        </div>
      </div>
    )
  }

  if (hasActiveService === false) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400/60 rounded-t-2xl" />

        <div className="relative px-8 py-12 flex flex-col items-center text-center gap-6">
          <div className="relative">
            <div className="absolute inset-0 bg-amber-300/10 rounded-full blur-2xl scale-150" />
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 border border-[#037ECC]/20 flex items-center justify-center">
              <HeartPulse className="w-10 h-10 text-[#037ECC]" />
            </div>
          </div>

          <div className="space-y-3 max-w-md">
            <h3 className="text-xl font-semibold text-amber-600">
              No active services yet
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              To configure {moduleName}, your company must have at least one active service.
              Activate a service to define which credentials and billing codes are available for your organization.
            </p>
          </div>

          <div
            className={cn(
              "w-full max-w-sm rounded-xl border border-slate-200 bg-slate-50 px-5 py-4",
              "flex items-start gap-3 text-left"
            )}
          >
            <div className="mt-0.5 w-5 h-5 rounded-full bg-amber-100 border border-amber-300/60 flex items-center justify-center flex-shrink-0">
              <span className="text-amber-600 text-xs font-bold leading-none">!</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              All credentials and billing codes associated with activated services are
              managed automatically and cannot be modified independently.
            </p>
          </div>

          <Link
            href="/my-company/services"
            className={cn(
              "group inline-flex items-center gap-2.5 px-6 py-3 rounded-xl",
              "bg-gradient-to-r from-[#037ECC] to-[#079CFB]",
              "text-white text-sm font-semibold",
              "shadow-[0_4px_18px_rgba(3,126,204,0.35)]",
              "hover:shadow-[0_6px_24px_rgba(3,126,204,0.45)]",
              "hover:-translate-y-0.5",
              "active:translate-y-0 active:shadow-[0_2px_10px_rgba(3,126,204,0.3)]",
              "transition-all duration-200 ease-out"
            )}
          >
            <HeartPulse className="w-4 h-4" />
            Go to Services
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
          </Link>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
