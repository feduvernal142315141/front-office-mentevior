"use client"

import { useEffect, useState } from "react"
import { AlertCircle, Building2, Shield, Sparkles } from "lucide-react"
import { motion } from "framer-motion"
import { DEFAULT_BASE_DOMAIN, getBaseDomain } from "@/lib/modules/auth/hooks/use-company-slug"
import { cn } from "@/lib/utils"

type Tone = "info" | "error"

interface CompanyAccessNoticeProps {
  title: string
  description: string
  tone?: Tone
}

interface AccessUrls {
  /** Formato esperado, armado con el dominio donde realmente corre la app. */
  format: { host: string; path: string }
  /** URL que el usuario tiene ahora mismo en el navegador. */
  current: string | null
}

/** El puerto importa en local (`empresa.localhost:3000`), en prod no aparece. */
function resolveAccessUrls(): AccessUrls {
  const { hostname, port, origin, pathname } = window.location
  const baseDomain = getBaseDomain(hostname) ?? DEFAULT_BASE_DOMAIN
  const suffix = port ? `${baseDomain}:${port}` : baseDomain

  return {
    format: { host: suffix, path: "/login" },
    current: `${origin}${pathname}`.replace(/^https?:\/\//, ""),
  }
}

const STEPS = [
  {
    title: "Contact your administrator",
    body: "to get your organization's unique access URL",
  },
  {
    title: "Navigate to the URL",
    body: "provided by your organization",
  },
  {
    title: "Sign in",
    body: "with your company credentials",
  },
] as const

export function CompanyAccessNotice({
  title,
  description,
  tone = "info",
}: CompanyAccessNoticeProps) {
  const [urls, setUrls] = useState<AccessUrls | null>(null)

  useEffect(() => {
    setUrls(resolveAccessUrls())
  }, [])

  const isError = tone === "error"
  const Icon = isError ? AlertCircle : Building2

  return (
    <div className="relative min-h-screen login-background overflow-hidden">
      {/* Ambient background */}
      <div
        className="pointer-events-none absolute left-[15%] top-[18%] h-[520px] w-[520px] rounded-full opacity-80"
        style={{
          background: "radial-gradient(circle, oklch(0.65 0.12 240 / 0.1), transparent 65%)",
          animation: "breathe 25s ease-in-out infinite",
        }}
      />
      <div
        className="pointer-events-none absolute bottom-[12%] right-[10%] h-[420px] w-[420px] rounded-full opacity-60"
        style={{
          background: "radial-gradient(circle, oklch(0.72 0.1 220 / 0.08), transparent 70%)",
          animation: "breathe 30s ease-in-out infinite reverse",
        }}
      />

      {/* Slightly below true center for a more balanced, premium feel */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-5 pb-16 pt-[10vh] sm:px-8 sm:pt-[12vh]">
        <div className="mx-auto w-full max-w-xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "rounded-[28px] border border-white/60 bg-white/75 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.1)] backdrop-blur-2xl",
              "sm:p-10 lg:p-12",
            )}
          >
            {/* Icon */}
            <motion.div
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.12, duration: 0.45 }}
              className="mb-7 flex justify-center"
            >
              <div className="relative">
                <div
                  className={cn(
                    "absolute inset-0 rounded-2xl blur-2xl",
                    isError ? "bg-red-500/25" : "bg-[#037ECC]/25",
                  )}
                />
                <div
                  className={cn(
                    "relative flex h-[72px] w-[72px] items-center justify-center rounded-2xl shadow-lg",
                    isError
                      ? "bg-gradient-to-br from-red-500 to-red-600"
                      : "bg-gradient-to-br from-[#037ECC] to-[#079CFB]",
                  )}
                >
                  <Icon className="h-9 w-9 text-white" strokeWidth={1.75} />
                </div>
              </div>
            </motion.div>

            {/* Title & description */}
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.45 }}
              className={cn(
                "mb-3 text-[28px] font-bold tracking-tight sm:text-[32px]",
                isError
                  ? "text-slate-900"
                  : "bg-gradient-to-r from-[#037ECC] via-[#079CFB] to-[#5AC8FA] bg-clip-text text-transparent",
              )}
            >
              {title}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.28, duration: 0.45 }}
              className="mx-auto mb-8 max-w-md text-[15px] leading-relaxed text-slate-600 sm:text-[16px]"
            >
              {description}
            </motion.p>

            {/* URL format card */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.36, duration: 0.45 }}
              className="mb-8 rounded-2xl border border-[#037ECC]/15 bg-gradient-to-b from-[#037ECC]/[0.06] to-[#079CFB]/[0.04] p-5 sm:p-6"
            >
              <div className="mx-auto flex max-w-md flex-col items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 shadow-sm ring-1 ring-[#037ECC]/10">
                  <Sparkles className="h-4 w-4 text-[#037ECC]" />
                </div>
                <h3 className="text-sm font-semibold tracking-wide text-slate-800">
                  Your Access URL Format
                </h3>

                {urls ? (
                  <>
                    <div className="w-full rounded-xl border border-white/80 bg-white/90 px-4 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                      <p className="break-all font-mono text-[13px] leading-relaxed text-[#037ECC] sm:text-[14px]">
                        <span className="font-semibold text-[#025a96]">your-company</span>
                        .{urls.format.host}
                        {urls.format.path}
                      </p>
                    </div>

                    {urls.current && (
                      <p className="text-[12px] leading-relaxed text-slate-500 sm:text-[13px]">
                        You are currently at{" "}
                        <span className="font-mono text-slate-700">{urls.current}</span>
                      </p>
                    )}
                  </>
                ) : (
                  <div className="h-12 w-full max-w-sm animate-pulse rounded-xl bg-white/60" />
                )}
              </div>
            </motion.div>

            {/* Steps */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.44, duration: 0.45 }}
              className="mx-auto mb-8 max-w-md space-y-3.5 text-left"
            >
              {STEPS.map((step, index) => (
                <div
                  key={step.title}
                  className="flex items-start gap-3.5 rounded-xl border border-slate-200/60 bg-white/50 px-4 py-3"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#037ECC] to-[#079CFB] text-xs font-bold text-white shadow-sm">
                    {index + 1}
                  </div>
                  <p className="pt-0.5 text-[14px] leading-snug text-slate-700">
                    <span className="font-semibold text-slate-900">{step.title}</span>{" "}
                    {step.body}
                  </p>
                </div>
              ))}
            </motion.div>

            {/* Footer badge */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.52, duration: 0.45 }}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/60 px-4 py-2 text-[13px] text-slate-500"
            >
              <Shield className="h-3.5 w-3.5 text-[#037ECC]" />
              <span>Enterprise-grade security &amp; HIPAA compliant</span>
            </motion.div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.45 }}
            className="mt-6 text-center text-[13px] text-slate-500"
          >
            Need help? Contact your system administrator or IT support team.
          </motion.p>
        </div>
      </div>
    </div>
  )
}
