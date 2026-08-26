"use client"

import { useEffect, useState } from "react"
import { AlertCircle, Building2, Shield, Sparkles } from "lucide-react"
import { motion } from "framer-motion"
import { DEFAULT_BASE_DOMAIN, getBaseDomain } from "@/lib/modules/auth/hooks/use-company-slug"

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

export function CompanyAccessNotice({
  title,
  description,
  tone = "info",
}: CompanyAccessNoticeProps) {
  const [urls, setUrls] = useState<AccessUrls | null>(null)

  // La URL sólo existe en el cliente: se calcula tras montar para no romper el
  // render del servidor.
  useEffect(() => {
    setUrls(resolveAccessUrls())
  }, [])

  if (!urls) return null

  const isError = tone === "error"
  const Icon = isError ? AlertCircle : Building2

  return (
    <div className="min-h-screen login-background flex items-center justify-center relative overflow-hidden">
      <div
        className="absolute left-[20%] top-[20%] w-[600px] h-[600px] rounded-full"
        style={{
          background: "radial-gradient(circle, oklch(0.65 0.12 240 / 0.08), transparent 60%)",
          animation: "breathe 25s ease-in-out infinite",
        }}
      />

      <div className="relative z-10 max-w-2xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white/70 backdrop-blur-xl rounded-[32px] p-12 lg:p-16 shadow-2xl border border-white/40"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex justify-center mb-8"
          >
            <div className="relative">
              <div
                className={
                  isError
                    ? "absolute inset-0 bg-red-500/20 rounded-full blur-2xl"
                    : "absolute inset-0 bg-blue-500/20 rounded-full blur-2xl"
                }
              />
              <div
                className={
                  isError
                    ? "relative w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center"
                    : "relative w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center"
                }
              >
                <Icon className="w-10 h-10 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className={
              isError
                ? "text-[36px] lg:text-[42px] font-bold text-center mb-4 text-gray-900"
                : "text-[36px] lg:text-[42px] font-bold text-center mb-4 bg-gradient-to-r from-[#037ECC] via-[#079CFB] to-[#5AC8FA] bg-clip-text text-transparent"
            }
            style={{ letterSpacing: "-0.02em" }}
          >
            {title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-center text-[17px] text-gray-600 mb-8 leading-relaxed"
          >
            {description}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-6 mb-8 border border-blue-200/50"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center mt-1">
                <Sparkles className="w-5 h-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 mb-2">Your Access URL Format:</h3>
                <div className="bg-white/60 rounded-lg px-4 py-3 font-mono text-[15px] text-blue-700 border border-blue-200/40 break-all">
                  <span className="font-bold text-blue-900">your-company</span>.{urls.format.host}
                  {urls.format.path}
                </div>

                {urls.current && (
                  <p className="mt-3 text-[13px] text-gray-600 break-all">
                    You are currently at{" "}
                    <span className="font-mono text-gray-800">{urls.current}</span>
                  </p>
                )}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="space-y-4 mb-8"
          >
            {[
              <>
                <span className="font-semibold">Contact your administrator</span> to get your
                organization&apos;s unique access URL
              </>,
              <>
                <span className="font-semibold">Navigate to the URL</span> provided by your
                organization
              </>,
              <>
                <span className="font-semibold">Sign in</span> with your company credentials
              </>,
            ].map((step, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-lg flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                <div className="pt-1">
                  <p className="text-gray-700 text-[15px]">{step}</p>
                </div>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="flex items-center justify-center gap-2 text-sm text-gray-500"
          >
            <Shield className="w-4 h-4 text-blue-600" />
            <span>Enterprise-grade security &amp; HIPAA compliant</span>
          </motion.div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="text-center text-sm text-gray-500 mt-8"
        >
          Need help? Contact your system administrator or IT support team.
        </motion.p>
      </div>
    </div>
  )
}
