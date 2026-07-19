"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Sheet, Loader2, AlertTriangle, Maximize2, Minimize2, X, FileDown } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useClientServicePlanConfiguration } from "../../service-plan/hooks/useClientServicePlanConfiguration"
import { useTypeEventCatalog } from "@/lib/modules/service-plans/hooks/use-type-event-catalog"
import { getClientServicePlanCategoryItems } from "@/lib/modules/client-service-plan/services/client-service-plan.service"
import { getClientCategoryDataCollection, getClientItemDataCollection } from "@/lib/modules/client-service-plan/services/client-data-collection.service"
import type { ClientServicePlanCategoryMappedItem } from "@/lib/types/client-service-plan.types"
import type { DataCollectionConfig } from "@/lib/types/data-collection.types"
import { FrequencyDatasheet } from "./datasheets/FrequencyDatasheet"
import { PercentageDatasheet } from "./datasheets/PercentageDatasheet"
import { RateDatasheet } from "./datasheets/RateDatasheet"
import { IntervalDatasheet } from "./datasheets/IntervalDatasheet"
import { DurationDatasheet } from "./datasheets/DurationDatasheet"
import { typeRequiresDailyAndWeekly } from "@/lib/modules/service-plans/constants/data-collection.constants"
import { Button } from "@/components/custom/Button"
import { DocumentViewer } from "@/components/custom/DocumentViewer"
import { exportElementToPdf } from "@/lib/utils/export-to-pdf"

export interface NavigateToItemRequest {
  categoryId: string
  itemId: string
  itemName: string
}

interface DataCollectionContentProps {
  clientId: string
  clientServicePlanId: string
  appointmentId?: string
  onNavigateToItem?: (request: NavigateToItemRequest) => void
}

export function DataCollectionContent({ clientId, clientServicePlanId, appointmentId, onNavigateToItem }: DataCollectionContentProps) {
  return (
    <DataCollectionView
      clientId={clientId}
      clientServicePlanId={clientServicePlanId}
      appointmentId={appointmentId}
      onNavigateToItem={onNavigateToItem}
    />
  )
}

// ─── Data Collection View (Categories + Items) ──────────────────────────────

interface DataCollectionViewProps {
  clientId: string
  clientServicePlanId: string
  appointmentId?: string
  onNavigateToItem?: (request: NavigateToItemRequest) => void
}

function DataCollectionView({ clientId, clientServicePlanId, appointmentId, onNavigateToItem }: DataCollectionViewProps) {
  const {
    categories,
    activeCategoryId,
    activeCategory,
    isLoading,
    setActiveCategoryId,
  } = useClientServicePlanConfiguration(clientServicePlanId, appointmentId)

  const { itemsMap: typeEventMap } = useTypeEventCatalog()

  const [items, setItems] = useState<ClientServicePlanCategoryMappedItem[]>([])
  const [activeItemId, setActiveItemId] = useState<string | null>(null)
  const [isLoadingItems, setIsLoadingItems] = useState(false)
  // Category-level DC config (fallback)
  const [catTypeId, setCatTypeId] = useState<string | null>(null)
  const [catDcConfig, setCatDcConfig] = useState<DataCollectionConfig | null>(null)
  // Item-level DC config (overrides category when item has custom DC)
  const [itemTypeId, setItemTypeId] = useState<string | null>(null)
  const [itemDcConfig, setItemDcConfig] = useState<DataCollectionConfig | null>(null)
  const [isLoadingItemDc, setIsLoadingItemDc] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportPdfUrl, setExportPdfUrl] = useState<string | null>(null)
  const exportRef = useRef<HTMLDivElement>(null)

  // ESC key to exit fullscreen
  useEffect(() => {
    if (!isFullscreen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullscreen(false)
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isFullscreen])

  // Lock body scroll in fullscreen
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [isFullscreen])

  // Effective type: item-level overrides category-level
  const effectiveTypeId = itemTypeId ?? catTypeId

  const categoryTypeName = useMemo(() => {
    if (!effectiveTypeId) return null
    return typeEventMap.get(effectiveTypeId)?.name ?? null
  }, [effectiveTypeId, typeEventMap])

  const categoryTypeGroup = useMemo(() => {
    if (!effectiveTypeId) return null
    return typeEventMap.get(effectiveTypeId)?.group ?? null
  }, [effectiveTypeId, typeEventMap])

  // Effective DC config: item-level overrides category-level
  const dcConfig = itemDcConfig ?? catDcConfig

  // Load items + category DC when active category changes
  useEffect(() => {
    if (!activeCategoryId) {
      setItems([])
      setActiveItemId(null)
      setCatTypeId(null)
      setCatDcConfig(null)
      setItemTypeId(null)
      setItemDcConfig(null)
      return
    }

    let active = true
    setIsLoadingItems(true)

    void (async () => {
      try {
        const [itemsData, categoryDc] = await Promise.all([
          getClientServicePlanCategoryItems(activeCategoryId),
          getClientCategoryDataCollection(activeCategoryId).catch(() => null),
        ])
        if (!active) return

        const sorted = [...itemsData].sort((a, b) => {
          const oa = a.order ?? Number.MAX_SAFE_INTEGER
          const ob = b.order ?? Number.MAX_SAFE_INTEGER
          if (oa !== ob) return oa - ob
          return a.itemName.localeCompare(b.itemName, undefined, { sensitivity: "base" })
        })

        setItems(sorted)
        setActiveItemId(sorted.length > 0 ? sorted[0].id : null)
        setCatTypeId(typeof categoryDc?.type === "string" && categoryDc.type.length > 0 ? categoryDc.type : null)
        setCatDcConfig(categoryDc)
        // Item DC will be loaded by the activeItemId effect below
      } catch {
        if (active) setItems([])
      } finally {
        if (active) setIsLoadingItems(false)
      }
    })()

    return () => { active = false }
  }, [activeCategoryId])

  // Load item-level DC config when active item changes
  useEffect(() => {
    if (!activeItemId) {
      setItemTypeId(null)
      setItemDcConfig(null)
      return
    }

    // Check if the item has inline DC with its own type
    const item = items.find((i) => i.id === activeItemId)
    const inlineType = item?.dataCollection?.typeEventCatalogId
    if (inlineType && inlineType.length > 0 && inlineType !== catTypeId) {
      // Item has a different type than category — fetch full item DC config
      let active = true
      setIsLoadingItemDc(true)

      void (async () => {
        try {
          const itemDc = await getClientItemDataCollection(activeItemId)
          if (!active) return
          if (itemDc) {
            const resolvedType = typeof itemDc.type === "string" && itemDc.type.length > 0 ? itemDc.type : null
            setItemTypeId(resolvedType)
            setItemDcConfig(itemDc)
          } else {
            setItemTypeId(null)
            setItemDcConfig(null)
          }
        } catch {
          if (active) { setItemTypeId(null); setItemDcConfig(null) }
        } finally {
          if (active) setIsLoadingItemDc(false)
        }
      })()

      return () => { active = false }
    } else {
      // Item uses same type as category — no override needed
      setItemTypeId(null)
      setItemDcConfig(null)
    }
  }, [activeItemId, items, catTypeId])

  // Snapshot of objectives before reload for mastery detection
  const prevObjectivesRef = useRef<Map<string, boolean>>(new Map())

  // Keep snapshot up to date whenever items change
  useEffect(() => {
    const map = new Map<string, boolean>()
    for (const item of items) {
      for (const obj of item.objetive ?? []) {
        map.set(obj.id, !!obj.endDate)
      }
    }
    prevObjectivesRef.current = map
  }, [items])

  // Reload items silently (without resetting activeItemId)
  const reloadItems = useCallback(async () => {
    if (!activeCategoryId) return
    try {
      const itemsData = await getClientServicePlanCategoryItems(activeCategoryId)
      const sorted = [...itemsData].sort((a, b) => {
        const oa = a.order ?? Number.MAX_SAFE_INTEGER
        const ob = b.order ?? Number.MAX_SAFE_INTEGER
        if (oa !== ob) return oa - ob
        return a.itemName.localeCompare(b.itemName, undefined, { sensitivity: "base" })
      })

      // Detect newly mastered STOs
      const prev = prevObjectivesRef.current
      for (const item of sorted) {
        for (const obj of item.objetive ?? []) {
          const wasMastered = prev.get(obj.id)
          if (obj.endDate && wasMastered === false) {
            const stoMatch = obj.name.match(/^STO#\d+/)
            const label = stoMatch ? stoMatch[0] : obj.name
            toast.success(`${label} has been mastered!`)
          }
        }
      }

      setItems(sorted)
    } catch {
      // silent — keep current items on error
    }
  }, [activeCategoryId])

  const activeItem = useMemo(
    () => items.find((i) => i.id === activeItemId) ?? null,
    [items, activeItemId]
  )

  const handleExportPdf = useCallback(async () => {
    if (!exportRef.current || isExporting) return
    setIsExporting(true)
    try {
      const itemName = activeItem?.itemName ?? "DataCollection"
      const categoryName = activeCategory?.categoryName ?? ""
      const url = await exportElementToPdf(exportRef.current, {
        fileName: `${categoryName} - ${itemName}.pdf`,
        orientation: "landscape",
      })
      setExportPdfUrl(url)
    } catch (err) {
      console.error("Export PDF error:", err)
      toast.error("Failed to generate PDF")
    } finally {
      setIsExporting(false)
    }
  }, [isExporting, activeItem, activeCategory])

  const itemHasBaseline = useMemo(() => {
    if (!activeItem) return false
    return Array.isArray(activeItem.baseline) && activeItem.baseline.length > 0
  }, [activeItem])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-7 w-7 animate-spin text-[#037ECC]" />
      </div>
    )
  }

  return (
    <div
      className={cn(
        "space-y-5",
        isFullscreen && "fixed inset-0 z-[60] bg-white overflow-y-auto px-8 py-6 pb-8",
      )}
    >
      {/* Fullscreen header bar */}
      {isFullscreen && (
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-900">Data Collection</h2>
            {activeItem && (
              <>
                <span className="text-slate-300">/</span>
                <span className="text-sm font-medium text-slate-600">{activeCategory?.categoryName}</span>
                <span className="text-slate-300">/</span>
                <span className="text-sm font-semibold text-[#037ECC]">{activeItem.itemName}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExporting}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#037ECC]/30 bg-[#037ECC]/5 text-sm font-medium text-[#037ECC] hover:bg-[#037ECC]/10 transition-colors disabled:opacity-50"
            >
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
              {isExporting ? "Exporting..." : "Export PDF"}
            </button>
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors"
            >
              <Minimize2 className="h-4 w-4" />
              Exit Fullscreen
            </button>
          </div>
        </div>
      )}

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => {
          const isActive = cat.id === activeCategoryId
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategoryId(cat.id)}
              className={cn(
                "shrink-0 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-gradient-to-r from-[#037ECC] to-[#079CFB] text-white shadow-md"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-[#037ECC]/30 hover:text-[#037ECC]"
              )}
            >
              <span className="truncate max-w-[180px]">{cat.categoryName}</span>
              <span
                className={cn(
                  "inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full text-xs font-semibold tabular-nums",
                  isActive
                    ? "bg-white/25 text-white"
                    : "bg-slate-100 text-slate-500"
                )}
              >
                {cat.totalItems}
              </span>
            </button>
          )
        })}
      </div>

      {/* Datasheets: Item tabs + single item content */}
          {/* Item Tabs */}
          {isLoadingItems ? (
            <div className="flex items-center gap-2 py-2">
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              <span className="text-sm text-slate-400">Loading items...</span>
            </div>
          ) : items.length > 0 ? (
            <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-200 scrollbar-none">
              {items.map((item) => {
                const isActive = item.id === activeItemId
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveItemId(item.id)}
                    className={cn(
                      "shrink-0 px-3 py-2.5 text-sm font-medium transition-all duration-200 border-b-2 -mb-px whitespace-nowrap",
                      isActive
                        ? "border-[#037ECC] text-[#037ECC]"
                        : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                    )}
                  >
                    {item.itemName}
                    {item.hasDataCollection && (
                      <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[#037ECC]" />
                    )}
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-6 py-8 text-center">
              <p className="text-sm text-slate-500">No items in this category</p>
            </div>
          )}

          {/* Active Item Content Area */}
          {activeItem && (
            <div ref={exportRef} className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-slate-800 whitespace-normal break-words">
                    {activeItem.itemName}
                  </h3>
                  {activeItem.description && (
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1 break-words">
                      {activeItem.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {categoryTypeName ? (
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-slate-700">
                      {categoryTypeName}
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-sm font-medium text-amber-600">
                      No type configured
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsFullscreen((v) => !v)}
                    className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-[#037ECC] hover:border-[#037ECC]/30 transition-colors"
                    title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                  >
                    {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Baseline required alert */}
              {!itemHasBaseline ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-6 py-8 text-center">
                  <div className="inline-flex p-3 rounded-full bg-amber-100 mb-3">
                    <AlertTriangle className="h-7 w-7 text-amber-500" />
                  </div>
                  <p className="text-sm font-semibold text-amber-800">
                    Baseline configuration required
                  </p>
                  <p className="text-sm text-amber-600 mt-1 max-w-md mx-auto">
                    You need to configure at least one baseline for <strong>{activeItem.itemName}</strong> before you can start collecting data.
                  </p>
                  <Button
                    type="button"
                    className="mt-4 gap-2"
                    onClick={() => {
                      if (!activeCategoryId) return
                      onNavigateToItem?.({
                        categoryId: activeCategoryId,
                        itemId: activeItem.id,
                        itemName: activeItem.itemName,
                      })
                    }}
                  >
                    Go to Service Plan and configure
                  </Button>
                </div>
              ) : (
                <>
                  {/* Collection UI — varies by type */}
                  {categoryTypeName === "Frequency/Count" || categoryTypeName === "Frequency" ? (
                    <FrequencyDatasheet clientId={clientId} activeItem={activeItem} categoryTypeName={categoryTypeName} dcConfig={dcConfig} appointmentId={appointmentId} onItemsReload={reloadItems} />
                  ) : categoryTypeName === "Rate" ? (
                    <RateDatasheet clientId={clientId} activeItem={activeItem} categoryTypeName={categoryTypeName} dcConfig={dcConfig} appointmentId={appointmentId} onItemsReload={reloadItems} />
                  ) : categoryTypeGroup === "Time-sampling" ? (
                    <IntervalDatasheet clientId={clientId} activeItem={activeItem} categoryTypeName={categoryTypeName ?? ""} dcConfig={dcConfig} appointmentId={appointmentId} onItemsReload={reloadItems} />
                  ) : categoryTypeName === "Percentage of Opportunities" ? (
                    <PercentageDatasheet clientId={clientId} activeItem={activeItem} categoryTypeName={categoryTypeName} dcConfig={dcConfig} appointmentId={appointmentId} onItemsReload={reloadItems} />
                  ) : categoryTypeName && typeRequiresDailyAndWeekly(categoryTypeName) ? (
                    <DurationDatasheet clientId={clientId} activeItem={activeItem} categoryTypeName={categoryTypeName} dcConfig={dcConfig} appointmentId={appointmentId} onItemsReload={reloadItems} />
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-gradient-to-br from-slate-50/80 to-white px-6 py-12 text-center">
                      <div className="inline-flex p-3 rounded-full bg-slate-100 mb-3">
                        <Sheet className="h-8 w-8 text-slate-400" />
                      </div>
                      <p className="text-sm font-medium text-slate-600">
                        Datasheet — {activeItem.itemName}
                      </p>
                      <p className="text-sm text-slate-500 mt-1">
                        {categoryTypeName
                          ? `Collection type: ${categoryTypeName}`
                          : "No collection type configured for this category"}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
      {/* PDF Viewer */}
      {exportPdfUrl && (
        <DocumentViewer
          open
          onClose={() => {
            URL.revokeObjectURL(exportPdfUrl)
            setExportPdfUrl(null)
          }}
          documentUrl={exportPdfUrl}
          fileName={`${activeCategory?.categoryName ?? "DataCollection"} - ${activeItem?.itemName ?? "Export"}.pdf`}
        />
      )}
    </div>
  )
}
