import { CheckCircle2, ClipboardCheck, XCircle } from "lucide-react"
import type { SupervisionAppointment } from "@/lib/types/monthly-supervision.types"

interface MonthlySupervisionRequirementsTableProps {
  totalHoursWorked: number
  supervisedHours: number
  appointments: SupervisionAppointment[]
}

export function MonthlySupervisionRequirementsTable({
  totalHoursWorked,
  supervisedHours,
  appointments,
}: MonthlySupervisionRequirementsTableProps) {
  const supervisedPercentage =
    totalHoursWorked > 0 ? (supervisedHours * 100) / totalHoursWorked : 0
  // Manual and automatic entries use the same requirement rules. A contact is
  // face-to-face only when its selected mode says so, and a direct observation
  // requires the explicit "Observed with client" answer.
  const contacts = appointments.filter((appointment) => appointment.mode === "Face-to-Face").length
  const observations = appointments.filter((appointment) => appointment.observedWithClient === true).length

  const requirements = [
    {
      requirement: "At least 5% of total hours worked must be supervised.",
      value: `${formatNumber(supervisedPercentage)}%`,
      met: supervisedPercentage >= 5,
    },
    {
      requirement: "At least 2 face-to-face contacts per month.",
      value: String(contacts),
      met: contacts >= 2,
    },
    {
      requirement: "At least 1 direct observation with client.",
      value: String(observations),
      met: observations >= 1,
    },
  ]

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#037ECC]/10 text-[#037ECC]">
          <ClipboardCheck className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Monthly Requirements</h3>
          <p className="text-xs text-slate-400">Supervision requirements for this month</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead className="bg-[#E6F0EF] text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3 font-semibold">Requirement</th>
              <th className="w-32 px-5 py-3 font-semibold">Value</th>
              <th className="w-28 px-5 py-3 text-center font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {requirements.map((item) => (
              <tr key={item.requirement} className="border-t border-slate-200 text-slate-800">
                <td className="px-5 py-2.5">{item.requirement}</td>
                <td className="px-5 py-2.5 font-medium">{item.value}</td>
                <td className="px-5 py-2.5 text-center">
                  {item.met ? (
                    <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-500" aria-label="Met" />
                  ) : (
                    <XCircle className="mx-auto h-5 w-5 text-red-400" aria-label="Not Met" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function formatNumber(value: number): string {
  return value.toLocaleString("en-US", {
    maximumFractionDigits: 2,
  })
}
