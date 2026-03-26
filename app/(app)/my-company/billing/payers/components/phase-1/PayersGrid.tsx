"use client"

import { Pencil, Settings2 } from "lucide-react"
import { PAYER_SOURCE, type Payer, type PayerSource } from "@/lib/types/payer.types"

interface PayersGridProps {
  payers: Payer[]
  isLoading: boolean
  onEdit: (payer: Payer) => void
  onConfigurePlan: (payer: Payer) => void
}

function getSourceLabel(source: PayerSource): string {
  if (source === PAYER_SOURCE.CATALOG) return "Private Insurance"
  if (source === PAYER_SOURCE.FL_MEDICAID) return "FL Medicaid"
  return "Manual"
}

function PayerAvatar({ label }: { label: string }) {
  return (
    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#037ECC] to-[#079CFB] text-white text-sm font-bold tracking-wide flex items-center justify-center shadow-[0_10px_25px_rgba(7,156,251,0.35)]">
      {label.slice(0, 2).toUpperCase()}
    </div>
  )
}

export function PayersGrid({ payers, isLoading, onEdit, onConfigurePlan }: PayersGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={`payer-skeleton-${index}`} className="h-[180px] rounded-2xl border border-slate-200 bg-white/80 animate-pulse" />
        ))}
      </div>
    )
  }

  if (payers.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-14 text-center">
        <p className="text-lg font-semibold text-slate-700">No payers found</p>
        <p className="text-sm text-slate-500 mt-1">Create one with the Add payer button.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {payers.map((payer) => (
        <div
          key={payer.id}
          className="rounded-2xl border border-slate-200 bg-gradient-to-b from-white via-white to-slate-50 p-5 shadow-sm hover:shadow-lg hover:border-[#037ECC]/30 transition-all duration-200"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <PayerAvatar label={payer.logoUrl || payer.name} />
              <div className="min-w-0">
                <h3 className="font-semibold text-slate-800 truncate">{payer.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{getSourceLabel(payer.source)}</p>
              </div>
            </div>

            <button
              onClick={() => onConfigurePlan(payer)}
              className="h-9 w-9 rounded-lg border border-slate-200 text-slate-500 hover:text-[#037ECC] hover:border-[#037ECC]/30 hover:bg-[#037ECC]/5 transition"
              aria-label={`Configure plan for ${payer.name}`}
            >
              <Pencil className="w-4 h-4 mx-auto" />
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <div>
              <p className="text-slate-500">Allow Clearing Houses</p>
              <p className="font-semibold text-slate-700 mt-0.5">{payer.clearingHouseName || payer.planTypeName || "Not configured"}</p>
            </div>

            <button
              onClick={() => onEdit(payer)}
              className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
            >
              <Settings2 className="w-3.5 h-3.5" />
              Edit
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
