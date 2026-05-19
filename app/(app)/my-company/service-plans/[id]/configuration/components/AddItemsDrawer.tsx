"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Check, Loader2, Search, X } from "lucide-react"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { toast } from "sonner"

import { Button } from "@/components/custom/Button"
import { Checkbox } from "@/components/custom/Checkbox"
import { Drawer, DrawerClose, DrawerContent, DrawerTitle } from "@/components/ui/drawer"
import {
  assignItemsToServicePlanCategory,
  getItemCatalogByCategoryPage,
  getItemCatalogPage,
} from "@/lib/modules/service-plans/services/company-service-plans.service"
import type {
  ItemCatalogItem,
  ServicePlanCategorySummary,
} from "@/lib/types/company-service-plan.types"

interface AddItemsDrawerProps {
  open: boolean
  onClose: () => void
  activeCategory: ServicePlanCategorySummary | null
  mappedItemIds: Set<string>
  onAssignSuccess: () => Promise<void> | void
}

const PAGE_SIZE = 50

function sortByName(items: ItemCatalogItem[]): ItemCatalogItem[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }))
}

function dedupeById(items: ItemCatalogItem[]): ItemCatalogItem[] {
  return items.filter((item, index, list) => index === list.findIndex((entry) => entry.id === item.id))
}

export function AddItemsDrawer({
  open,
  onClose,
  activeCategory,
  mappedItemIds,
  onAssignSuccess,
}: AddItemsDrawerProps) {
  const [catalog, setCatalog] = useState<ItemCatalogItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [sourceCategoryId, setSourceCategoryId] = useState<string | null>(null)
  const [sourceCanEdit, setSourceCanEdit] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set())
  const [isAssigning, setIsAssigning] = useState(false)

  const searchRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const resetDrawer = useCallback(() => {
    setCatalog([])
    setIsLoading(false)
    setIsLoadingMore(false)
    setLoadError(null)
    setPage(0)
    setHasMore(true)
    setSourceCategoryId(null)
    setSourceCanEdit(false)
    setSearchTerm("")
    setSelectedItemIds(new Set())
  }, [])

  useEffect(() => {
    if (!open) {
      resetDrawer()
      return
    }

    if (!activeCategory?.categoryId) {
      const message = "Select a valid category before adding items"
      setCatalog([])
      setLoadError(message)
      toast.error(message)
      return
    }

    const canEdit = activeCategory.canEdit === true
    setSourceCategoryId(activeCategory.categoryId)
    setSourceCanEdit(canEdit)
    setSearchTerm("")
    setSelectedItemIds(new Set())
    setLoadError(null)
    setCatalog([])
    setPage(0)
    setHasMore(true)

    let isActive = true

    void (async () => {
      try {
        setIsLoading(true)
        const { items, hasMore: more } = canEdit
          ? await getItemCatalogPage(0, PAGE_SIZE)
          : await getItemCatalogByCategoryPage(activeCategory.categoryId, 0, PAGE_SIZE)

        if (!isActive) return

        setCatalog(sortByName(items))
        setHasMore(more)
      } catch (err) {
        if (!isActive) return
        const message = err instanceof Error ? err.message : "Failed to load item catalog"
        setCatalog([])
        setLoadError(message)
        toast.error(message)
      } finally {
        if (isActive) setIsLoading(false)
      }
    })()

    return () => {
      isActive = false
    }
  }, [open, activeCategory, resetDrawer])

  useEffect(() => {
    if (open) {
      searchRef.current?.focus()
    }
  }, [open])

  const loadMore = useCallback(async () => {
    if (isLoading || isLoadingMore || !hasMore) return

    try {
      setIsLoadingMore(true)
      const nextPage = page + 1
      const { items, hasMore: more } = sourceCanEdit
        ? await getItemCatalogPage(nextPage, PAGE_SIZE)
        : sourceCategoryId
          ? await getItemCatalogByCategoryPage(sourceCategoryId, nextPage, PAGE_SIZE)
          : { items: [], hasMore: false }

      setCatalog((current) => sortByName(dedupeById([...current, ...items])))
      setPage(nextPage)
      setHasMore(more)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load more catalog items")
    } finally {
      setIsLoadingMore(false)
    }
  }, [hasMore, isLoading, isLoadingMore, page, sourceCanEdit, sourceCategoryId])

  const handleScroll = () => {
    const container = scrollRef.current
    if (!container || isLoading || isLoadingMore || !hasMore) return

    const distanceToBottom = container.scrollHeight - container.scrollTop - container.clientHeight
    if (distanceToBottom <= 120) {
      void loadMore()
    }
  }

  const handleClose = () => {
    if (isAssigning) return
    onClose()
  }

  const availableItems = useMemo(
    () => catalog.filter((item) => !mappedItemIds.has(item.id)),
    [catalog, mappedItemIds]
  )

  const normalizedSearch = searchTerm.trim().toLowerCase()

  const filteredItems = useMemo(() => {
    if (normalizedSearch.length === 0) return availableItems
    return availableItems.filter((item) => item.name.toLowerCase().includes(normalizedSearch))
  }, [availableItems, normalizedSearch])

  const isAllVisibleSelected =
    filteredItems.length > 0 && filteredItems.every((item) => selectedItemIds.has(item.id))
  const isSomeVisibleSelected =
    filteredItems.some((item) => selectedItemIds.has(item.id)) && !isAllVisibleSelected

  const toggleItemSelection = (itemId: string) => {
    setSelectedItemIds((current) => {
      const next = new Set(current)
      if (next.has(itemId)) {
        next.delete(itemId)
      } else {
        next.add(itemId)
      }
      return next
    })
  }

  const toggleSelectAllVisible = () => {
    if (filteredItems.length === 0) return

    setSelectedItemIds((current) => {
      const next = new Set(current)
      if (isAllVisibleSelected) {
        filteredItems.forEach((item) => next.delete(item.id))
      } else {
        filteredItems.forEach((item) => next.add(item.id))
      }
      return next
    })
  }

  const handleAssignItems = async () => {
    if (!activeCategory) return
    const itemIds = Array.from(selectedItemIds)
    if (itemIds.length === 0) {
      toast.error("Select at least one item")
      return
    }

    setIsAssigning(true)
    try {
      await assignItemsToServicePlanCategory(activeCategory.id, itemIds)
      toast.success(`${itemIds.length} item${itemIds.length === 1 ? "" : "s"} added successfully`)

      await onAssignSuccess()
      onClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to assign items"
      setLoadError(message)
      toast.error(message)
    } finally {
      setIsAssigning(false)
    }
  }

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (!next) handleClose()
      }}
      direction="right"
    >
      <DrawerContent className="w-full bg-white shadow-2xl sm:max-w-2xl">
        <VisuallyHidden>
          <DrawerTitle>Add items</DrawerTitle>
        </VisuallyHidden>

        <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Add items</h2>
            <DrawerClose asChild>
              <button
                className="rounded-lg p-2 transition-colors hover:bg-gray-100"
                aria-label="Close"
                disabled={isAssigning}
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </DrawerClose>
          </div>
        </div>

        <div className="border-b border-gray-200 p-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              ref={searchRef}
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by item name..."
              className="h-14 w-full rounded-xl border-2 border-gray-200 pl-12 pr-4 text-base outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
          </div>

          {!isLoading && (
            <div className="mt-4 flex items-center justify-end gap-2">
              {filteredItems.length > 0 && (
                <button
                  type="button"
                  onClick={toggleSelectAllVisible}
                  className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-xs font-medium transition-all ${
                    isAllVisibleSelected
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : isSomeVisibleSelected
                        ? "border-blue-400 bg-blue-50/60 text-blue-600"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {(isAllVisibleSelected || isSomeVisibleSelected) && (
                    <Check className="h-4 w-4" strokeWidth={2.5} />
                  )}
                  {isAllVisibleSelected ? "Deselect All" : "Select All"}
                </button>
              )}
            </div>
          )}
        </div>

        <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto pb-24">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : loadError ? (
            <div className="m-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-medium text-red-700">Could not load item catalog.</p>
              <p className="mt-1 text-sm text-red-600">{loadError}</p>
            </div>
          ) : catalog.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center px-6">
              <p className="text-center text-gray-600">No items available in catalog.</p>
            </div>
          ) : availableItems.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center px-6">
              <p className="text-center text-gray-600">All catalog items are already mapped to this category.</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center px-6">
              <Search className="mb-4 h-12 w-12 text-gray-300" />
              <p className="text-center text-gray-600">No items found. Try a different search term.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredItems.map((item) => {
                const isSelected = selectedItemIds.has(item.id)

                return (
                  <div
                    key={item.id}
                    className={`p-4 transition-colors ${isSelected ? "bg-blue-50" : "hover:bg-gray-50"}`}
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleItemSelection(item.id)}
                          size="md"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleItemSelection(item.id)}
                        className="flex-1 min-w-0 text-left"
                      >
                        <p className={`text-sm font-medium ${isSelected ? "text-blue-700" : "text-gray-900"}`}>
                          {item.name}
                        </p>
                      </button>
                    </div>
                  </div>
                )
              })}
              {isLoadingMore && (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-white p-6 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              {selectedItemIds.size > 0 && (
                <span className="font-medium text-gray-900">{selectedItemIds.size} selected</span>
              )}
            </div>

            <Button
              type="button"
              onClick={() => {
                void handleAssignItems()
              }}
              disabled={selectedItemIds.size === 0 || isAssigning}
              className="min-w-[200px]"
            >
              {isAssigning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add items"
              )}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
