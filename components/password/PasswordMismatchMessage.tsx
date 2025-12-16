import { AlertCircle } from "lucide-react"
import { motion } from "framer-motion"

export function PasswordMismatchMessage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="
        mt-2 flex items-center gap-3
        rounded-lg px-3 py-2
        bg-red-500/5 dark:bg-red-500/10
        border border-red-500/20
        text-xs text-red-600 dark:text-red-400
      "
    >
      {/* ICON */}
      <div
        className="
          flex h-6 w-6 items-center justify-center
          rounded-full
          bg-red-500/15
        "
      >
        <AlertCircle className="h-4 w-4" />
      </div>

      {/* TEXT */}
      <span className="leading-tight">
        Passwords do not match
      </span>
    </motion.div>
  )
}
