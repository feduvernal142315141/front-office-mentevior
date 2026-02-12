"use client"

import { AlertTriangle, CalendarClock, ShieldAlert } from "lucide-react"
import { EXPIRING_SOON_DAYS } from "@/lib/constants/credentials.constants"

interface AlertItem {
  id: string
  show: boolean
  icon: React.ReactNode
  title: string
  description: string
  tone: string
}

interface AlertsBannerProps {
  expiredCount: number
  expiringSoonCount: number
  hasSignature: boolean
  isLoadingSignature?: boolean
}

export function AlertsBanner({
  expiredCount,
  expiringSoonCount,
  hasSignature,
  isLoadingSignature = false,
}: AlertsBannerProps) {
  const alerts: AlertItem[] = [
    {
      id: "expired",
      show: expiredCount > 0,
      icon: <ShieldAlert className="h-5 w-5 text-red-600" />,
      title: `${expiredCount} expired credential${expiredCount > 1 ? "s" : ""}`,
      description: "This user cannot sign documents until expired credentials are resolved.",
      tone: "border-red-200 bg-red-50/60",
    },
    {
      id: "soon",
      show: expiringSoonCount > 0,
      icon: <CalendarClock className="h-5 w-5 text-amber-600" />,
      title: `${expiringSoonCount} credential${expiringSoonCount > 1 ? "s are" : " is"} expiring soon`,
      description: `Expiration within ${EXPIRING_SOON_DAYS} days.`,
      tone: "border-amber-200 bg-amber-50/60",
    },
    {
      id: "signature",
      show: !hasSignature && !isLoadingSignature,
      icon: <AlertTriangle className="h-5 w-5 text-blue-700" />,
      title: "No signature on file",
      description: "Please create a digital signature to enable document signing.",
      tone: "border-blue-200 bg-blue-50/60",
    },
  ].filter((item) => item.show)

  if (alerts.length === 0) return null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {alerts.map((alert) => (
        <div key={alert.id} className={`rounded-xl border px-4 py-3 ${alert.tone}`}>
          <div className="flex items-start gap-3">
            <div className="mt-0.5">{alert.icon}</div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{alert.title}</p>
              <p className="text-xs text-slate-600 mt-1">{alert.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
