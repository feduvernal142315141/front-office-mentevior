"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  BarChart3, Building2, CalendarRange, CheckCircle2, ClipboardList,
  FileDown, Loader2, Target, User,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/custom/Button"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { FloatingTextarea } from "@/components/custom/FloatingTextarea"
import { FormBottomBar } from "@/components/custom/FormBottomBar"
import { DocumentViewer } from "@/components/custom/DocumentViewer"
import { useClientsByLoggedUser } from "@/lib/modules/clients/hooks/use-clients-by-logged-user"
import {
  useClientServicePlanItems,
  type ClinicalMonthlyFormCategory,
} from "@/lib/modules/clinical-monthly/hooks/use-client-service-plan-items"
import { useClinicalMonthlyById } from "@/lib/modules/clinical-monthly/hooks/use-clinical-monthly-by-id"
import { useSaveClinicalMonthly } from "@/lib/modules/clinical-monthly/hooks/use-save-clinical-monthly"
import { getClinicalMonthlyPdfUrl } from "@/lib/modules/clinical-monthly/services/clinical-monthly.service"
import { validateMonthRange } from "@/lib/modules/clinical-monthly/utils/month-range"
import type { ClinicalMonthlyItemInput } from "@/lib/types/clinical-monthly.types"
import { cn } from "@/lib/utils"
import { MonthYearPicker } from "./MonthYearPicker"

interface ItemTexts {
  monthlyDataProgress: string
  commentsProcedureChange: string
}

interface ClinicalMonthlyFormProps {
  /** Presente al editar un reporte existente */
  clinicalMonthlyId?: string
}

const EMPTY_TEXTS: ItemTexts = { monthlyDataProgress: "", commentsProcedureChange: "" }

export function ClinicalMonthlyForm({ clinicalMonthlyId }: ClinicalMonthlyFormProps) {
  const router = useRouter()
  const isEditing = !!clinicalMonthlyId

  const [clientId, setClientId] = useState("")
  const [startMonthYear, setStartMonthYear] = useState("")
  const [endMonthYear, setEndMonthYear] = useState("")
  const [texts, setTexts] = useState<Record<string, ItemTexts>>({})
  const [rangeError, setRangeError] = useState<string | null>(null)
  const [previewId, setPreviewId] = useState<string | null>(null)

  // Se fija una vez: el listado de años no debería cambiar mientras el form vive
  const [currentYear] = useState(() => new Date().getFullYear())

  const { clients, isLoading: clientsLoading } = useClientsByLoggedUser({ page: 0, pageSize: 200 })
  const { clinicalMonthly, isLoading: detailLoading } = useClinicalMonthlyById(clinicalMonthlyId)
  const { categories, isLoading: itemsLoading, error: itemsError } = useClientServicePlanItems(clientId)
  const { save, isSaving } = useSaveClinicalMonthly({ clinicalMonthlyId })

  const clientOptions = useMemo(
    () => clients.filter((c) => c.fullName).map((c) => ({ value: c.id, label: c.fullName })),
    [clients],
  )

  const totalItems = useMemo(
    () => categories.reduce((sum, category) => sum + category.items.length, 0),
    [categories],
  )

  const completedItems = useMemo(
    () => categories.reduce((sum, category) => sum + category.items.filter((item) => {
      const value = texts[item.id]
      return !!value && (!!value.monthlyDataProgress.trim() || !!value.commentsProcedureChange.trim())
    }).length, 0),
    [categories, texts],
  )

  // Precarga al editar. La estructura sale igual del Service Plan del cliente
  // (que es la fuente de verdad de qué items se pueden enviar); del detalle sólo
  // se toman los textos ya guardados.
  useEffect(() => {
    if (!clinicalMonthly) return

    setClientId(clinicalMonthly.clientId)
    setStartMonthYear(clinicalMonthly.startMonthYear)
    setEndMonthYear(clinicalMonthly.endMonthYear)

    const saved: Record<string, ItemTexts> = {}
    for (const category of clinicalMonthly.categories ?? []) {
      for (const item of category.items ?? []) {
        saved[item.clientServicePlanCategoryItemId] = {
          monthlyDataProgress: item.monthlyDataProgress ?? "",
          commentsProcedureChange: item.commentsProcedureChange ?? "",
        }
      }
    }
    setTexts(saved)
  }, [clinicalMonthly])

  const updateText = useCallback((itemId: string, field: keyof ItemTexts, value: string) => {
    setTexts((prev) => ({
      ...prev,
      [itemId]: { ...(prev[itemId] ?? EMPTY_TEXTS), [field]: value },
    }))
  }, [])

  const handleClientChange = useCallback((value: string) => {
    setClientId(value)
    // Los items pertenecen al Service Plan del cliente: al cambiarlo, los textos
    // anteriores apuntarían a items de otro plan y el backend los rechazaría.
    setTexts({})
  }, [])

  /** Sólo se envían los items con algún texto: el PUT borra los que no vengan */
  const buildItems = useCallback((): ClinicalMonthlyItemInput[] => {
    const items: ClinicalMonthlyItemInput[] = []

    for (const category of categories) {
      for (const item of category.items) {
        const value = texts[item.id]
        if (!value) continue

        const monthlyDataProgress = value.monthlyDataProgress.trim()
        const commentsProcedureChange = value.commentsProcedureChange.trim()
        if (!monthlyDataProgress && !commentsProcedureChange) continue

        items.push({
          clientServicePlanCategoryItemId: item.id,
          monthlyDataProgress,
          commentsProcedureChange,
        })
      }
    }

    return items
  }, [categories, texts])

  const persist = useCallback(async (): Promise<string | null> => {
    if (!clientId) {
      toast.error("Select a client first")
      return null
    }

    const error = validateMonthRange(startMonthYear, endMonthYear)
    setRangeError(error)
    if (error) {
      toast.error("Check the report range", { description: error })
      return null
    }

    return save({ clientId, startMonthYear, endMonthYear, items: buildItems() })
  }, [buildItems, clientId, endMonthYear, save, startMonthYear])

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault()
    const id = await persist()
    if (!id) return
    toast.success(isEditing ? "Clinical Monthly updated" : "Clinical Monthly created")
    router.push("/clinical-monthly")
  }, [isEditing, persist, router])

  // Ya no existe un preview que no persista: generar el PDF exige que el
  // registro exista, así que previsualizar guarda primero.
  const handlePreview = useCallback(async () => {
    const id = await persist()
    if (id) setPreviewId(id)
  }, [persist])

  const isBusy = isSaving || detailLoading
  const hasItems = categories.length > 0

  if (isEditing && detailLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[#037ECC] animate-spin" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pb-32">
      {/* ─── Preview: exige guardar antes, el PDF sale de un registro existente ─── */}
      <div className="flex justify-end">
        <Button
          type="button"
          variant="secondary"
          onClick={handlePreview}
          disabled={isBusy || !clientId || !hasItems}
          className="gap-2 flex items-center"
        >
          <FileDown className="h-4 w-4" />
          Save &amp; Preview PDF
        </Button>
      </div>

      {/* ─── Context Header: Recipient + Provider ─── */}
      {clinicalMonthly && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <User className="h-4 w-4 text-[#037ECC]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Recipient</span>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
              <div><span className="text-slate-400">Name:</span> <span className="font-medium text-slate-800">{clinicalMonthly.recipientName || clinicalMonthly.clientName}</span></div>
              <div><span className="text-slate-400">Payer:</span> <span className="font-medium text-slate-800">{clinicalMonthly.payer || "—"}</span></div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="h-4 w-4 text-[#037ECC]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Provider</span>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
              <div><span className="text-slate-400">Name:</span> <span className="font-medium text-slate-800">{clinicalMonthly.providerName || "—"}</span></div>
              <div><span className="text-slate-400">Period:</span> <span className="font-medium text-slate-800 tabular-nums">{clinicalMonthly.startMonthYear} – {clinicalMonthly.endMonthYear}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Report Setup ─── */}
      <Section
        icon={<ClipboardList className="h-4 w-4" />}
        title="Report Setup"
        subtitle="Client and reporting period"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <FloatingSelect
            label="Client"
            value={clientId}
            onChange={handleClientChange}
            options={clientOptions}
            disabled={clientsLoading || isEditing}
            hasError={!clientId && !!rangeError}
            searchable
            required
          />
          <MonthYearPicker
            label="Start"
            value={startMonthYear}
            onChange={(v) => { setStartMonthYear(v); setRangeError(null) }}
            currentYear={currentYear}
            hasError={!!rangeError}
          />
          <MonthYearPicker
            label="End"
            value={endMonthYear}
            onChange={(v) => { setEndMonthYear(v); setRangeError(null) }}
            currentYear={currentYear}
            hasError={!!rangeError}
          />
        </div>

        {rangeError && (
          <p className="mt-3 text-xs font-medium text-red-500">{rangeError}</p>
        )}
        {isEditing && (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
            <CalendarRange className="h-3.5 w-3.5" />
            The client cannot be changed on an existing report.
          </p>
        )}
      </Section>

      {/* ─── Monthly Progress ─── */}
      {!clientId && (
        <EmptyState
          icon={<Target className="h-5 w-5" />}
          title="No client selected"
          description="Pick a client to load their service plan items."
        />
      )}

      {clientId && itemsLoading && (
        <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm py-16">
          <Loader2 className="w-6 h-6 text-[#037ECC] animate-spin" />
        </div>
      )}

      {clientId && !itemsLoading && itemsError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
          <p className="text-sm font-medium text-red-600">Failed to load service plan items</p>
          <p className="mt-1 text-xs text-red-500">{itemsError.message}</p>
        </div>
      )}

      {clientId && !itemsLoading && !itemsError && !hasItems && (
        <EmptyState
          icon={<Target className="h-5 w-5" />}
          title="Nothing to report on"
          description="This client has no service plan items yet."
        />
      )}

      {clientId && !itemsLoading && hasItems && (
        <Section
          icon={<Target className="h-4 w-4" />}
          title="Monthly Progress"
          subtitle={`${completedItems} of ${totalItems} items filled`}
        >
          <div className="space-y-4">
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                texts={texts}
                onTextChange={updateText}
                disabled={isBusy}
              />
            ))}
          </div>
        </Section>
      )}

      <FormBottomBar
        isSubmitting={isSaving}
        onCancel={() => router.push("/clinical-monthly")}
        submitText={isEditing ? "Update Clinical Monthly" : "Create Clinical Monthly"}
        disabled={!clientId || isBusy}
      />

      {previewId && (
        <DocumentViewer
          open
          onClose={() => setPreviewId(null)}
          documentUrl={getClinicalMonthlyPdfUrl(previewId)}
          fileName="Clinical Monthly.pdf"
        />
      )}
    </form>
  )
}

function Section({ icon, title, subtitle, children }: {
  icon: React.ReactNode
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2.5 px-5 py-3 border-b border-slate-100">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#037ECC]/10 text-[#037ECC]">{icon}</div>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {subtitle && <span className="text-xs text-slate-400">{subtitle}</span>}
        </div>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  )
}

function CategoryCard({ category, texts, onTextChange, disabled }: {
  category: ClinicalMonthlyFormCategory
  texts: Record<string, ItemTexts>
  onTextChange: (itemId: string, field: keyof ItemTexts, value: string) => void
  disabled?: boolean
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-white border-b border-slate-100">
        <BarChart3 className="h-3.5 w-3.5 text-[#037ECC]" />
        <span className="text-xs font-semibold text-slate-800 flex-1">{category.name}</span>
        <span className="inline-flex items-center justify-center rounded-full bg-[#037ECC]/10 text-[#037ECC] text-[10px] font-bold h-5 min-w-[20px] px-1.5">
          {category.items.length}
        </span>
      </div>
      <div className="divide-y divide-slate-100">
        {category.items.map((item) => {
          const value = texts[item.id] ?? EMPTY_TEXTS
          const isFilled = !!value.monthlyDataProgress.trim() || !!value.commentsProcedureChange.trim()

          return (
            <div
              key={item.id}
              className={cn(
                "px-4 py-3.5 space-y-3 transition-colors",
                isFilled && "bg-[#037ECC]/[0.03] border-l-2 border-l-[#037ECC]",
              )}
            >
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <span className={cn(
                    "text-sm font-medium block",
                    isFilled ? "text-[#037ECC]" : "text-slate-700",
                  )}>
                    {item.name}
                  </span>
                  {item.description && (
                    <span className="mt-0.5 block text-[11px] text-slate-400">{item.description}</span>
                  )}
                </div>
                {isFilled && <CheckCircle2 className="h-4 w-4 shrink-0 text-[#037ECC]" />}
              </div>

              <FloatingTextarea
                label="Monthly Data Progress"
                value={value.monthlyDataProgress}
                onChange={(v) => onTextChange(item.id, "monthlyDataProgress", v)}
                onBlur={() => {}}
                rows={3}
                disabled={disabled}
              />
              <FloatingTextarea
                label="Comments / Procedure Change"
                value={value.commentsProcedureChange}
                onChange={(v) => onTextChange(item.id, "commentsProcedureChange", v)}
                onBlur={() => {}}
                rows={3}
                disabled={disabled}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function EmptyState({ icon, title, description }: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm px-5 py-12">
      <div className="text-center">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#037ECC]/10 text-[#037ECC]">
          {icon}
        </div>
        <p className="mt-3 text-sm font-semibold text-slate-800">{title}</p>
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      </div>
    </div>
  )
}
