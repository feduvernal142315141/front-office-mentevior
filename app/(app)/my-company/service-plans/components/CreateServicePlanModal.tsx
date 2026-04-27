"use client"

import { useEffect, useMemo, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CustomModal } from "@/components/custom/CustomModal"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { FloatingTextarea } from "@/components/custom/FloatingTextarea"
import { PremiumDatePicker } from "@/components/custom/PremiumDatePicker"
import { PremiumSwitch } from "@/components/custom/PremiumSwitch"
import { Button } from "@/components/custom/Button"
import { ServicePlanCategoriesPicker } from "./ServicePlanCategoriesPicker"
import {
  companyServicePlanFormSchema,
  getCompanyServicePlanFormDefaults,
  type CompanyServicePlanFormValues,
} from "@/lib/schemas/company-service-plan-form.schema"
import { useCompanyServices } from "@/lib/modules/services/hooks/use-company-services"
import { useCreateCompanyServicePlan } from "@/lib/modules/service-plans/hooks/use-create-company-service-plan"
import { useUpdateCompanyServicePlan } from "@/lib/modules/service-plans/hooks/use-update-company-service-plan"
import { useServicePlanCategoriesCatalog } from "@/lib/modules/service-plans/hooks/use-service-plan-categories-catalog"
import { getCompanyServicePlanById } from "@/lib/modules/service-plans/services/company-service-plans.service"
import { toast } from "@/lib/compat/sonner"
import { isoToLocalDate } from "@/lib/date"
import type { CompanyServicePlan } from "@/lib/types/company-service-plan.types"

interface CreateServicePlanModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  initialPlan?: CompanyServicePlan | null
}

function getFormValuesFromPlan(plan: CompanyServicePlan): CompanyServicePlanFormValues {
  return {
    serviceId: plan.serviceId,
    name: plan.name,
    startDate: plan.startDate ? isoToLocalDate(plan.startDate) : "",
    endDate: plan.endDate ? isoToLocalDate(plan.endDate) : "",
    active: plan.active,
    description: plan.description ?? "",
    categories: plan.categories,
  }
}

export function CreateServicePlanModal({
  open,
  onClose,
  onSuccess,
  initialPlan = null,
}: CreateServicePlanModalProps) {
  const { services } = useCompanyServices()
  const { create, isLoading: isCreateLoading } = useCreateCompanyServicePlan()
  const { update, isLoading: isUpdateLoading } = useUpdateCompanyServicePlan()
  const {
    options: categoryCatalogOptions,
    createCategory,
    isCreating: isCreatingCategory,
    refreshCatalog,
  } = useServicePlanCategoriesCatalog()
  const isEditMode = initialPlan !== null
  const [isLoadingPlanDetail, setIsLoadingPlanDetail] = useState(false)
  const isLoading = isCreateLoading || isUpdateLoading || isLoadingPlanDetail

  const form = useForm<CompanyServicePlanFormValues>({
    resolver: zodResolver(companyServicePlanFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: getCompanyServicePlanFormDefaults(),
  })

  const serviceOptions = useMemo(
    () => services.map((service) => ({ value: service.id, label: service.name })),
    [services]
  )

  const selectedServiceId = form.watch("serviceId")
  const selectedCategories = form.watch("categories") ?? []
  const isServiceSelected = selectedServiceId.trim().length > 0

  const categoryOptions = useMemo(() => {
    const map = new Map(categoryCatalogOptions.map((option) => [option.value, option]))

    selectedCategories.forEach((category) => {
      if (!map.has(category)) {
        map.set(category, { value: category, label: category })
      }
    })

    return Array.from(map.values())
  }, [categoryCatalogOptions, selectedCategories])

  const handleClose = () => {
    form.reset(getCompanyServicePlanFormDefaults())
    onClose()
  }

  useEffect(() => {
    let active = true

    if (!open) {
      setIsLoadingPlanDetail(false)
      form.reset(getCompanyServicePlanFormDefaults())
      return
    }

    if (initialPlan) {
      void refreshCatalog(true)
      setIsLoadingPlanDetail(true)

      void (async () => {
        try {
          const servicePlan = await getCompanyServicePlanById(initialPlan.id)
          if (!active) return

          if (servicePlan) {
            form.reset(getFormValuesFromPlan(servicePlan))
            return
          }

          toast.error("Service plan not found")
          form.reset(getFormValuesFromPlan(initialPlan))
        } catch {
          if (!active) return
          toast.error("Failed to load service plan detail")
          form.reset(getFormValuesFromPlan(initialPlan))
        } finally {
          if (active) setIsLoadingPlanDetail(false)
        }
      })()

      return () => {
        active = false
      }
    }

    void refreshCatalog(true)
    form.reset(getCompanyServicePlanFormDefaults())
    setIsLoadingPlanDetail(false)

    return () => {
      active = false
    }
  }, [open, initialPlan, form, refreshCatalog])

  const onSubmit = form.handleSubmit(async (values) => {
    const payload = {
      serviceId: values.serviceId,
      name: values.name,
      description: values.description,
      startDate: values.startDate || undefined,
      endDate: values.endDate || undefined,
      active: values.active,
      categories: values.categories,
    }

    const saved =
      isEditMode && initialPlan
        ? await update({
            id: initialPlan.id,
            ...payload,
          })
        : await create(payload)

    if (!saved) return

    handleClose()
    onSuccess()
  })

  return (
    <CustomModal
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) handleClose()
      }}
      title={isEditMode ? "Edit Service Plan" : "Add Service Plan"}
      description={
        isEditMode
          ? "Update the selected service plan details"
          : "Create a service plan linked to an existing service"
      }
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
            name="serviceId"
            control={form.control}
            render={({ field, fieldState }) => (
              <div>
                <FloatingSelect
                  label="Service"
                  value={field.value}
                  onChange={(serviceId) => {
                    field.onChange(serviceId)
                    const selectedService = services.find((service) => service.id === serviceId)
                    form.setValue("name", selectedService?.name ?? "", {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }}
                  onBlur={field.onBlur}
                  options={serviceOptions}
                  searchable
                  required
                  hasError={!!fieldState.error}
                />
                {fieldState.error && (
                  <p className="mt-1.5 text-sm text-red-600">{fieldState.error.message}</p>
                )}
              </div>
            )}
          />

          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <div>
                <FloatingInput
                  label="Name"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  hasError={!!fieldState.error}
                  required
                  disabled={!isServiceSelected}
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
                  disabled={!isServiceSelected}
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
                  disabled={!isServiceSelected}
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
                label="Active"
                description="Enable this service plan for operational use"
                disabled={!isServiceSelected}
              />
            </div>
          )}
        />

        <Controller
          name="description"
          control={form.control}
          render={({ field }) => (
            <FloatingTextarea
              label="Description"
              value={field.value ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              rows={4}
              disabled={!isServiceSelected}
            />
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
                isCreatingCategory={isCreatingCategory}
                disabled={!isServiceSelected}
                hasError={!!fieldState.error}
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
          <Button type="submit" variant="primary" loading={isLoading} disabled={!isServiceSelected}>
            {isEditMode ? "Update Service Plan" : "Create Service Plan"}
          </Button>
        </div>
      </form>
    </CustomModal>
  )
}
