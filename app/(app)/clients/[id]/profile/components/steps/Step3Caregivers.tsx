"use client"

import { useEffect, useMemo, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Edit2, Users } from "lucide-react"
import { Button } from "@/components/custom/Button"
import { CustomModal } from "@/components/custom/CustomModal"
import { CustomTable, type CustomTableColumn } from "@/components/custom/CustomTable"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { PremiumSwitch } from "@/components/custom/PremiumSwitch"
import { caregiverFormDefaults, caregiverFormSchema, type CaregiverFormValues } from "@/lib/schemas/caregiver-form.schema"
import {
  caregiverRelationshipOptions,
  type Caregiver,
} from "@/lib/types/caregiver.types"
import { useCaregiversByClient } from "@/lib/modules/caregivers/hooks/use-caregivers-by-client"
import { useCreateCaregiver } from "@/lib/modules/caregivers/hooks/use-create-caregiver"
import { useUpdateCaregiver } from "@/lib/modules/caregivers/hooks/use-update-caregiver"
import { formatPhoneDisplay } from "@/lib/utils/phone-format"
import { cn } from "@/lib/utils"
import type { StepComponentProps } from "@/lib/types/wizard.types"

export function Step3Caregivers({ clientId, isCreateMode = false, onSaveSuccess, onValidationError, registerSubmit, registerValidation }: StepComponentProps) {
  const [isCaregiverModalOpen, setIsCaregiverModalOpen] = useState(false)
  const [editingCaregiver, setEditingCaregiver] = useState<Caregiver | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const resolvedClientId = useMemo(() => {
    if (!isCreateMode && clientId !== "new") {
      return clientId
    }

    if (typeof window === "undefined") {
      return null
    }

    const segments = window.location.pathname.split("/")
    const clientsIndex = segments.findIndex((segment) => segment === "clients")
    const possibleClientId = clientsIndex >= 0 ? segments[clientsIndex + 1] : null

    if (!possibleClientId || possibleClientId === "new") {
      return null
    }

    return possibleClientId
  }, [clientId, isCreateMode])

  const { caregivers, isLoading, error, refetch } = useCaregiversByClient(resolvedClientId)
  const { create, isLoading: isCreating } = useCreateCaregiver()
  const { update, isLoading: isUpdating } = useUpdateCaregiver()

  const form = useForm<CaregiverFormValues>({
    resolver: zodResolver(caregiverFormSchema),
    mode: "onChange",
    defaultValues: caregiverFormDefaults,
  })

  const relationshipOptions = caregiverRelationshipOptions.map((relationship) => ({
    value: relationship,
    label: relationship,
  }))

  const columns: CustomTableColumn<Caregiver>[] = [
    {
      key: "fullName",
      header: "Caregiver",
      render: (caregiver) => `${caregiver.firstName} ${caregiver.lastName}`,
    },
    {
      key: "relationship",
      header: "Relationship",
    },
    {
      key: "phone",
      header: "Phone",
      render: (caregiver) => formatPhoneDisplay(caregiver.phone),
    },
    {
      key: "email",
      header: "Email",
    },
    {
      key: "status",
      header: "Status",
      render: (caregiver) => (
        <span className={caregiver.status
          ? "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
          : "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200"
        }>
          {caregiver.status ? "Active" : "Inactive"}
        </span>
      ),
      align: "center",
    },
    {
      key: "isPrimary",
      header: "Type",
      render: (caregiver) => (
        <span className={caregiver.isPrimary
          ? "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-blue-50 text-[#037ECC] border border-blue-200"
          : "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200"
        }>
          {caregiver.isPrimary ? "Primary" : "Secondary"}
        </span>
      ),
      align: "center",
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (caregiver) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => {
              setEditingCaregiver(caregiver)
              form.reset({
                firstName: caregiver.firstName,
                lastName: caregiver.lastName,
                relationship: caregiver.relationship,
                phone: caregiver.phone,
                email: caregiver.email,
                status: caregiver.status,
                isPrimary: caregiver.isPrimary,
              })
              setIsCaregiverModalOpen(true)
            }}
            className={cn(
              "group/edit relative h-9 w-9",
              "flex items-center justify-center rounded-xl",
              "bg-gradient-to-b from-blue-50 to-blue-100/80",
              "border border-blue-200/60 shadow-sm shadow-blue-900/5",
              "hover:from-blue-100 hover:to-blue-200/90",
              "hover:border-blue-300/80 hover:shadow-md hover:shadow-blue-900/10",
              "hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm",
              "transition-all duration-200 ease-out",
              "focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-2"
            )}
            title="Edit caregiver"
            aria-label="Edit caregiver"
          >
            <Edit2 className="w-4 h-4 text-blue-600 group-hover/edit:text-blue-700 transition-colors duration-200" />
          </button>
        </div>
      ),
    },
  ]

  const totalCount = caregivers.length
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const paginatedCaregivers = useMemo(() => {
    const start = (page - 1) * pageSize
    return caregivers.slice(start, start + pageSize)
  }, [caregivers, page, pageSize])

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  useEffect(() => {
    registerValidation(true)
  }, [registerValidation])

  useEffect(() => {
    registerSubmit(async () => {
      onSaveSuccess({ caregiversCount: caregivers.length })
    })
  }, [caregivers.length, onSaveSuccess, registerSubmit])

  const handleSaveCaregiver = form.handleSubmit(async (values) => {
    if (!resolvedClientId) {
      onValidationError({ general: "Client not found" })
      return
    }

    const result = editingCaregiver
      ? await update(editingCaregiver.id, {
          firstName: values.firstName,
          lastName: values.lastName,
          relationship: values.relationship,
          phone: values.phone,
          email: values.email,
          status: values.status,
          isPrimary: values.isPrimary,
        })
      : await create({
          clientId: resolvedClientId,
          firstName: values.firstName,
          lastName: values.lastName,
          relationship: values.relationship,
          phone: values.phone,
          email: values.email,
          status: values.status,
          isPrimary: values.isPrimary,
        })

    if (!result) {
      return
    }

    form.reset(caregiverFormDefaults)
    setEditingCaregiver(null)
    setIsCaregiverModalOpen(false)
    await refetch()
  }, () => {
    const errors: Record<string, string> = {}
    Object.entries(form.formState.errors).forEach(([key, errorItem]) => {
      if (errorItem && typeof errorItem.message === "string") {
        errors[key] = errorItem.message
      }
    })
    onValidationError(errors)
  })

  if (!resolvedClientId) {
    return (
      <div className="max-w-5xl mx-auto p-8">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <p className="text-amber-700 font-medium">
            Please save the client first before managing caregivers.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Caregivers</h2>
          <p className="text-slate-600 mt-1">Legal parents and caregivers for this patient</p>
        </div>

        <Button
          type="button"
          onClick={() => {
            setEditingCaregiver(null)
            form.reset(caregiverFormDefaults)
            setIsCaregiverModalOpen(true)
          }}
        >
          New caregiver
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error.message}
        </div>
      )}

      <CustomTable
        columns={columns}
        data={paginatedCaregivers}
        isLoading={isLoading}
        emptyMessage="No caregivers added yet"
        emptyContent={
          <div className="flex flex-col items-center justify-center gap-3 py-10">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <Users className="h-8 w-8 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-700">No caregivers available</p>
            <p className="max-w-md text-center text-sm text-slate-500">
              Add at least one legal parent or caregiver to keep this patient profile complete.
            </p>
          </div>
        }
        getRowKey={(caregiver) => caregiver.id}
        pagination={{
          page,
          pageSize,
          total: totalCount,
          onPageChange: setPage,
          onPageSizeChange: (newPageSize) => {
            setPageSize(newPageSize)
            setPage(1)
          },
          pageSizeOptions: [10, 25, 50],
        }}
      />

      <CustomModal
        open={isCaregiverModalOpen}
        onOpenChange={(open) => {
          setIsCaregiverModalOpen(open)
          if (!open) {
            setEditingCaregiver(null)
            form.reset(caregiverFormDefaults)
          }
        }}
        title={editingCaregiver ? "Edit caregiver" : "New caregiver"}
        description={editingCaregiver ? "Update legal parent or caregiver information" : "Add legal parent or caregiver information"}
        maxWidthClassName="sm:max-w-[760px]"
      >
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void handleSaveCaregiver()
          }}
          className="px-6 py-6"
        >
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Controller
              name="firstName"
              control={form.control}
              render={({ field, fieldState }) => (
                <div>
                  <FloatingInput
                    label="First Name"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    hasError={!!fieldState.error}
                    required
                  />
                  {fieldState.error && <p className="mt-2 text-sm text-red-600">{fieldState.error.message}</p>}
                </div>
              )}
            />

            <Controller
              name="lastName"
              control={form.control}
              render={({ field, fieldState }) => (
                <div>
                  <FloatingInput
                    label="Last Name"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    hasError={!!fieldState.error}
                    required
                  />
                  {fieldState.error && <p className="mt-2 text-sm text-red-600">{fieldState.error.message}</p>}
                </div>
              )}
            />

            <Controller
              name="relationship"
              control={form.control}
              render={({ field, fieldState }) => (
                <div>
                  <FloatingSelect
                    label="Relationship"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    options={relationshipOptions}
                    hasError={!!fieldState.error}
                    required
                  />
                  {fieldState.error && <p className="mt-2 text-sm text-red-600">{fieldState.error.message}</p>}
                </div>
              )}
            />

            <Controller
              name="phone"
              control={form.control}
              render={({ field, fieldState }) => (
                <div>
                  <FloatingInput
                    label="Phone"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    type="tel"
                    inputMode="tel"
                    hasError={!!fieldState.error}
                    required
                  />
                  {fieldState.error && <p className="mt-2 text-sm text-red-600">{fieldState.error.message}</p>}
                </div>
              )}
            />

            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <div className="md:col-span-2">
                  <FloatingInput
                    label="Email"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    type="email"
                    inputMode="email"
                    hasError={!!fieldState.error}
                    required
                  />
                  {fieldState.error && <p className="mt-2 text-sm text-red-600">{fieldState.error.message}</p>}
                </div>
              )}
            />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Controller
              name="status"
              control={form.control}
              render={({ field }) => (
                <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
                  <PremiumSwitch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    label={field.value ? "Active" : "Inactive"}
                    description="Control caregiver availability"
                    variant="default"
                  />
                </div>
              )}
            />

            <Controller
              name="isPrimary"
              control={form.control}
              render={({ field }) => (
                <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
                  <PremiumSwitch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    label={field.value ? "Primary" : "Secondary"}
                    description="Set caregiver role priority"
                    variant="default"
                  />
                </div>
              )}
            />
          </div>

          <div className="mt-8 flex items-center justify-end gap-3 border-t border-slate-200 pt-5">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsCaregiverModalOpen(false)
                setEditingCaregiver(null)
                form.reset(caregiverFormDefaults)
              }}
              disabled={isCreating || isUpdating}
            >
              Cancel
            </Button>
            <Button type="submit" loading={isCreating || isUpdating} disabled={isCreating || isUpdating}>
              {editingCaregiver ? "Update caregiver" : "Save caregiver"}
            </Button>
          </div>
        </form>
      </CustomModal>
    </div>
  )
}
