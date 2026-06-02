"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Loader2 } from "lucide-react"
import { toast } from "@/lib/compat/sonner"
import { cn } from "@/lib/utils"

import { ClientDataCollectionForm } from "./data-collection/ClientDataCollectionForm"

import {
  deleteClientCategoryLevel,
  deleteClientItemLevel,
  getClientCategoryDataCollection,
  getClientItemDataCollection,
  upsertClientCategoryDataCollection,
  upsertClientItemDataCollection,
} from "@/lib/modules/client-service-plan/services/client-data-collection.service"

import type {
  DataCollectionConfig,
  DataCollectionLevel,
  ItemDataCollectionConfig,
} from "@/lib/types/data-collection.types"
import type { ClientDataCollectionFormValues } from "@/lib/schemas/client-data-collection-form.schema"
import type { DataCollectionType } from "@/lib/types/data-collection.types"
import type { RecommendationsConfig } from "@/lib/types/client-service-plan.types"

function stripPersistedLevelIds(config: DataCollectionConfig): DataCollectionConfig {
  return {
    ...config,
    levels: config.levels.map(({ recordId: _recordId, ...level }) => level),
  }
}

const DRAWER_BASE_WIDTH_PX = 720
const DRAWER_PER_DATASET_PX = 80
const DRAWER_DATASET_BASELINE = 3

function getDrawerMaxWidthPx({
  isChartOpen,
  datasetCount,
}: {
  isChartOpen: boolean
  datasetCount: number
}): number {
  if (!isChartOpen) return DRAWER_BASE_WIDTH_PX
  const extra = Math.max(0, datasetCount - DRAWER_DATASET_BASELINE)
  return DRAWER_BASE_WIDTH_PX + extra * DRAWER_PER_DATASET_PX
}

interface ClientDataCollectionDrawerProps {
  open: boolean
  onClose: () => void
  mode: "category" | "item"
  categoryId: string
  categoryName: string
  clientServicePlanCategoryItemId?: string
  itemName?: string
  onSaved: () => void
}

export function ClientDataCollectionDrawer({
  open,
  onClose,
  mode,
  categoryId,
  categoryName,
  clientServicePlanCategoryItemId,
  itemName,
  onSaved,
}: ClientDataCollectionDrawerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [config, setConfig] = useState<DataCollectionConfig | null>(null)
  const [itemConfig, setItemConfig] = useState<ItemDataCollectionConfig | null>(null)
  const [chartLayout, setChartLayout] = useState({ datasetCount: 0, isOpen: false })

  const maxWidthPx = useMemo(
    () =>
      getDrawerMaxWidthPx({
        isChartOpen: chartLayout.isOpen,
        datasetCount: chartLayout.datasetCount,
      }),
    [chartLayout]
  )

  const loadConfig = useCallback(async () => {
    if (!open) return
    setIsLoading(true)
    try {
      if (mode === "category") {
        const data = await getClientCategoryDataCollection(categoryId)
        setConfig(data)
        setItemConfig(null)
      } else if (mode === "item" && clientServicePlanCategoryItemId) {
        const itemData = await getClientItemDataCollection(clientServicePlanCategoryItemId)
        if (itemData) {
          setItemConfig(itemData)
          setConfig(itemData)
        } else {
          const catData = await getClientCategoryDataCollection(categoryId)
          setConfig(catData ? stripPersistedLevelIds(catData) : null)
          setItemConfig(null)
        }
      }
    } catch {
      toast.error("Unable to load configuration", {
        description: "Failed to load data collection configuration.",
      })
    } finally {
      setIsLoading(false)
    }
  }, [open, mode, categoryId, clientServicePlanCategoryItemId])

  useEffect(() => {
    if (open) {
      loadConfig()
    } else {
      setConfig(null)
      setItemConfig(null)
      setChartLayout({ datasetCount: 0, isOpen: false })
    }
  }, [open, loadConfig])

  const handleDeleteLevel = async (level: DataCollectionLevel) => {
    if (!level.recordId) return
    try {
      if (mode === "item") {
        await deleteClientItemLevel(level.recordId)
      } else {
        await deleteClientCategoryLevel(level.recordId)
      }
      toast.success("Level removed")
    } catch {
      toast.error("Unable to delete level", {
        description: "Failed to delete level.",
      })
      throw new Error("Failed to delete level")
    }
  }

  const handleSave = async (values: ClientDataCollectionFormValues & { recommendations: RecommendationsConfig }) => {
    setIsSaving(true)
    try {
      const levelsPayload = (values.levels ?? []).map((l) => ({
        ...(l.recordId ? { id: l.recordId } : {}),
        label: l.label,
        description: l.description,
        value: l.value,
      }))

      const loadedBaselines = config?.baselines ?? []
      const loadedObjectives = config?.objectives ?? []

      if (mode === "category") {
        await upsertClientCategoryDataCollection({
          clientServicePlanCategoryId: categoryId,
          type: values.type as DataCollectionType,
          weeklyDailyValue: values.weeklyDailyValue,
          dailyValue: values.dailyValue,
          unitMeasurementCatalogId: values.unitMeasurementCatalogId,
          levels: levelsPayload,
          intervalLength: values.intervalLength,
          unitOfTime: values.unitOfTime,
          suggestedNumberOfRecordings: values.suggestedNumberOfRecordings,
          cumulative: values.cumulative,
          chart: values.chart,
          baselines: loadedBaselines,
          objectives: loadedObjectives,
          recommendations: values.recommendations ?? undefined,
        })
        toast.success(`Configuration applied to all items in "${categoryName}"`)
      } else if (mode === "item" && clientServicePlanCategoryItemId) {
        await upsertClientItemDataCollection({
          clientServicePlanCategoryItemId,
          name: itemName,
          type: values.type as DataCollectionType,
          weeklyDailyValue: values.weeklyDailyValue,
          dailyValue: values.dailyValue,
          unitMeasurementCatalogId: values.unitMeasurementCatalogId,
          levels: levelsPayload,
          intervalLength: values.intervalLength,
          unitOfTime: values.unitOfTime,
          suggestedNumberOfRecordings: values.suggestedNumberOfRecordings,
          cumulative: values.cumulative,
          topography: values.topography ?? "",
          active: values.active ?? true,
          chart: values.chart,
          baselines: loadedBaselines,
          objectives: loadedObjectives,
          recommendations: values.recommendations ?? undefined,
        })
        toast.success("Item configuration saved")
      }

      onSaved()
      onClose()
    } catch {
      // API validation errors are surfaced by the global HTTP interceptor.
    } finally {
      setIsSaving(false)
    }
  }

  const drawerTitle =
    mode === "category"
      ? `Data Collection — ${categoryName}`
      : `Data Collection — ${itemName ?? "Item"}`

  return (
    <Drawer
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose()
      }}
      direction="right"
    >
      <DrawerContent
        style={{ ["--drawer-max-w" as string]: `${maxWidthPx}px` }}
        className={cn(
          "bg-white shadow-2xl",
          "md:data-[vaul-drawer-direction=right]:w-full",
          "lg:data-[vaul-drawer-direction=right]:w-full",
          "xl:data-[vaul-drawer-direction=right]:w-full",
          "sm:max-w-[min(var(--drawer-max-w),95vw)]",
          "transition-[max-width] duration-300 ease-out motion-reduce:transition-none"
        )}
      >
        <VisuallyHidden>
          <DrawerTitle>{drawerTitle}</DrawerTitle>
        </VisuallyHidden>

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-slate-800 truncate pr-4">{drawerTitle}</h2>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#037ECC]" />
          </div>
        ) : (
          <ClientDataCollectionForm
            mode={mode}
            categoryName={categoryName}
            itemName={itemName}
            initialConfig={config ?? undefined}
            initialTopography={itemConfig?.topography}
            initialActive={itemConfig?.active}
            onSave={handleSave}
            onDeleteLevel={handleDeleteLevel}
            onChartLayoutChange={setChartLayout}
            onCancel={onClose}
            isSaving={isSaving}
          />
        )}
      </DrawerContent>
    </Drawer>
  )
}
