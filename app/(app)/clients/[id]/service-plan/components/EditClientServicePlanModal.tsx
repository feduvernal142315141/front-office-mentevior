"use client"

import { useEffect, useMemo, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { CustomModal } from "@/components/custom/CustomModal"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { PremiumDatePicker } from "@/components/custom/PremiumDatePicker"
import { PremiumSwitch } from "@/components/custom/PremiumSwitch"
import { Button } from "@/components/custom/Button"
import { ServicePlanCategoriesPicker } from "@/app/(app)/my-company/service-plans/components/ServicePlanCategoriesPicker"
import { useServicePlanCategoriesCatalog } from "@/lib/modules/service-plans/hooks/use-service-plan-categories-catalog"
import {
  getClientServicePlanById,
  updateClientServicePlan,
} from "@/lib/modules/client-service-plan/services/client-service-plan.service"
import { toast } from "@/lib/compat/sonner"
import { isoToLocalDate } from "@/lib/date"
import type { ClientServicePlan } from "@/lib/types/client-service-plan.types"

const clientServicePlanFormSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    startDate: z.string().trim().min(1, "Start date is required"),
    endDate: z.string().optional().or(z.literal("")),
    active: z.boolean(),
    description: z.string().optional().or(z.literal("")),
    categories: z.array(z.string()).min(1, "At least one category is required"),
  })
  .refine(
    (values) => {
      if (!values.startDate || !values.endDate) return true
      return values.startDate <= values.endDate
    },
    {
      path: ["endDate"],
      message: "End date must be greater than or equal to start date",
    },
  )

type ClientServicePlanFormValues = z.infer<typeof clientServicePlanFormSchema>

interface EditClientServicePlanModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  initialPlan: ClientServicePlan | null
  /** Optional labels for already-mapped categories (id → name). */
  categoryLabels?: Record<string, string>
}

function resolvePlanCategories(
  plan: ClientServicePlan,
  categoryLabels: Record<string, string>,
): string[] {
  if (plan.categories?.length) return plan.categories
  return Object.keys(categoryLabels)
}

function getFormValuesFromPlan(
  plan: ClientServicePlan,
  categoryLabels: Record<string, string> = {},
): ClientServicePlanFormValues {
  return {
    name: plan.name,
    startDate: plan.startDate ? isoToLocalDate(plan.startDate) : "",
    endDate: plan.endDate ? isoToLocalDate(plan.endDate) : "",
    active: plan.active,
    description: plan.description ?? "",
    categories: resolvePlanCategories(plan, categoryLabels),
  }
}

export function EditClientServicePlanModal({
  open,
  onClose,
  onSuccess,
  initialPlan,
  categoryLabels = {},
}: EditClientServicePlanModalProps) {
  const {
    options: categoryCatalogOptions,
    createCategory,
    editCategory,
    removeCategory,
    isCreating: isCreatingCategory,
    isUpdating: isUpdatingCategory,
    isDeleting: isDeletingCategory,
    refreshCatalog,
  } = useServicePlanCategoriesCatalog()

  const [isLoadingPlanDetail, setIsLoadingPlanDetail] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const isLoading = isSaving || isLoadingPlanDetail

  const form = useForm<ClientServicePlanFormValues>({
    resolver: zodResolver(clientServicePlanFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      name: "",
      startDate: "",
      endDate: "",
      active: true,
      description: "",
      categories: [],
    },
  })

  const selectedCategories = form.watch("categories") ?? []

  const categoryOptions = useMemo(() => {
    const map = new Map(categoryCatalogOptions.map((option) => [option.value, option]))

    selectedCategories.forEach((categoryId) => {
      if (map.has(categoryId)) return
      map.set(categoryId, {
        value: categoryId,
        label: categoryLabels[categoryId] ?? categoryId,
      })
    })

    Object.entries(categoryLabels).forEach(([id, name]) => {
      if (!map.has(id)) map.set(id, { value: id, label: name })
    })

    return Array.from(map.values())
  }, [categoryCatalogOptions, selectedCategories, categoryLabels])

  const handleClose = () => {
    form.reset({
      name: "",
      startDate: "",
      endDate: "",
      active: true,
      description: "",
      categories: [],
    })
    onClose()
  }

  useEffect(() => {
    let active = true

    if (!open || !initialPlan) {
      setIsLoadingPlanDetail(false)
      return
    }

    void refreshCatalog(true)
    setIsLoadingPlanDetail(true)

    void (async () => {
      try {
        const plan = await getClientServicePlanById(initialPlan.id)
        if (!active) return

        if (plan) {
          form.reset(getFormValuesFromPlan(plan, categoryLabels))
          return
        }

        toast.error("Service plan not found")
        form.reset(getFormValuesFromPlan(initialPlan, categoryLabels))
      } catch {
        if (!active) return
        toast.error("Failed to load service plan detail")
        form.reset(getFormValuesFromPlan(initialPlan, categoryLabels))
      } finally {
        if (active) setIsLoadingPlanDetail(false)
      }
    })()

    return () => {
      active = false
    }
  }, [open, initialPlan, categoryLabels, form, refreshCatalog])

  const onSubmit = form.handleSubmit(async (values) => {
    if (!initialPlan) return

    setIsSaving(true)
    try {
      await updateClientServicePlan({
        id: initialPlan.id,
        clientId: initialPlan.clientId,
        name: values.name,
        description: values.description,
        startDate: values.startDate || undefined,
        endDate: values.endDate || undefined,
        active: values.active,
        categories: values.categories,
      })
      toast.success("Service plan updated")
      handleClose()
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update service plan")
    } finally {
      setIsSaving(false)
    }
  })

  return (
    <CustomModal
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) handleClose()
      }}
      title="Edit Service Plan"
      description="Update categories and details for this client service plan"
      maxWidthClassName="sm:max-w-[820px]"
      contentClassName="overflow-visible"
      allowSelectOverflow
    >
      <form
        onSubmit={(event) => {
          event.preventDefault()
          void onSubmit()
        }}
        noValidate
        className="px-6 py-5 space-y-5"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <div className="md:col-span-2">
                <FloatingInput
                  label="Name"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  hasError={!!fieldState.error}
                  required
                  disabled={isLoadingPlanDetail}
                />
                {fieldState.error && (
                  <p className="mt-1.5 text-sm text-red-600">{fieldState.error.message}</p>
                )}
              </div>
            )}
          />

          <Controller
            name="startDate"
            control={form.control}
            render={({ field, fieldState }) => (
              <div>
                <PremiumDatePicker
                  label="Start Date"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  onClear={() => field.onChange("")}
                  hasError={!!fieldState.error}
                  required
                  disabled={isLoadingPlanDetail}
                />
                {fieldState.error && (
                  <p className="mt-1.5 text-sm text-red-600">{fieldState.error.message}</p>
                )}
              </div>
            )}
          />

          <Controller
            name="endDate"
            control={form.control}
            render={({ field, fieldState }) => (
              <div>
                <PremiumDatePicker
                  label="End Date"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  onClear={() => field.onChange("")}
                  hasError={!!fieldState.error}
                  disabled={isLoadingPlanDetail}
                />
                {fieldState.error && (
                  <p className="mt-1.5 text-sm text-red-600">{fieldState.error.message}</p>
                )}
              </div>
            )}
          />
        </div>

        <Controller
          name="active"
          control={form.control}
          render={({ field }) => (
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <PremiumSwitch
                checked={field.value}
                onCheckedChange={field.onChange}
                label={field.value ? "Active" : "Inactive"}
                description={
                  field.value
                    ? "This service plan is enabled for operational use"
                    : "This service plan is disabled and won’t be available for operational use"
                }
                disabled={isLoadingPlanDetail}
              />
            </div>
          )}
        />

        <Controller
          name="categories"
          control={form.control}
          render={({ field, fieldState }) => (
            <div>
              <ServicePlanCategoriesPicker
                value={field.value}
                onChange={field.onChange}
                options={categoryOptions}
                onCreateCategory={createCategory}
                onEditCategory={editCategory}
                onDeleteCategory={removeCategory}
                isCreatingCategory={isCreatingCategory}
                isUpdatingCategory={isUpdatingCategory}
                isDeletingCategory={isDeletingCategory}
                disabled={isLoadingPlanDetail}
                hasError={!!fieldState.error}
                required
              />
              {fieldState.error && (
                <p className="mt-1.5 text-sm text-red-600">{fieldState.error.message}</p>
              )}
            </div>
          )}
        />

        <div className="pt-2 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isLoading} disabled={isLoadingPlanDetail}>
            Update Service Plan
          </Button>
        </div>
      </form>
    </CustomModal>
  )
}
