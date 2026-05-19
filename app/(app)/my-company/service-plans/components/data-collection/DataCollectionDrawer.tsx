"use client"

import { useCallback, useEffect, useState } from "react"
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { DataCollectionForm } from "./DataCollectionForm"

import {
  getCategoryDataCollection,
  getItemDataCollection,
  upsertCategoryDataCollection,
  upsertItemDataCollection,
} from "@/lib/modules/service-plans/services/data-collection.service"

import type {
  DataCollectionConfig,
  DataCollectionType,
  ItemDataCollectionConfig,
} from "@/lib/types/data-collection.types"
import type { DataCollectionFormValues } from "@/lib/schemas/data-collection-form.schema"

interface DataCollectionDrawerProps {
  open: boolean
  onClose: () => void
  mode: "category" | "item"
  categoryId: string
  categoryName: string
  servicePlanCategoryItemId?: string
  itemName?: string
  servicePlanId: string
  onSaved: () => void
}

export function DataCollectionDrawer({
  open,
  onClose,
  mode,
  categoryId,
  categoryName,
  servicePlanCategoryItemId,
  itemName,
  servicePlanId,
  onSaved,
}: DataCollectionDrawerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [config, setConfig] = useState<DataCollectionConfig | null>(null)
  const [itemConfig, setItemConfig] = useState<ItemDataCollectionConfig | null>(null)

  const loadConfig = useCallback(async () => {
    if (!open) return
    setIsLoading(true)
    try {
      if (mode === "category") {
        const data = await getCategoryDataCollection(categoryId)
        setConfig(data)
        setItemConfig(null)
      } else if (mode === "item" && servicePlanCategoryItemId) {
        // Try item-specific first, fall back to category config
        const itemData = await getItemDataCollection(servicePlanCategoryItemId)
        if (itemData) {
          setItemConfig(itemData)
          setConfig(itemData)
        } else {
          const catData = await getCategoryDataCollection(categoryId)
          setConfig(catData)
          setItemConfig(null)
        }
      }
    } catch {
      toast.error("Failed to load data collection configuration")
    } finally {
      setIsLoading(false)
    }
  }, [open, mode, categoryId, servicePlanCategoryItemId])

  useEffect(() => {
    if (open) {
      loadConfig()
    } else {
      // Reset state when drawer closes
      setConfig(null)
      setItemConfig(null)
    }
  }, [open, loadConfig])

  const handleSave = async (values: DataCollectionFormValues) => {
    setIsSaving(true)
    try {
      const levelsPayload = (values.levels ?? []).map((l) => ({
        label: l.label,
        description: l.description,
        value: l.value,
      }))

      if (mode === "category") {
        await upsertCategoryDataCollection({
          servicePlanCategoryId: categoryId,
          type: values.type as DataCollectionType,
          weeklyDailyValue: values.weeklyDailyValue as "total" | "average" | undefined,
          dailyValue: values.dailyValue as "total" | "average" | undefined,
          levels: levelsPayload,
          intervalLength: values.intervalLength,
          unitOfTime: values.unitOfTime as "seconds" | "minutes" | "hours" | undefined,
          suggestedNumberOfRecordings: values.suggestedNumberOfRecordings,
          cumulative: values.cumulative,
        })
        toast.success(`Configuration applied to all items in "${categoryName}"`)
      } else if (mode === "item" && servicePlanCategoryItemId) {
        await upsertItemDataCollection({
          servicePlanCategoryId: categoryId,
          servicePlanCategoryItemId,
          type: values.type as DataCollectionType,
          weeklyDailyValue: values.weeklyDailyValue as "total" | "average" | undefined,
          dailyValue: values.dailyValue as "total" | "average" | undefined,
          levels: levelsPayload,
          intervalLength: values.intervalLength,
          unitOfTime: values.unitOfTime as "seconds" | "minutes" | "hours" | undefined,
          suggestedNumberOfRecordings: values.suggestedNumberOfRecordings,
          cumulative: values.cumulative,
          topography: values.topography ?? "",
          active: values.active ?? true,
        })
        toast.success("Item configuration saved")
      }

      onSaved()
      onClose()
    } catch {
      toast.error("Failed to save configuration")
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
      <DrawerContent className="w-full bg-white shadow-2xl sm:max-w-2xl flex flex-col">
        <VisuallyHidden>
          <DrawerTitle>{drawerTitle}</DrawerTitle>
        </VisuallyHidden>

        {/* Custom header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-slate-800 truncate pr-4">
            {drawerTitle}
          </h2>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : (
          <DataCollectionForm
            mode={mode}
            categoryName={categoryName}
            itemName={itemName}
            initialConfig={config ?? undefined}
            initialTopography={itemConfig?.topography}
            initialActive={itemConfig?.active}
            onSave={handleSave}
            onCancel={onClose}
            isSaving={isSaving}
          />
        )}
      </DrawerContent>
    </Drawer>
  )
}
