"use client"

import { useEffect, useMemo, useState } from "react"
import { Sheet, MapPinned, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useClientServicePlanConfiguration } from "../../service-plan/hooks/useClientServicePlanConfiguration"
import { useTypeEventCatalog } from "@/lib/modules/service-plans/hooks/use-type-event-catalog"
import { getClientServicePlanCategoryItems } from "@/lib/modules/client-service-plan/services/client-service-plan.service"
import { getClientCategoryDataCollection } from "@/lib/modules/client-service-plan/services/client-data-collection.service"
import type { ClientServicePlanCategoryMappedItem } from "@/lib/types/client-service-plan.types"
import type { DataCollectionConfig } from "@/lib/types/data-collection.types"
import { FrequencyDatasheet } from "./datasheets/FrequencyDatasheet"
import { PercentageDatasheet } from "./datasheets/PercentageDatasheet"
import { OnsiteCollectionGrid } from "./datasheets/OnsiteCollectionGrid"

type CollectionMode = "datasheets" | "onsite"

interface DataCollectionContentProps {
  clientServicePlanId: string
}

const MODE_OPTIONS = [
  {
    id: "datasheets" as CollectionMode,
    label: "Datasheets",
    description: "Monthly tabular data entry with charts",
    icon: Sheet,
  },
  {
    id: "onsite" as CollectionMode,
    label: "On-site Collection",
    description: "Real-time session counters",
    icon: MapPinned,
  },
]

export function DataCollectionContent({ clientServicePlanId }: DataCollectionContentProps) {
  const [mode, setMode] = useState<CollectionMode | null>(null)

  if (!mode) {
    return <ModeSelector onSelect={setMode} />
  }

  return (
    <DataCollectionView
      clientServicePlanId={clientServicePlanId}
      mode={mode}
      onBack={() => setMode(null)}
    />
  )
}

// ─── Mode Selector ───────────────────────────────────────────────────────────

function ModeSelector({ onSelect }: { onSelect: (mode: CollectionMode) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">Data Collection</h2>
        <p className="text-sm text-slate-500 mt-1">Select how you want to collect behavioral data</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {MODE_OPTIONS.map((option) => {
          const Icon = option.icon
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              className="group text-left bg-white rounded-2xl border border-slate-200 shadow-sm p-6 transition-all duration-200 hover:shadow-lg hover:border-[#037ECC]/30 hover:-translate-y-1"
            >
              <div className="w-fit p-3 rounded-xl bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 border border-[#037ECC]/20 mb-4">
                <Icon className="h-6 w-6 text-[#037ECC]" />
              </div>
              <h3 className="text-base font-semibold text-slate-800 mb-1 group-hover:text-[#037ECC] transition-colors">
                {option.label}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">{option.description}</p>
              <div className="mt-4 flex items-center text-sm font-medium text-[#037ECC] group-hover:translate-x-1 transition-transform pt-3 border-t border-slate-100">
                Select →
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Data Collection View (Categories + Items) ──────────────────────────────

interface DataCollectionViewProps {
  clientServicePlanId: string
  mode: CollectionMode
  onBack: () => void
}

function DataCollectionView({ clientServicePlanId, mode, onBack }: DataCollectionViewProps) {
  const {
    categories,
    activeCategoryId,
    activeCategory,
    isLoading,
    setActiveCategoryId,
  } = useClientServicePlanConfiguration(clientServicePlanId)

  const { itemsMap: typeEventMap } = useTypeEventCatalog()

  const [items, setItems] = useState<ClientServicePlanCategoryMappedItem[]>([])
  const [activeItemId, setActiveItemId] = useState<string | null>(null)
  const [isLoadingItems, setIsLoadingItems] = useState(false)
  const [categoryTypeId, setCategoryTypeId] = useState<string | null>(null)
  const [dcConfig, setDcConfig] = useState<DataCollectionConfig | null>(null)

  const categoryTypeName = useMemo(() => {
    if (!categoryTypeId) return null
    return typeEventMap.get(categoryTypeId)?.name ?? null
  }, [categoryTypeId, typeEventMap])

  // Load items when active category changes
  useEffect(() => {
    if (!activeCategoryId) {
      setItems([])
      setActiveItemId(null)
      setCategoryTypeId(null)
      setDcConfig(null)
      return
    }

    let active = true
    setIsLoadingItems(true)

    void (async () => {
      try {
        const [itemsData, dcConfig] = await Promise.all([
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
        setCategoryTypeId(typeof dcConfig?.type === "string" && dcConfig.type.length > 0 ? dcConfig.type : null)
        setDcConfig(dcConfig)
      } catch {
        if (active) setItems([])
      } finally {
        if (active) setIsLoadingItems(false)
      }
    })()

    return () => { active = false }
  }, [activeCategoryId])

  const activeItem = useMemo(
    () => items.find((i) => i.id === activeItemId) ?? null,
    [items, activeItemId]
  )

  const modeConfig = MODE_OPTIONS.find((o) => o.id === mode)!
  const ModeIcon = modeConfig.icon

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-7 w-7 animate-spin text-[#037ECC]" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header with back + mode label */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-slate-500 hover:text-[#037ECC] transition-colors font-medium"
          >
            ← Back
          </button>
          <div className="h-5 w-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10">
              <ModeIcon className="h-4 w-4 text-[#037ECC]" />
            </div>
            <span className="text-sm font-semibold text-slate-700">{modeConfig.label}</span>
          </div>
        </div>
      </div>

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

      {/* Content — varies by mode */}
      {mode === "onsite" ? (
        /* On-site: Card grid for all items */
        <>
          {categoryTypeName && (
            <span className="text-sm text-slate-500">{categoryTypeName}</span>
          )}
          {isLoadingItems ? (
            <div className="flex items-center gap-2 py-8 justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              <span className="text-sm text-slate-400">Loading items...</span>
            </div>
          ) : (
            <OnsiteCollectionGrid items={items} categoryTypeName={categoryTypeName} categoryId={activeCategory?.categoryId ?? ""} />
          )}
        </>
      ) : (
        /* Datasheets: Item tabs + single item content */
        <>
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
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-800">{activeItem.itemName}</h3>
                  {activeItem.description && (
                    <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{activeItem.description}</p>
                  )}
                </div>
                {categoryTypeName ? (
                  <span className="shrink-0 inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-slate-700">
                    {categoryTypeName}
                  </span>
                ) : (
                  <span className="shrink-0 inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-sm font-medium text-amber-600">
                    No type configured
                  </span>
                )}
              </div>

              {/* Collection UI — varies by type */}
              {categoryTypeName === "Frequency" ? (
                <FrequencyDatasheet activeItem={activeItem} categoryTypeName={categoryTypeName} dcConfig={dcConfig} />
              ) : categoryTypeName === "Percentage of Opportunities" ? (
                <PercentageDatasheet activeItem={activeItem} categoryTypeName={categoryTypeName} dcConfig={dcConfig} />
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 bg-gradient-to-br from-slate-50/80 to-white px-6 py-12 text-center">
                  <div className="inline-flex p-3 rounded-full bg-slate-100 mb-3">
                    <ModeIcon className="h-8 w-8 text-slate-400" />
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
            </div>
          )}
        </>
      )}
    </div>
  )
}
