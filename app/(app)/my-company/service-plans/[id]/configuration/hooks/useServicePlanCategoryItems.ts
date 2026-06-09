"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import {
  createItemCatalog,
  deleteServicePlanCategoryItem,
  getServicePlanCategoryItemsByServicePlanCategoryId,
  updateItemCatalog,
} from "@/lib/modules/service-plans/services/company-service-plans.service"
import type { ServicePlanCategoryMappedItem } from "@/lib/types/company-service-plan.types"

interface UseServicePlanCategoryItemsParams {
  activeServicePlanCategoryId: string | null
  onCategoriesChanged?: () => Promise<void> | void
}

interface CreateInlineFormState {
  visible: boolean
  name: string
  isSaving: boolean
  start: () => void
  cancel: () => void
  setName: (name: string) => void
  save: () => Promise<void>
}

interface EditInlineFormState {
  activeItemId: string | null
  name: string
  isSaving: boolean
  start: (item: ServicePlanCategoryMappedItem) => void
  cancel: () => void
  setName: (name: string) => void
  save: (item: ServicePlanCategoryMappedItem) => Promise<void>
}

interface UseServicePlanCategoryItemsResult {
  items: ServicePlanCategoryMappedItem[]
  isLoading: boolean
  error: string | null
  reload: () => Promise<void>
  createForm: CreateInlineFormState
  editForm: EditInlineFormState
  deletingItemId: string | null
  deleteItem: (item: ServicePlanCategoryMappedItem) => Promise<void>
}

function sortMappedItems(items: ServicePlanCategoryMappedItem[]): ServicePlanCategoryMappedItem[] {
  return [...items].sort((a, b) => {
    const orderA = a.order ?? Number.MAX_SAFE_INTEGER
    const orderB = b.order ?? Number.MAX_SAFE_INTEGER
    if (orderA !== orderB) return orderA - orderB

    return a.itemName.localeCompare(b.itemName, undefined, { sensitivity: "base" })
  })
}

export function useServicePlanCategoryItems({
  activeServicePlanCategoryId,
  onCategoriesChanged,
}: UseServicePlanCategoryItemsParams): UseServicePlanCategoryItemsResult {
  const [items, setItems] = useState<ServicePlanCategoryMappedItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [isCreateFormVisible, setIsCreateFormVisible] = useState(false)
  const [createFormName, setCreateFormName] = useState("")
  const [isSavingCreate, setIsSavingCreate] = useState(false)

  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editFormName, setEditFormName] = useState("")
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!activeServicePlanCategoryId) {
      setItems([])
      setError(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await getServicePlanCategoryItemsByServicePlanCategoryId(activeServicePlanCategoryId)
      setItems(sortMappedItems(data))
    } catch (err) {
      setItems([])
      setError(err instanceof Error ? err.message : "Failed to load mapped items")
    } finally {
      setIsLoading(false)
    }
  }, [activeServicePlanCategoryId])

  useEffect(() => {
    void reload()
  }, [reload])

  const refreshAfterMutation = useCallback(async () => {
    const tasks: Array<Promise<void> | void> = [reload()]
    if (onCategoriesChanged) tasks.push(onCategoriesChanged())
    await Promise.all(tasks)
  }, [reload, onCategoriesChanged])

  const startCreate = useCallback(() => {
    setCreateFormName("")
    setIsCreateFormVisible(true)
  }, [])

  const cancelCreate = useCallback(() => {
    if (isSavingCreate) return
    setIsCreateFormVisible(false)
    setCreateFormName("")
  }, [isSavingCreate])

  const saveCreate = useCallback(async () => {
    const trimmedName = createFormName.trim()
    if (trimmedName.length === 0 || isSavingCreate || !activeServicePlanCategoryId) return

    setIsSavingCreate(true)
    try {
      await createItemCatalog({
        servicePlanCategoryId: activeServicePlanCategoryId,
        name: trimmedName,
        type: "SERVICE_PLAN",
      })
      await refreshAfterMutation()

      toast.success("Item created successfully")
      setIsCreateFormVisible(false)
      setCreateFormName("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save item")
    } finally {
      setIsSavingCreate(false)
    }
  }, [activeServicePlanCategoryId, createFormName, isSavingCreate, refreshAfterMutation])

  const startEdit = useCallback(
    (item: ServicePlanCategoryMappedItem) => {
      if (deletingItemId || isSavingEdit) return
      setEditingItemId(item.id)
      setEditFormName(item.itemName)
    },
    [deletingItemId, isSavingEdit]
  )

  const cancelEdit = useCallback(() => {
    if (isSavingEdit) return
    setEditingItemId(null)
    setEditFormName("")
  }, [isSavingEdit])

  const saveEdit = useCallback(
    async (item: ServicePlanCategoryMappedItem) => {
      const trimmedName = editFormName.trim()
      if (trimmedName.length === 0 || isSavingEdit || !activeServicePlanCategoryId) return

      setIsSavingEdit(true)
      try {
        await updateItemCatalog({ id: item.itemId, name: trimmedName })
        await refreshAfterMutation()

        setEditingItemId(null)
        setEditFormName("")
        toast.success("Item updated successfully")
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update item")
      } finally {
        setIsSavingEdit(false)
      }
    },
    [activeServicePlanCategoryId, editFormName, isSavingEdit, refreshAfterMutation]
  )

  const deleteItem = useCallback(
    async (item: ServicePlanCategoryMappedItem) => {
      if (!activeServicePlanCategoryId || deletingItemId) return

      setDeletingItemId(item.id)
      try {
        await deleteServicePlanCategoryItem(activeServicePlanCategoryId, item.id)
        await refreshAfterMutation()
        toast.success("Item removed from category")
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to remove item from category")
      } finally {
        setDeletingItemId(null)
      }
    },
    [activeServicePlanCategoryId, deletingItemId, refreshAfterMutation]
  )

  return {
    items,
    isLoading,
    error,
    reload,
    createForm: {
      visible: isCreateFormVisible,
      name: createFormName,
      isSaving: isSavingCreate,
      start: startCreate,
      cancel: cancelCreate,
      setName: setCreateFormName,
      save: saveCreate,
    },
    editForm: {
      activeItemId: editingItemId,
      name: editFormName,
      isSaving: isSavingEdit,
      start: startEdit,
      cancel: cancelEdit,
      setName: setEditFormName,
      save: saveEdit,
    },
    deletingItemId,
    deleteItem,
  }
}
