"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/custom/Card"
import { Button } from "@/components/custom/Button"
import { Checkbox } from "@/components/custom/Checkbox"
import { Drawer, DrawerClose, DrawerContent, DrawerTitle } from "@/components/ui/drawer"
import { Check, ChevronRight, FileText, Loader2, Search, Sliders, X } from "lucide-react"
import {
  assignItemsToServicePlanCategory,
  getCompanyServicePlanById,
  getItemCatalog,
  getServicePlanCategoryItemsByServicePlanCategoryId,
  getServicePlanCategoriesByServicePlanId,
} from "@/lib/modules/service-plans/services/company-service-plans.service"
import { useCompanyActiveServices } from "@/lib/modules/services/hooks/use-company-active-services"
import type {
  CompanyServicePlan,
  ItemCatalogItem,
  ServicePlanCategoryMappedItem,
  ServicePlanCategorySummary,
} from "@/lib/types/company-service-plan.types"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { toast } from "sonner"

export default function ServicePlanConfigurationPage() {
  const params = useParams<{ id: string }>()
  const [servicePlan, setServicePlan] = useState<CompanyServicePlan | null>(null)
  const [categories, setCategories] = useState<ServicePlanCategorySummary[]>([])
  const [activeServicePlanCategoryId, setActiveServicePlanCategoryId] = useState<string | null>(null)
  const [activeCategoryItems, setActiveCategoryItems] = useState<ServicePlanCategoryMappedItem[]>([])
  const [itemsLoading, setItemsLoading] = useState(false)
  const [itemsError, setItemsError] = useState<string | null>(null)
  const [isItemDrawerOpen, setIsItemDrawerOpen] = useState(false)
  const [itemCatalog, setItemCatalog] = useState<ItemCatalogItem[]>([])
  const [itemCatalogLoading, setItemCatalogLoading] = useState(false)
  const [itemCatalogError, setItemCatalogError] = useState<string | null>(null)
  const [itemSearchTerm, setItemSearchTerm] = useState("")
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set())
  const [isAssigningItems, setIsAssigningItems] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const itemSearchRef = useRef<HTMLInputElement>(null)
  const { services } = useCompanyActiveServices()

  const loadCategories = useCallback(async () => {
    const categoryData = await getServicePlanCategoriesByServicePlanId(params.id)
    setCategories(
      [...categoryData].sort((a, b) => a.categoryName.localeCompare(b.categoryName, undefined, { sensitivity: "base" }))
    )
  }, [params.id])

  const loadItemsByServicePlanCategoryId = useCallback(async (servicePlanCategoryId: string) => {
    setItemsLoading(true)
    setItemsError(null)

    try {
      const items = await getServicePlanCategoryItemsByServicePlanCategoryId(servicePlanCategoryId)
      setActiveCategoryItems(
        [...items].sort((a, b) => {
          const orderA = a.order ?? Number.MAX_SAFE_INTEGER
          const orderB = b.order ?? Number.MAX_SAFE_INTEGER
          if (orderA !== orderB) return orderA - orderB

          return a.itemName.localeCompare(b.itemName, undefined, { sensitivity: "base" })
        })
      )
    } catch (err) {
      setActiveCategoryItems([])
      setItemsError(err instanceof Error ? err.message : "Failed to load mapped items")
    } finally {
      setItemsLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true

    void (async () => {
      try {
        setIsLoading(true)
        setError(null)

        const data = await getCompanyServicePlanById(params.id)
        if (!active) return

        if (!data) {
          setError("Service plan not found")
          return
        }

        setServicePlan(data)
        await loadCategories()
      } catch (err) {
        if (!active) return
        setError(err instanceof Error ? err.message : "Failed to load service plan configuration")
      } finally {
        if (active) setIsLoading(false)
      }
    })()

    return () => {
      active = false
    }
  }, [loadCategories, params.id])

  useEffect(() => {
    if (!categories || categories.length === 0) {
      setActiveServicePlanCategoryId(null)
      return
    }

    setActiveServicePlanCategoryId((current) =>
      current && categories.some((category) => category.id === current)
        ? current
        : categories[0].id
    )
  }, [categories])

  useEffect(() => {
    if (!activeServicePlanCategoryId) {
      setActiveCategoryItems([])
      setItemsError(null)
      setItemsLoading(false)
      return
    }

    void loadItemsByServicePlanCategoryId(activeServicePlanCategoryId)
  }, [activeServicePlanCategoryId, loadItemsByServicePlanCategoryId])

  useEffect(() => {
    if (!isItemDrawerOpen) return

    itemSearchRef.current?.focus()
  }, [isItemDrawerOpen])

  const openItemDrawer = () => {
    setIsItemDrawerOpen(true)
    setItemSearchTerm("")
    setSelectedItemIds(new Set())
    setItemCatalogError(null)

    void (async () => {
      try {
        setItemCatalogLoading(true)
        const catalog = await getItemCatalog()
        setItemCatalog(
          [...catalog].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }))
        )
      } catch (err) {
        setItemCatalog([])
        const message = err instanceof Error ? err.message : "Failed to load item catalog"
        setItemCatalogError(message)
        toast.error(message)
      } finally {
        setItemCatalogLoading(false)
      }
    })()
  }

  const closeItemDrawer = () => {
    if (isAssigningItems) return
    setIsItemDrawerOpen(false)
  }

  const mappedItemIds = useMemo(() => new Set(activeCategoryItems.map((item) => item.itemId)), [activeCategoryItems])

  const availableCatalogItems = useMemo(
    () => itemCatalog.filter((item) => !mappedItemIds.has(item.id)),
    [itemCatalog, mappedItemIds]
  )

  const normalizedSearchTerm = itemSearchTerm.trim().toLowerCase()

  const filteredCatalogItems = useMemo(() => {
    if (normalizedSearchTerm.length === 0) return availableCatalogItems

    return availableCatalogItems.filter((item) => item.name.toLowerCase().includes(normalizedSearchTerm))
  }, [availableCatalogItems, normalizedSearchTerm])

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

  const isAllVisibleSelected =
    filteredCatalogItems.length > 0 && filteredCatalogItems.every((item) => selectedItemIds.has(item.id))
  const isSomeVisibleSelected =
    filteredCatalogItems.some((item) => selectedItemIds.has(item.id)) && !isAllVisibleSelected

  const toggleSelectAllVisible = () => {
    if (filteredCatalogItems.length === 0) return

    setSelectedItemIds((current) => {
      const next = new Set(current)

      if (isAllVisibleSelected) {
        filteredCatalogItems.forEach((item) => next.delete(item.id))
      } else {
        filteredCatalogItems.forEach((item) => next.add(item.id))
      }

      return next
    })
  }

  const handleAssignItems = async () => {
    if (!activeServicePlanCategoryId) return

    const itemIds = Array.from(selectedItemIds)
    if (itemIds.length === 0) {
      toast.error("Select at least one item")
      return
    }

    setIsAssigningItems(true)
    try {
      await assignItemsToServicePlanCategory(activeServicePlanCategoryId, itemIds)
      toast.success(`${itemIds.length} item${itemIds.length === 1 ? "" : "s"} added successfully`)

      setIsItemDrawerOpen(false)
      setSelectedItemIds(new Set())
      setItemSearchTerm("")

      await Promise.all([
        loadItemsByServicePlanCategoryId(activeServicePlanCategoryId),
        loadCategories(),
      ])
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to assign items"
      setItemCatalogError(message)
      toast.error(message)
    } finally {
      setIsAssigningItems(false)
    }
  }

  const serviceLabel =
    servicePlan?.serviceName ||
    services.find((service) => service.id === servicePlan?.serviceId)?.name ||
    "-"

  const activeCategory = categories.find((category) => category.id === activeServicePlanCategoryId) ?? null

  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="rounded-xl border border-[#037ECC]/20 bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 p-3">
              <Sliders className="h-8 w-8 text-[#037ECC]" />
            </div>
            <div>
              <h1 className="bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-3xl font-bold text-transparent">
                Service Plan Configuration
              </h1>
              <p className="mt-1 text-slate-600">Adjust configuration for this service plan</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6">
            <div className="h-6 w-1/3 animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
            <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <p className="font-medium text-red-700">Error loading configuration</p>
            <p className="mt-1 text-sm text-red-600">{error}</p>
          </div>
        ) : servicePlan ? (
          <div className="space-y-6">
            <Card variant="elevated" padding="lg">
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <FileText className="h-5 w-5 shrink-0 text-slate-500" />
                  <h2 className="truncate text-lg font-semibold text-slate-900">{servicePlan.name}</h2>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {serviceLabel !== "-" && <span className="text-sm text-slate-500">{serviceLabel}</span>}
                  <Badge
                    variant="outline"
                    className={servicePlan.active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-600"}
                  >
                    {servicePlan.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
              <Card variant="elevated" padding="none" className="overflow-hidden">
                <div className="border-b border-slate-200 px-4 py-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Categories</h3>
                </div>

                {categories.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-slate-500">No categories mapped for this service plan.</div>
                ) : (
                  <div className="p-3 space-y-2">
                    {categories.map((category) => {
                      const isActive = category.id === activeServicePlanCategoryId

                      return (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => setActiveServicePlanCategoryId(category.id)}
                          className={isActive
                            ? "w-full flex items-center justify-between rounded-xl bg-[#2563EB] px-4 py-3 text-left text-white shadow-sm"
                            : "w-full flex items-center justify-between rounded-xl px-4 py-3 text-left text-slate-700 hover:bg-slate-50 transition-colors"
                          }
                        >
                          <span className="font-medium truncate">{`${category.categoryName} (${category.totalItems})`}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={isActive ? "text-white/85 text-sm" : "text-slate-400 text-sm"}>{category.totalItems}</span>
                            <ChevronRight className={isActive ? "h-4 w-4 text-white" : "h-4 w-4 text-slate-400"} />
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </Card>

              <Card variant="elevated" padding="lg">
                {activeCategory ? (
                  <>
                    <h3 className="text-base font-semibold text-slate-900">{`${activeCategory.categoryName} (${activeCategory.totalItems})`}</h3>
                    <div className="mt-1 flex items-center justify-between gap-3">
                      <p className="text-sm text-slate-500">Mapped items for this category.</p>
                      <Button type="button" variant="secondary" className="h-9 px-4 text-xs" onClick={openItemDrawer}>
                        Add items
                      </Button>
                    </div>

                    <div className="mt-5">
                      {itemsLoading ? (
                        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                          <div className="h-4 w-2/5 animate-pulse rounded bg-slate-200" />
                          <div className="h-4 w-3/5 animate-pulse rounded bg-slate-200" />
                          <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
                        </div>
                      ) : itemsError ? (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                          <p className="text-sm font-medium text-red-700">Could not load category items.</p>
                          <p className="mt-1 text-sm text-red-600">{itemsError}</p>
                        </div>
                      ) : activeCategoryItems.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-6">
                          <p className="text-sm text-slate-600">No items mapped for this category.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {activeCategoryItems.map((item) => (
                            <div key={item.id} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                              <p className="text-sm font-medium text-slate-900">{item.itemName}</p>
                              {item.description && (
                                <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-6">
                    <p className="text-sm text-slate-600">Select a category to view and configure its mapped items.</p>
                  </div>
                )}
              </Card>
            </div>
          </div>
        ) : null}
      </div>

      <Drawer
        open={isItemDrawerOpen}
        onOpenChange={(open) => {
          if (!open) closeItemDrawer()
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
                  disabled={isAssigningItems}
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
                ref={itemSearchRef}
                type="text"
                value={itemSearchTerm}
                onChange={(event) => setItemSearchTerm(event.target.value)}
                placeholder="Search by item name..."
                className="h-14 w-full rounded-xl border-2 border-gray-200 pl-12 pr-4 text-base outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            {!itemCatalogLoading && filteredCatalogItems.length > 0 && (
              <div className="mt-4 flex justify-end">
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
                  {(isAllVisibleSelected || isSomeVisibleSelected) && <Check className="h-4 w-4" strokeWidth={2.5} />}
                  {isAllVisibleSelected ? "Deselect All" : "Select All"}
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto pb-24">
            {itemCatalogLoading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : itemCatalogError ? (
              <div className="m-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-sm font-medium text-red-700">Could not load item catalog.</p>
                <p className="mt-1 text-sm text-red-600">{itemCatalogError}</p>
              </div>
            ) : itemCatalog.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center px-6">
                <p className="text-center text-gray-600">No items available in catalog.</p>
              </div>
            ) : availableCatalogItems.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center px-6">
                <p className="text-center text-gray-600">All catalog items are already mapped to this category.</p>
              </div>
            ) : filteredCatalogItems.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center px-6">
                <Search className="mb-4 h-12 w-12 text-gray-300" />
                <p className="text-center text-gray-600">No items found. Try a different search term.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredCatalogItems.map((item) => {
                  const isSelected = selectedItemIds.has(item.id)

                  return (
                    <div
                      key={item.id}
                      className={`p-4 transition-colors ${isSelected ? "bg-blue-50" : "hover:bg-gray-50"}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="pt-1">
                          <Checkbox checked={isSelected} onCheckedChange={() => toggleItemSelection(item.id)} size="md" />
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
                disabled={selectedItemIds.size === 0 || isAssigningItems}
                className="min-w-[200px]"
              >
                {isAssigningItems ? (
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
    </div>
  )
}
