"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import {
  deleteClientServicePlanCategoryItem,
  getClientServicePlanCategoryItems,
} from "@/lib/modules/client-service-plan/services/client-service-plan.service"
import type { ClientServicePlanCategoryMappedItem } from "@/lib/types/client-service-plan.types"

interface UseClientServicePlanCategoryItemsParams {
  activeClientServicePlanCategoryId: string | null
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
  start: (item: ClientServicePlanCategoryMappedItem) => void
  cancel: () => void
  setName: (name: string) => void
  save: (item: ClientServicePlanCategoryMappedItem) => Promise<void>
}

interface UseClientServicePlanCategoryItemsResult {
  items: ClientServicePlanCategoryMappedItem[]
  isLoading: boolean
  error: string | null
  reload: () => Promise<void>
  createForm: CreateInlineFormState
  editForm: EditInlineFormState
  deletingItemId: string | null
  deleteItem: (item: ClientServicePlanCategoryMappedItem) => Promise<void>
}

function sortMappedItems(
  items: ClientServicePlanCategoryMappedItem[]
): ClientServicePlanCategoryMappedItem[] {
  return [...items].sort((a, b) => {
    const orderA = a.order ?? Number.MAX_SAFE_INTEGER
    const orderB = b.order ?? Number.MAX_SAFE_INTEGER
    if (orderA !== orderB) return orderA - orderB
    return a.itemName.localeCompare(b.itemName, undefined, { sensitivity: "base" })
  })
}

export function useClientServicePlanCategoryItems({
  activeClientServicePlanCategoryId,
  onCategoriesChanged,
}: UseClientServicePlanCategoryItemsParams): UseClientServicePlanCategoryItemsResult {
  const [items, setItems] = useState<ClientServicePlanCategoryMappedItem[]>([])
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
    if (!activeClientServicePlanCategoryId) {
      setItems([])
      setError(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await getClientServicePlanCategoryItems(activeClientServicePlanCategoryId)
      setItems(sortMappedItems(data))
    } catch (err) {
      setItems([])
      setError(err instanceof Error ? err.message : "Failed to load mapped items")
    } finally {
      setIsLoading(false)
    }
  }, [activeClientServicePlanCategoryId])

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

  // Client SP items are added via catalog (AddItemsDrawer), not created inline from scratch.
  // This stub is kept for interface compatibility but shows a warning if used.
  const saveCreate = useCallback(async () => {
    toast.error("Use 'Add items' to add items to this category")
    setIsCreateFormVisible(false)
    setCreateFormName("")
  }, [])

  const startEdit = useCallback(
    (item: ClientServicePlanCategoryMappedItem) => {
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
    async (_item: ClientServicePlanCategoryMappedItem) => {
      // Client SP items are read-only catalog references; editing is not supported.
      toast.error("Items in the client service plan cannot be renamed")
      setEditingItemId(null)
      setEditFormName("")
    },
    []
  )

  const deleteItem = useCallback(
    async (item: ClientServicePlanCategoryMappedItem) => {
      if (!activeClientServicePlanCategoryId || deletingItemId) return

      setDeletingItemId(item.id)
      try {
        await deleteClientServicePlanCategoryItem(item.id)
        await refreshAfterMutation()
        toast.success("Item removed from category")
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to remove item from category")
      } finally {
        setDeletingItemId(null)
      }
    },
    [activeClientServicePlanCategoryId, deletingItemId, refreshAfterMutation]
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
