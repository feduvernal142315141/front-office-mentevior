"use client"

import { CalendarX2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ServiceLogServiceRow } from "@/lib/types/service-log.types"

interface ServiceLogServicesTableProps {
  services: ServiceLogServiceRow[]
}

/**
 * Los servicios del período, uno por fila. Siempre de sólo lectura: el backend
 * arma todo desde las session notes lockeadas.
 *
 * Una fila con `imcomplete: true` (falta la validación del caregiver o la firma
 * del provider) se pinta en rojo claro, con el mismo criterio que el PDF.
 *
 * No se usa `CustomTable` porque no hay paginación ni orden: es una tabla de
 * lectura dentro de una pantalla, no un listado.
 */
export function ServiceLogServicesTable({ services }: ServiceLogServicesTableProps) {
  if (services.length === 0) {
    return (
      <div className="py-10 text-center">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
          <CalendarX2 className="h-5 w-5" />
        </div>
        <p className="mt-3 text-sm font-semibold text-slate-700">No billable services yet</p>
        <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
          Services appear here once their session notes are locked for billing. Notes still in
          progress are not included.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] border-collapse">
        <thead>
          <tr className="border-b border-slate-200">
            <Th>Date</Th>
            <Th>Time In</Th>
            <Th>Time Out</Th>
            <Th align="right">Hours</Th>
            <Th>Units</Th>
            <Th>Place of Service</Th>
            <Th>Client/Caregiver Name</Th>
            <Th>Caregiver Signature</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {services.map((service, index) => (
            <tr
              key={service.id || `${service.date}-${service.timeIn}-${index}`}
              className={cn(
                "transition-colors",
                service.imcomplete ? "bg-red-50 hover:bg-red-100/70" : "hover:bg-slate-50/70",
              )}
            >
              <td className="whitespace-nowrap px-3 py-3 text-sm font-medium text-slate-900">
                {service.date || "—"}
              </td>
              <td className="whitespace-nowrap px-3 py-3 text-sm tabular-nums text-slate-600">
                {service.timeIn || "—"}
              </td>
              <td className="whitespace-nowrap px-3 py-3 text-sm tabular-nums text-slate-600">
                {service.timeOut || "—"}
              </td>
              <td className="whitespace-nowrap px-3 py-3 text-right text-sm font-semibold tabular-nums text-slate-900">
                {service.hours || "—"}
              </td>
              <td className="px-3 py-3 text-sm text-slate-600">{service.units || "—"}</td>
              <td className="px-3 py-3 text-sm text-slate-600">{service.placeOfService || "—"}</td>
              <td className="px-3 py-3 text-sm text-slate-600">{service.caregiverName || "—"}</td>
              <td className="px-3 py-3">
                {service.caregiverSignatureImage ? (
                  <img
                    src={service.caregiverSignatureImage}
                    alt={`Caregiver signature for ${service.date}`}
                    className="max-h-[36px] max-w-[140px] object-contain contrast-150 brightness-50"
                  />
                ) : service.caregiverValidation ? (
                  <span
                    className={cn(
                      "text-xs font-medium",
                      service.imcomplete ? "text-red-600" : "text-emerald-700",
                    )}
                  >
                    {service.caregiverValidation}
                  </span>
                ) : (
                  <span className="text-xs italic text-slate-300">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Th({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <th
      className={`px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  )
}
