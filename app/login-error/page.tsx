"use client"

import { AlertCircle, ArrowLeft, Building2, Mail } from "lucide-react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"

export default function LoginErrorPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen login-background flex items-center justify-center relative overflow-hidden">
      <div
        className="absolute left-[20%] top-[20%] w-[600px] h-[600px] rounded-full"
        style={{
          background: "radial-gradient(circle, oklch(0.65 0.12 240 / 0.08), transparent 60%)",
          animation: "breathe 25s ease-in-out infinite",
        }}
      />

      <div className="relative z-10 max-w-xl mx-auto px-6">
  
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white/70 backdrop-blur-xl rounded-[32px] p-12 lg:p-14 shadow-2xl border border-white/40"
        >
    
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex justify-center mb-8"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-red-500/20 rounded-full blur-2xl" />
              <div className="relative w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-[32px] lg:text-[36px] font-bold text-center mb-4 text-gray-900"
            style={{ letterSpacing: "-0.02em" }}
          >
            Access Not Available
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-center text-[16px] text-gray-600 mb-8 leading-relaxed"
          >
            Your session has expired or you don't have a valid company URL saved. Please access the platform through your organization's specific login URL.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-6 mb-8 border border-blue-200/50"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center mt-1">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Expected URL Format:</h3>
                <div className="bg-white/60 rounded-lg px-4 py-3 font-mono text-[14px] text-blue-700 border border-blue-200/40 break-all">
                  frontoffice-mentevior.vercel.app/<span className="font-bold text-blue-900">your-company</span>/login
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="space-y-3"
          >
            <button
              onClick={() => router.back()}
              className="w-full h-[52px] bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl font-semibold text-[15px] hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Go Back
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white/60 text-gray-500">or</span>
              </div>
            </div>

            <a
              href="mailto:support@mentevior.com?subject=Help accessing my account"
              className="w-full h-[52px] bg-white border border-gray-300 text-gray-700 rounded-2xl font-semibold text-[15px] hover:border-gray-400 hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Mail className="w-5 h-5" />
              Contact Support
            </a>
          </motion.div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="text-center text-sm text-gray-500 mt-8"
        >
          Need help? Contact your system administrator or IT support team.
        </motion.p>
      </div>
    </div>
  )
}
