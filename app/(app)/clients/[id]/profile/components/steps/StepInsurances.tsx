"use client"

import { useEffect, useMemo, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Edit2, Shield, Trash2 } from "lucide-react"
import { format, parseISO } from "date-fns"
import { Button } from "@/components/custom/Button"
import { CustomModal } from "@/components/custom/CustomModal"
import { CustomTable, type CustomTableColumn } from "@/components/custom/CustomTable"
import { DeleteConfirmModal } from "@/components/custom/DeleteConfirmModal"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { PremiumDatePicker } from "@/components/custom/PremiumDatePicker"
import { PremiumSwitch } from "@/components/custom/PremiumSwitch"
import {
  clientInsuranceFormDefaults,
  clientInsuranceFormSchema,
  INSURANCE_RELATIONSHIPS,
  type ClientInsuranceFormValues,
} from "@/lib/schemas/client-insurance-form.schema"
import type { ClientInsurance } from "@/lib/types/client-insurance.types"
import { useClientInsurancesByClient } from "@/lib/modules/client-insurances/hooks/use-client-insurances-by-client"
import { useCreateClientInsurance } from "@/lib/modules/client-insurances/hooks/use-create-client-insurance"
import { useUpdateClientInsurance } from "@/lib/modules/client-insurances/hooks/use-update-client-insurance"
import { useDeleteClientInsurance } from "@/lib/modules/client-insurances/hooks/use-delete-client-insurance"
import { usePayers } from "@/lib/modules/payers/hooks/use-payers"
import { cn } from "@/lib/utils"
import type { StepComponentProps } from "@/lib/types/wizard.types"

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "-"
  try {
    return format(parseISO(dateStr), "MM/dd/yyyy")
  } catch {
    return dateStr
  }
}

export function StepInsurances({
  clientId,
  isCreateMode = false,
  onSaveSuccess,
  onValidationError,
  onProgressUpdate,
  registerSubmit,
  registerValidation,
  onStepStatusChange,
}: StepComponentProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingInsurance, setEditingInsurance] = useState<ClientInsurance | null>(null)
  const [deletingInsurance, setDeletingInsurance] = useState<ClientInsurance | null>(null)
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

  const { insurances, isLoading, error, refetch } = useClientInsurancesByClient(resolvedClientId)
  const { create, isLoading: isCreating } = useCreateClientInsurance()
  const { update, isLoading: isUpdating } = useUpdateClientInsurance()
  const { remove, isLoading: isRemoving } = useDeleteClientInsurance()
  const { payers, isLoading: isLoadingPayers } = usePayers("", 0, 200)

  const form = useForm<ClientInsuranceFormValues>({
    resolver: zodResolver(clientInsuranceFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: clientInsuranceFormDefaults,
  })

  const payerOptions = useMemo(
    () => payers.map((payer) => ({ value: payer.id, label: payer.name })),
    [payers]
  )

  const payerMap = useMemo(
    () => new Map(payers.map((payer) => [payer.id, payer])),
    [payers]
  )

  const relationshipOptions = useMemo(
    () => INSURANCE_RELATIONSHIPS.map((rel) => ({ value: rel, label: rel })),
    []
  )

  const totalCount = insurances.length
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  const paginatedInsurances = useMemo(() => {
    const start = (page - 1) * pageSize
    return insurances.slice(start, start + pageSize)
  }, [insurances, page, pageSize])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  useEffect(() => {
    registerValidation(true)
  }, [registerValidation])

  useEffect(() => {
    registerSubmit(async () => {
      onSaveSuccess({ insurancesCount: insurances.length })
    })
  }, [insurances.length, onSaveSuccess, registerSubmit])

  useEffect(() => {
    onStepStatusChange?.("insurances", insurances.length > 0 ? "COMPLETE" : "PENDING")
  }, [insurances.length, onStepStatusChange])

  const getInsuranceFormValues = (insurance: ClientInsurance): ClientInsuranceFormValues => ({
    payerId: insurance.payerId,
    memberNumber: insurance.memberNumber,
    groupNumber: insurance.groupNumber ?? "",
    relationship: insurance.relationship,
    isActive: insurance.isActive,
    isPrimary: insurance.isPrimary,
    effectiveDate: insurance.effectiveDate,
    terminationDate: insurance.terminationDate ?? "",
    comments: insurance.comments ?? "",
  })

  const columns: CustomTableColumn<ClientInsurance>[] = [
    {
      key: "payerName",
      header: "Payer",
      className: "whitespace-nowrap",
      render: (insurance) => {
        const payer = payerMap.get(insurance.payerId)
        const name = insurance.payerName || payer?.name || "-"
        return (
          <span className="block min-w-0 truncate whitespace-nowrap font-medium" title={name}>
            {name}
          </span>
        )
      },
    },
    {
      key: "memberNumber",
      header: "Member / Policy #",
      className: "whitespace-nowrap",
      render: (insurance) => (
        <span className="inline-block whitespace-nowrap tabular-nums text-slate-700">
          {insurance.memberNumber}
        </span>
      ),
    },
    {
      key: "relationship",
      header: "Relationship",
      className: "whitespace-nowrap",
      render: (insurance) => insurance.relationship,
    },
    {
      key: "effectiveDate",
      header: "Effective date",
      className: "whitespace-nowrap",
      render: (insurance) => formatDate(insurance.effectiveDate),
    },
    {
      key: "terminationDate",
      header: "Termination date",
      className: "whitespace-nowrap",
      render: (insurance) => formatDate(insurance.terminationDate),
    },
    {
      key: "status",
      header: "Status",
      className: "whitespace-nowrap",
      align: "center",
      render: (insurance) => {
        if (insurance.isActive) {
          return (
            <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Active
            </span>
          )
        }
        return (
          <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
            Inactive
          </span>
        )
      },
    },
    {
      key: "actions",
      header: "Actions",
      className: "whitespace-nowrap",
      align: "right",
      render: (insurance) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => {
              setEditingInsurance(insurance)
              form.reset(getInsuranceFormValues(insurance))
              setIsModalOpen(true)
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
            title="Edit insurance"
            aria-label="Edit insurance"
          >
            <Edit2 className="w-4 h-4 text-blue-600 group-hover/edit:text-blue-700 transition-colors duration-200" />
          </button>
          <button
            onClick={() => {
              setDeletingInsurance(insurance)
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
            title="Remove insurance"
            aria-label="Remove insurance"
          >
            <Trash2 className="w-4 h-4 text-red-600 group-hover/delete:text-red-700 transition-colors duration-200" />
          </button>
        </div>
      ),
    },
  ]

  const handleSave = form.handleSubmit(
    async (values) => {
      if (!resolvedClientId) {
        onValidationError({ general: "Client not found" })
        return
      }

      if (editingInsurance) {
        const result = await update({
          id: editingInsurance.id,
          payerId: values.payerId,
          memberNumber: values.memberNumber,
          groupNumber: values.groupNumber,
          relationship: values.relationship,
          isActive: values.isActive,
          isPrimary: values.isPrimary,
          effectiveDate: values.effectiveDate,
          terminationDate: values.terminationDate,
          comments: values.comments,
        })

        if (!result) return
      } else {
        const result = await create({
          clientId: resolvedClientId,
          payerId: values.payerId,
          memberNumber: values.memberNumber,
          groupNumber: values.groupNumber,
          relationship: values.relationship,
          isActive: values.isActive,
          isPrimary: values.isPrimary,
          effectiveDate: values.effectiveDate,
          terminationDate: values.terminationDate,
          comments: values.comments,
        })

        if (!result) return
      }

      form.reset(clientInsuranceFormDefaults)
      setEditingInsurance(null)
      setIsModalOpen(false)
      await refetch()
    },
    () => {
      const errors: Record<string, string> = {}
      Object.entries(form.formState.errors).forEach(([key, errorItem]) => {
        if (errorItem && typeof errorItem.message === "string") {
          errors[key] = errorItem.message
        }
      })
      onValidationError(errors)
    }
  )

  const handleConfirmDelete = async () => {
    if (!deletingInsurance) return
    const progress = await remove(deletingInsurance.id)
    if (progress === null) return
    onProgressUpdate?.(progress)
    setIsDeleteModalOpen(false)
    setDeletingInsurance(null)
    await refetch()
  }

  if (!resolvedClientId) {
    return (
      <div className="w-full p-8">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <p className="text-amber-700 font-medium">
            Please save the client first before managing insurances.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full px-6 py-8 sm:px-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Insurances</h2>
          <p className="text-slate-600 mt-1">Insurance policies associated with this client</p>
        </div>

        <Button
          type="button"
          onClick={() => {
            setEditingInsurance(null)
            form.reset({
              ...clientInsuranceFormDefaults,
              isActive: insurances.length === 0,
              isPrimary: insurances.length === 0,
            })
            setIsModalOpen(true)
          }}
        >
          New insurance
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error.message}
        </div>
      )}

      <CustomTable
        columns={columns}
        data={paginatedInsurances}
        isLoading={isLoading}
        emptyMessage="No insurances added yet"
        hideEmptyIcon
        emptyContent={
          <div className="flex flex-col items-center justify-center gap-3 py-10">
            <div className="relative mb-1">
              <div className="absolute inset-0 rounded-full bg-[#037ECC]/10 blur-2xl" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-[#037ECC]/20 bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10">
                <Shield className="h-10 w-10 text-[#037ECC]/60" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-700">No insurances available</p>
            <p className="max-w-md text-center text-sm text-slate-500">
              Add at least one insurance policy to keep this client profile complete.
            </p>
          </div>
        }
        getRowKey={(insurance) => insurance.id}
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
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open)
          if (!open) {
            setEditingInsurance(null)
            form.reset(clientInsuranceFormDefaults)
          }
        }}
        title={editingInsurance ? "Edit insurance" : "New insurance"}
        description={
          editingInsurance
            ? "Update insurance policy information"
            : "Add a new insurance policy for this client"
        }
        maxWidthClassName="sm:max-w-[760px]"
      >
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void handleSave()
          }}
          noValidate
          className="px-6 py-6"
        >
          <div className="grid grid-cols-1 gap-5">
            <Controller
              name="payerId"
              control={form.control}
              render={({ field, fieldState }) => (
                <div>
                  <FloatingSelect
                    label="Payer"
                    value={field.value || ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    options={payerOptions}
                    hasError={!!fieldState.error}
                    disabled={isLoadingPayers}
                    required
                  />
                  {fieldState.error && (
                    <p className="mt-2 text-sm text-red-600">{fieldState.error.message}</p>
                  )}
                </div>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3 mt-5">
            <Controller
              name="memberNumber"
              control={form.control}
              render={({ field, fieldState }) => (
                <div className="md:col-span-2">
                  <FloatingInput
                    label="Member / Policy number"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    inputMode="numeric"
                    hasError={!!fieldState.error}
                    required
                  />
                  {fieldState.error && (
                    <p className="mt-2 text-sm text-red-600">{fieldState.error.message}</p>
                  )}
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
                    value={field.value || ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    options={relationshipOptions}
                    hasError={!!fieldState.error}
                    required
                  />
                  {fieldState.error && (
                    <p className="mt-2 text-sm text-red-600">{fieldState.error.message}</p>
                  )}
                </div>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3 mt-5">
            <Controller
              name="groupNumber"
              control={form.control}
              render={({ field, fieldState }) => (
                <div>
                  <FloatingInput
                    label="Group number"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    hasError={!!fieldState.error}
                  />
                  {fieldState.error && (
                    <p className="mt-2 text-sm text-red-600">{fieldState.error.message}</p>
                  )}
                </div>
              )}
            />

            <Controller
              name="effectiveDate"
              control={form.control}
              render={({ field, fieldState }) => (
                <div>
                  <PremiumDatePicker
                    label="Effective date"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    onClear={() => field.onChange("")}
                    hasError={!!fieldState.error}
                    errorMessage={fieldState.error?.message}
                    required
                  />
                </div>
              )}
            />

            <Controller
              name="terminationDate"
              control={form.control}
              render={({ field, fieldState }) => (
                <div>
                  <PremiumDatePicker
                    label="Termination date"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    onClear={() => field.onChange("")}
                    hasError={!!fieldState.error}
                    errorMessage={fieldState.error?.message}
                  />
                </div>
              )}
            />
          </div>

          <div className="mt-6">
            <Controller
              name="isActive"
              control={form.control}
              render={({ field }) => (
                <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 max-w-sm">
                  <PremiumSwitch
                    checked={Boolean(field.value)}
                    onCheckedChange={field.onChange}
                    label={field.value ? "Active" : "Inactive"}
                    description="Control insurance availability"
                    variant="default"
                  />
                </div>
              )}
            />
          </div>

          <div className="mt-5">
            <Controller
              name="comments"
              control={form.control}
              render={({ field, fieldState }) => (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Comments
                  </label>
                  <textarea
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    maxLength={500}
                    rows={3}
                    placeholder="Enter comments"
                    className={cn(
                      "w-full resize-y rounded-[16px] px-4 py-3 text-sm text-slate-800",
                      "bg-gradient-to-b from-[hsl(240_20%_99%)] to-[hsl(240_18%_96%)]",
                      "border border-[hsl(240_20%_88%/0.6)]",
                      "shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_1px_2px_rgba(15,23,42,0.04)]",
                      "placeholder:text-slate-400",
                      "focus:outline-none focus:border-[hsl(var(--primary))]",
                      "focus:shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_0_0_4px_hsl(var(--primary)/0.12)]",
                      "transition-all duration-200",
                      fieldState.error && "border-2 border-red-500/70"
                    )}
                  />
                  <div className="flex items-center justify-between mt-1">
                    {fieldState.error ? (
                      <p className="text-sm text-red-600">{fieldState.error.message}</p>
                    ) : (
                      <span />
                    )}
                    <p className="text-xs text-slate-400 text-right">
                      {(field.value ?? "").length}/500
                    </p>
                  </div>
                </div>
              )}
            />
          </div>

          <div className="mt-8 flex items-center justify-end border-t border-slate-200 pt-5">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsModalOpen(false)
                  setEditingInsurance(null)
                  form.reset(clientInsuranceFormDefaults)
                }}
                disabled={isCreating || isUpdating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={isCreating || isUpdating}
                disabled={isCreating || isUpdating}
              >
                {editingInsurance ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </form>
      </CustomModal>

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setDeletingInsurance(null)
        }}
        onConfirm={() => void handleConfirmDelete()}
        title="Remove insurance"
        message="Are you sure you want to remove this insurance from the client?"
        itemName={deletingInsurance?.payerName || undefined}
        isDeleting={isRemoving}
      />
    </div>
  )
}
