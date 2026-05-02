"use client"

import { useEffect, useMemo, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Edit2, Trash2, Users } from "lucide-react"
import { Button } from "@/components/custom/Button"
import { CustomModal } from "@/components/custom/CustomModal"
import { CustomTable, type CustomTableColumn } from "@/components/custom/CustomTable"
import { DeleteConfirmModal } from "@/components/custom/DeleteConfirmModal"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { PremiumSwitch } from "@/components/custom/PremiumSwitch"
import { caregiverFormDefaults, caregiverFormSchema, type CaregiverFormValues } from "@/lib/schemas/caregiver-form.schema"
import type { Caregiver } from "@/lib/types/caregiver.types"
import { useCaregiversByClient } from "@/lib/modules/caregivers/hooks/use-caregivers-by-client"
import { useCreateCaregiver } from "@/lib/modules/caregivers/hooks/use-create-caregiver"
import { useUpdateCaregiver } from "@/lib/modules/caregivers/hooks/use-update-caregiver"
import { useRemoveCaregiver } from "@/lib/modules/caregivers/hooks/use-remove-caregiver"
import { useRelationshipCatalog } from "@/lib/modules/relationships/hooks/use-relationship-catalog"
import { formatPhoneDisplay, formatPhoneInput } from "@/lib/utils/phone-format"
import { cn } from "@/lib/utils"
import type { StepComponentProps } from "@/lib/types/wizard.types"

export function Step3Caregivers({ clientId, isCreateMode = false, onSaveSuccess, onValidationError, onProgressUpdate, registerSubmit, registerValidation, onStepStatusChange }: StepComponentProps) {
  const [isCaregiverModalOpen, setIsCaregiverModalOpen] = useState(false)
  const [editingCaregiver, setEditingCaregiver] = useState<Caregiver | null>(null)
  const [deletingCaregiver, setDeletingCaregiver] = useState<Caregiver | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
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
  const { remove, isLoading: isRemoving } = useRemoveCaregiver()
  const { relationships, isLoading: isLoadingRelationships, error: relationshipError } = useRelationshipCatalog()

  const form = useForm<CaregiverFormValues>({
    resolver: zodResolver(caregiverFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: caregiverFormDefaults,
  })

  const relationshipOptions = useMemo(() => relationships.map((relationship) => ({
    value: relationship.id,
    label: relationship.name,
  })), [relationships])

  const relationshipNameById = useMemo(() => new Map(
    relationships.map((relationship) => [relationship.id, relationship.name])
  ), [relationships])

  const relationshipIdByName = useMemo(() => new Map(
    relationships.map((relationship) => [relationship.name, relationship.id])
  ), [relationships])

  const hasPrimaryCaregiver = useMemo(
    () => caregivers.some((caregiver) => caregiver.isPrimary),
    [caregivers]
  )

  const isCreatePrimaryLocked = !editingCaregiver && hasPrimaryCaregiver

  const getCaregiverFullName = (caregiver: Caregiver) => {
    const fullName = caregiver.fullName?.trim()
    if (fullName) {
      return fullName
    }

    const composedName = [caregiver.firstName, caregiver.lastName]
      .map((value) => value?.trim() ?? "")
      .filter(Boolean)
      .join(" ")

    return composedName || "-"
  }

  const getCaregiverFormValues = (caregiver: Caregiver): CaregiverFormValues => ({
    firstName: caregiver.firstName ?? "",
    lastName: caregiver.lastName ?? "",
    relationshipId: caregiver.relationshipId || relationshipIdByName.get(caregiver.relationship || "") || "",
    phone: caregiver.phone || caregiver.phoneNumber || "",
    email: caregiver.email ?? "",
    status: caregiver.status ?? true,
    isPrimary: caregiver.isPrimary ?? true,
  })

  const columns: CustomTableColumn<Caregiver>[] = [
    {
      key: "fullName",
      header: "Name",
      className: "min-w-[140px] w-[22%]",
      render: (caregiver) => (
        <span className="block min-w-0 truncate whitespace-nowrap" title={getCaregiverFullName(caregiver)}>
          {getCaregiverFullName(caregiver)}
        </span>
      ),
    },
    {
      key: "relationship",
      header: "Relationship",
      className: "min-w-[110px] w-[15%] whitespace-nowrap",
      render: (caregiver) => caregiver.relationship || relationshipNameById.get(caregiver.relationshipId) || "-",
    },
    {
      key: "phoneNumber",
      header: "Phone Number",
      className: "min-w-[140px] w-[16%]",
      render: (caregiver) => {
        const phoneNumber = caregiver.phone || caregiver.phoneNumber
        return phoneNumber
          ? (
            <span className="inline-block whitespace-nowrap font-medium tabular-nums tracking-[0.01em] text-slate-700" title={formatPhoneDisplay(phoneNumber)}>
              {formatPhoneDisplay(phoneNumber)}
            </span>
          )
          : "-"
      },
    },
    {
      key: "email",
      header: "Email",
      className: "min-w-[140px] w-[22%]",
      render: (caregiver) => (
        <span className="block min-w-0 truncate whitespace-nowrap" title={caregiver.email || "-"}>
          {caregiver.email || "-"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      className: "min-w-[88px] w-[10%] whitespace-nowrap",
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
      className: "min-w-[96px] w-[10%] whitespace-nowrap",
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
      className: "min-w-[88px] w-[5%] whitespace-nowrap",
      align: "right",
      render: (caregiver) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => {
              setEditingCaregiver(caregiver)
              form.reset(getCaregiverFormValues(caregiver))
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
          <button
            onClick={() => {
              setDeletingCaregiver(caregiver)
              setIsDeleteModalOpen(true)
            }}
            className={cn(
              "group/delete relative h-9 w-9",
              "flex items-center justify-center rounded-xl",
              "bg-gradient-to-b from-red-50 to-red-100/80",
              "border border-red-200/60 shadow-sm shadow-red-900/5",
              "hover:from-red-100 hover:to-red-200/90",
              "hover:border-red-300/80 hover:shadow-md hover:shadow-red-900/10",
              "hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm",
              "transition-all duration-200 ease-out",
              "focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:ring-offset-2"
            )}
            title="Remove caregiver"
            aria-label="Remove caregiver"
          >
            <Trash2 className="w-4 h-4 text-red-600 group-hover/delete:text-red-700 transition-colors duration-200" />
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

  useEffect(() => {
    onStepStatusChange?.("caregivers", caregivers.length > 0 ? "COMPLETE" : "PENDING")
  }, [caregivers.length, onStepStatusChange])

  const handleSaveCaregiver = form.handleSubmit(async (values) => {
    if (!resolvedClientId) {
      onValidationError({ general: "Client not found" })
      return
    }

    const result = editingCaregiver
      ? await update(editingCaregiver.id, {
          firstName: values.firstName,
          lastName: values.lastName,
          relationshipId: values.relationshipId,
          phone: values.phone,
          email: values.email,
          status: values.status,
          isPrimary: values.isPrimary,
        })
      : await create({
          clientId: resolvedClientId,
          firstName: values.firstName,
          lastName: values.lastName,
          relationshipId: values.relationshipId,
          phone: values.phone,
          email: values.email,
          status: values.status,
          isPrimary: values.isPrimary,
        })

    if (!result) {
      return
    }

    if (typeof result.progress === "number") {
      onProgressUpdate?.(result.progress)
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

  const handleConfirmRemove = async () => {
    if (!deletingCaregiver) return
    const progress = await remove(deletingCaregiver.id)
    if (progress === null) return
    onProgressUpdate?.(progress)
    setIsDeleteModalOpen(false)
    setDeletingCaregiver(null)
    await refetch()
  }

  if (!resolvedClientId) {
    return (
    <div className="w-full p-8 overflow-x-auto">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <p className="text-amber-700 font-medium">
            Please save the client first before managing caregivers.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full px-6 py-8 sm:px-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Caregivers</h2>
          <p className="text-slate-600 mt-1">Legal parents and caregivers for this patient</p>
        </div>

        <Button
          type="button"
          onClick={() => {
            setEditingCaregiver(null)
            form.reset({
              ...caregiverFormDefaults,
              isPrimary: !hasPrimaryCaregiver,
            })
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

      {relationshipError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {relationshipError.message}
        </div>
      )}

      <CustomTable
        columns={columns}
        data={paginatedCaregivers}
        isLoading={isLoading}
        emptyMessage="No caregivers added yet"
        hideEmptyIcon
        emptyContent={
          <div className="flex flex-col items-center justify-center gap-3 py-10">
            <div className="relative mb-1">
              <div className="absolute inset-0 rounded-full bg-[#037ECC]/10 blur-2xl" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-[#037ECC]/20 bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10">
                <Users className="h-10 w-10 text-[#037ECC]/60" />
              </div>
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
        allowSelectOverflow
        contentClassName="overflow-visible"
      >
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void handleSaveCaregiver()
          }}
          noValidate
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
                    value={field.value ?? ""}
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
                    value={field.value ?? ""}
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
              name="relationshipId"
              control={form.control}
              render={({ field, fieldState }) => (
                <div>
                  <FloatingSelect
                    label="Relationship"
                    value={field.value || ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    options={relationshipOptions}
                    hasError={!!fieldState.error}
                    disabled={isLoadingRelationships}
                    searchable
                    required
                  />
                  {fieldState.error && <p className="mt-2 text-sm text-red-600">{fieldState.error.message}</p>}
                </div>
              )}
            />

            <Controller
              key={`caregiver-phone-${editingCaregiver?.id ?? "new"}-${isCaregiverModalOpen ? "open" : "closed"}`}
              name="phone"
              control={form.control}
              render={({ field, fieldState }) => {
                const [displayValue, setDisplayValue] = useState(formatPhoneInput(field.value ?? ""))

                return (
                  <div>
                    <FloatingInput
                      label="Phone"
                      value={displayValue}
                      onChange={(value) => {
                        const formatted = formatPhoneInput(value, displayValue)
                        setDisplayValue(formatted)
                        field.onChange(formatted)
                      }}
                      onBlur={field.onBlur}
                      placeholder="(305) 555-1234"
                      type="tel"
                      inputMode="tel"
                      hasError={!!fieldState.error}
                      required
                    />
                    {fieldState.error && <p className="mt-2 text-sm text-red-600">{fieldState.error.message}</p>}
                  </div>
                )
              }}
            />

            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <div className="md:col-span-2">
                  <FloatingInput
                    label="Email"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    type="text"
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
                    checked={Boolean(field.value)}
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
                    checked={Boolean(field.value)}
                    onCheckedChange={field.onChange}
                    label={field.value ? "Primary" : "Secondary"}
                    description={isCreatePrimaryLocked
                      ? "A primary caregiver already exists"
                      : "Set caregiver role priority"
                    }
                    disabled={isCreatePrimaryLocked}
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

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setDeletingCaregiver(null)
        }}
        onConfirm={() => void handleConfirmRemove()}
        title="Remove caregiver"
        message="Are you sure you want to remove this caregiver from the client?"
        itemName={deletingCaregiver ? getCaregiverFullName(deletingCaregiver) : undefined}
        isDeleting={isRemoving}
      />
    </div>
  )
}
