"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/custom/Card"
import { ChevronRight, FileText, Sliders } from "lucide-react"
import {
  getCompanyServicePlanById,
  getServicePlanCategoriesByServicePlanId,
} from "@/lib/modules/service-plans/services/company-service-plans.service"
import { useCompanyActiveServices } from "@/lib/modules/services/hooks/use-company-active-services"
import type { CompanyServicePlan, ServicePlanCategorySummary } from "@/lib/types/company-service-plan.types"

export default function ServicePlanConfigurationPage() {
  const params = useParams<{ id: string }>()
  const [servicePlan, setServicePlan] = useState<CompanyServicePlan | null>(null)
  const [categories, setCategories] = useState<ServicePlanCategorySummary[]>([])
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { services } = useCompanyActiveServices()

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

        const categoryData = await getServicePlanCategoriesByServicePlanId(params.id)

        setServicePlan(data)
        setCategories(
          [...categoryData].sort((a, b) =>
            a.categoryName.localeCompare(b.categoryName, undefined, { sensitivity: "base" })
          )
        )
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
  }, [params.id])

  useEffect(() => {
    if (!categories || categories.length === 0) {
      setActiveCategoryId(null)
      return
    }

    setActiveCategoryId((current) =>
      current && categories.some((category) => category.categoryId === current)
        ? current
        : categories[0].categoryId
    )
  }, [categories])

  const serviceLabel =
    servicePlan?.serviceName ||
    services.find((service) => service.id === servicePlan?.serviceId)?.name ||
    "-"

  const activeCategory = categories.find((category) => category.categoryId === activeCategoryId) ?? null

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
                      const isActive = category.categoryId === activeCategoryId

                      return (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => setActiveCategoryId(category.categoryId)}
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
                    <p className="mt-1 text-sm text-slate-500">Items mapped for this category will appear in this panel.</p>

                    <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-6">
                      <p className="text-sm text-slate-600">
                        This is the dynamic area for <span className="font-semibold text-slate-800">{`${activeCategory.categoryName} (${activeCategory.totalItems})`}</span>.
                      </p>
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
    </div>
  )
}
