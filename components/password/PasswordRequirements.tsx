import { CheckCircle2, XCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface Props {
  show: boolean
  rules: {
    hasMinLength: boolean
    hasUpperCase: boolean
    hasLowerCase: boolean
    hasNumber: boolean
    hasSymbol: boolean
  }
}

export function PasswordRequirements({ show, rules }: Props) {
  if (!show) return null

  const items = [
    { label: "At least 8 characters", valid: rules.hasMinLength },
    { label: "Uppercase letter", valid: rules.hasUpperCase },
    { label: "Lowercase letter", valid: rules.hasLowerCase },
    { label: "Number", valid: rules.hasNumber },
    { label: "Special character", valid: rules.hasSymbol },
  ]

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="
            mt-3 rounded-2xl p-4
            bg-white/70
            backdrop-blur-xl
            border border-gray-200/70
            shadow-[0_12px_30px_rgba(2,6,23,0.08)]
          "
        >
          <p
            className="
              mb-3 text-xs font-semibold tracking-wide
              text-gray-600 
            "
          >
            Password must contain
          </p>

          <div className="space-y-2">
            {items.map((req, i) => (
              <div
                key={i}
                className="flex items-center gap-3"
              >
                {/* ICON */}
                <div
                  className={`
                    flex h-6 w-6 items-center justify-center
                    rounded-full
                    ${
                      req.valid
                        ? "bg-green-500/15 text-green-600"
                        : "bg-gray-200/60 text-gray-400 "
                    }
                  `}
                >
                  {req.valid ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                </div>

                {/* LABEL */}
                <span
                  className={`
                    text-sm
                    ${
                      req.valid
                        ? "text-green-700 font-medium"
                        : "text-gray-500"
                    }
                  `}
                >
                  {req.label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
