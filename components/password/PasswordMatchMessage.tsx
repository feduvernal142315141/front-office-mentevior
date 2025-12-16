import { CheckCircle2 } from "lucide-react"
import { motion } from "framer-motion"

export function PasswordMatchMessage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="
        mt-2 flex items-center gap-3
        rounded-lg px-3 py-2
        bg-green-500/5 dark:bg-green-500/10
        border border-green-500/20
        text-xs text-green-700 dark:text-green-400
      "
    >
      <div
        className="
          flex h-6 w-6 items-center justify-center
          rounded-full bg-green-500/15
        "
      >
        <CheckCircle2 className="h-4 w-4" />
      </div>

      <span className="leading-tight">
        Passwords match
      </span>
    </motion.div>
  )
}
