"use client"

import { Shield, Users, Calendar, Sparkles } from "lucide-react"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"

const MOTIVATIONAL_PHRASES = [
  "Empower your team",
  "Streamline your sessions",
  "Transform patient care",
  "Coordinate with confidence",
]

export function BrandSection() {
  const [motivationalPhrase, setMotivationalPhrase] = useState(MOTIVATIONAL_PHRASES[0])

  useEffect(() => {
    const interval = setInterval(() => {
      setMotivationalPhrase((prev) => {
        const currentIndex = MOTIVATIONAL_PHRASES.indexOf(prev)
        return MOTIVATIONAL_PHRASES[(currentIndex + 1) % MOTIVATIONAL_PHRASES.length]
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="hidden lg:flex lg:w-[60%] 2xl:w-[55%] relative overflow-hidden">
      <div
        className="absolute inset-0 bg-gradient-to-br from-white/40 via-[var(--color-login-brand-gradient-start)] to-white/60"
        style={{ opacity: 0.6 }}
      />

      <div
        className="absolute left-[20%] top-[20%] w-[600px] h-[600px] rounded-full"
        style={{
          background: "radial-gradient(circle, oklch(0.65 0.12 240 / 0.08), transparent 60%)",
          animation: "breathe 25s ease-in-out infinite",
        }}
      />

      <div
        className="
          relative z-10 flex flex-col justify-center
          px-16 xl:px-24
          2xl:pl-40 2xl:pr-28
          py-16
          max-w-[720px] 2xl:max-w-[760px]
        "
      >
        <div className="mb-12 2xl:mb-8 animate-in fade-in duration-700">
          <div className="flex items-center">
            
              <Image
                src="/logoMenteVior.png"
                alt="MenteVior logo"
                width={150}
                height={150}
                priority
                className="object-contain"
              />
        

            <div>
              <h1
                className="text-[30px] font-bold bg-gradient-to-r from-[#037ECC] via-[#079CFB] to-[#5AC8FA] bg-clip-text text-transparent"
                style={{ letterSpacing: "-0.005em" }}
              >
                MenteVior
              </h1>

              <AnimatePresence mode="wait">
                <motion.p
                  key={motivationalPhrase}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.42 }}
                  className="text-sm text-muted-foreground flex items-center gap-2 mt-1"
                >
                  <Sparkles className="h-3.5 w-3.5 text-accent" />
                  {motivationalPhrase}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
        </div>

        <h2 className="text-[44px] xl:text-[48px] 2xl:text-[48px] font-bold leading-tight mb-6 text-balance animate-in fade-in slide-in-from-left-4 duration-700 delay-150">
          Professional ABA
          <br />
          Therapy Management
        </h2>

        <p className="text-[16px] 2xl:text-[17px] leading-relaxed mb-12 max-w-[580px] animate-in fade-in slide-in-from-left-4 duration-700 delay-300">
          Streamline your therapy sessions, manage patients, and coordinate your team with our HIPAA-compliant platform
          designed for excellence in Applied Behavior Analysis.
        </p>

        <div className="flex flex-col gap-6 max-w-md">
          <TrustItem
            icon={<Shield className="w-5 h-5" />}
            title="HIPAA Compliant & Secure"
            description="Your patient data is encrypted and protected with enterprise-grade security"
          />
          <TrustItem
            icon={<Users className="w-5 h-5" />}
            title="Role-Based Access Control"
            description="Granular permissions ensure everyone sees exactly what they need"
          />
          <TrustItem
            icon={<Calendar className="w-5 h-5" />}
            title="Real-Time Scheduling"
            description="Drag-and-drop calendar with intelligent conflict detection"
          />
        </div>
      </div>
    </div>
  )
}

function TrustItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-4 animate-in fade-in slide-in-from-left-3 duration-500">
      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600">
        {icon}
      </div>
      <div className="flex-1 pt-0.5">
        <h3 className="text-[15px] font-semibold mb-1">{title}</h3>
        <p className="text-[14px] text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  )
}
