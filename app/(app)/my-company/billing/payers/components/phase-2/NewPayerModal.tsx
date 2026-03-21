"use client"

import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import type { LucideIcon } from "lucide-react"
import { Check, Landmark, Plus, ShieldCheck, X } from "lucide-react"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTitle,
} from "@/components/ui/drawer"
import { PAYER_SOURCE, type PayerSource } from "@/lib/types/payer.types"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

interface NewPayerModalProps {
  open: boolean
  onOpenChange: (nextOpen: boolean) => void
}

interface SourceOption {
  id: PayerSource
  title: string
  description: string
  icon: LucideIcon
  benefits: string[]
  iconClasses: string
  cardClasses: string
  checkClasses: string
  recommended?: boolean
}

const SOURCE_OPTIONS: SourceOption[] = [
  {
    id: PAYER_SOURCE.CATALOG,
    title: "Catalog (Private Insurances)",
    description: "Select from the private insurance catalog and continue with prefilled payer details.",
    icon: ShieldCheck,
    benefits: [
      "Fastest setup with standardized payer naming",
      "Reduces manual entry errors on payer basics",
      "Ideal for recurring private insurance workflows",
    ],
    iconClasses: "bg-blue-600 text-white",
    cardClasses: "border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-900/10",
    checkClasses: "text-blue-600",
    recommended: true,
  },
  {
    id: PAYER_SOURCE.FL_MEDICAID,
    title: "FL Medicaid",
    description: "Use one of the fixed Florida Medicaid entries with consistent source tracking.",
    icon: Landmark,
    benefits: [
      "Uses the fixed 13-option Medicaid list",
      "Keeps payer source aligned for reporting",
      "Works with the same creation flow as catalog",
    ],
    iconClasses: "bg-emerald-600 text-white",
    cardClasses: "border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/60 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-900/10",
    checkClasses: "text-emerald-600",
  },
  {
    id: PAYER_SOURCE.MANUAL,
    title: "Manual",
    description: "Enter payer data from scratch when the payer is not represented in available catalogs.",
    icon: Plus,
    benefits: [
      "Full control over payer naming and contact data",
      "No dependency on catalog availability",
      "Best for one-off or internal billing arrangements",
    ],
    iconClasses: "bg-slate-700 text-white",
    cardClasses: "border-slate-200 bg-white hover:border-slate-300 hover:shadow-lg hover:shadow-slate-900/5",
    checkClasses: "text-slate-500",
  },
]

const SOURCE_ROUTE: Record<PayerSource, string> = {
  [PAYER_SOURCE.CATALOG]: "/my-company/billing/payers/create/catalog",
  [PAYER_SOURCE.FL_MEDICAID]: "/my-company/billing/payers/create/fl-medicaid",
  [PAYER_SOURCE.MANUAL]: "/my-company/billing/payers/create/manual",
}

export function NewPayerModal({ open, onOpenChange }: NewPayerModalProps) {
  const router = useRouter()

  const handleSourceSelect = (nextSource: PayerSource) => {
    onOpenChange(false)
    router.push(SOURCE_ROUTE[nextSource])
  }

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      direction="right"
    >
      <DrawerContent className="w-full overflow-hidden bg-white shadow-2xl sm:max-w-2xl">
        <VisuallyHidden>
          <DrawerTitle>Add payer</DrawerTitle>
        </VisuallyHidden>

        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Add payer</h2>

            <DrawerClose asChild>
              <button
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </DrawerClose>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-white px-6 py-6">
          <div className="space-y-6">
            <div>
              <p className="text-slate-600">Choose how you want to create the payer profile for your organization.</p>
            </div>

            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Select source</p>
              <div className="grid gap-4">
                {SOURCE_OPTIONS.map((item) => {
                  const Icon = item.icon

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSourceSelect(item.id)}
                      className={`group relative w-full rounded-2xl border-2 p-6 text-left transition-all duration-200 ${item.cardClasses}`}
                    >
                      <div className="flex gap-4">
                        <div
                          className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${item.iconClasses}`}
                        >
                          <Icon className="h-6 w-6" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                            {item.recommended && (
                              <Badge className="bg-blue-600 text-white hover:bg-blue-700">Recommended</Badge>
                            )}
                          </div>

                          <p className="text-sm text-slate-600">{item.description}</p>

                          <div className="mt-4 space-y-1 text-sm text-slate-700">
                            {item.benefits.map((benefit) => (
                              <div key={`${item.id}-${benefit}`} className="flex items-center gap-2">
                                <Check className={`h-4 w-4 ${item.checkClasses}`} />
                                <span>{benefit}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
