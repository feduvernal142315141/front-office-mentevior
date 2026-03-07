"use client"

import { useEffect, useMemo, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Activity, Edit2 } from "lucide-react"
import { Button } from "@/components/custom/Button"
import { CustomModal } from "@/components/custom/CustomModal"
import { CustomTable, type CustomTableColumn } from "@/components/custom/CustomTable"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { PremiumDatePicker } from "@/components/custom/PremiumDatePicker"
import { PremiumSwitch } from "@/components/custom/PremiumSwitch"
import {
  diagnosisFormDefaults,
  diagnosisFormSchema,
  type DiagnosisFormValues,
} from "@/lib/schemas/diagnosis-form.schema"
import { useDiagnosesByClient } from "@/lib/modules/diagnoses/hooks/use-diagnoses-by-client"
import { useCreateDiagnosis } from "@/lib/modules/diagnoses/hooks/use-create-diagnosis"
import { useUpdateDiagnosis } from "@/lib/modules/diagnoses/hooks/use-update-diagnosis"
import type { Diagnosis } from "@/lib/types/diagnosis.types"
import type { StepComponentProps } from "@/lib/types/wizard.types"
import { dateToISO, formatDateDisplay } from "@/lib/utils/date"
import { isoToLocalDate } from "@/lib/date"
import { cn } from "@/lib/utils"

export function Step6Diagnoses({
  clientId,
  isCreateMode = false,
  onSaveSuccess,
  onValidationError,
  registerSubmit,
  registerValidation,
}: StepComponentProps) {
  const [isDiagnosisModalOpen, setIsDiagnosisModalOpen] = useState(false)
  const [editingDiagnosis, setEditingDiagnosis] = useState<Diagnosis | null>(null)
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

  const { diagnoses, isLoading, error, refetch } = useDiagnosesByClient(resolvedClientId)
  const { create, isLoading: isCreating } = useCreateDiagnosis()
  const { update, isLoading: isUpdating } = useUpdateDiagnosis()

  const form = useForm<DiagnosisFormValues>({
    resolver: zodResolver(diagnosisFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: diagnosisFormDefaults,
  })

  const columns: CustomTableColumn<Diagnosis>[] = [
    {
      key: "code",
      header: "Code",
    },
    {
      key: "name",
      header: "Name",
    },
    {
      key: "referralDate",
      header: "Referral Date",
      render: (diagnosis) =>
        diagnosis.referralDate
          ? formatDateDisplay(isoToLocalDate(diagnosis.referralDate))
          : "—",
    },
    {
      key: "status",
      header: "Status",
      render: (diagnosis) => (
        <span className={diagnosis.status
          ? "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
          : "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200"
        }>
          {diagnosis.status ? "Active" : "Inactive"}
        </span>
      ),
      align: "center",
    },
    {
      key: "isPrimary",
      header: "Type",
      render: (diagnosis) => (
        <span className={diagnosis.isPrimary
          ? "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-blue-50 text-[#037ECC] border border-blue-200"
          : "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200"
        }>
          {diagnosis.isPrimary ? "Primary" : "Secondary"}
        </span>
      ),
      align: "center",
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (diagnosis) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => {
              setEditingDiagnosis(diagnosis)
              const resetValues = {
                code: diagnosis.code ?? "",
                name: diagnosis.name ?? "",
                referralDate: diagnosis.referralDate ? isoToLocalDate(diagnosis.referralDate) : "",
                treatmentStartDate: diagnosis.treatmentStartDate ? isoToLocalDate(diagnosis.treatmentStartDate) : "",
                status: Boolean(diagnosis.status),
                treatmentEndDate: diagnosis.treatmentEndDate ? isoToLocalDate(diagnosis.treatmentEndDate) : "",
                isPrimary: Boolean(diagnosis.isPrimary),
              }
              form.reset(resetValues)
              setIsDiagnosisModalOpen(true)
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
            title="Edit diagnosis"
            aria-label="Edit diagnosis"
          >
            <Edit2 className="w-4 h-4 text-blue-600 group-hover/edit:text-blue-700 transition-colors duration-200" />
          </button>
        </div>
      ),
    },
  ]

  const totalCount = diagnoses.length
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const paginatedDiagnoses = useMemo(() => {
    const start = (page - 1) * pageSize
    return diagnoses.slice(start, start + pageSize)
  }, [diagnoses, page, pageSize])

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
      onSaveSuccess({ diagnosesCount: diagnoses.length })
    })
  }, [diagnoses.length, onSaveSuccess, registerSubmit])

  const handleSaveDiagnosis = form.handleSubmit(async (values) => {
    if (!resolvedClientId) {
      onValidationError({ general: "Client not found" })
      return
    }

    const currentDate = dateToISO(new Date())

    if (currentDate && values.treatmentStartDate > currentDate) {
      const message = "Treatment start date is later than the current date"
      form.setError("treatmentStartDate", {
        type: "manual",
        message,
      })
      onValidationError({ treatmentStartDate: message })
      return
    }

    const payload = {
      code: values.code,
      name: values.name,
      referralDate: values.referralDate,
      treatmentStartDate: values.treatmentStartDate,
      status: values.status,
      treatmentEndDate: values.treatmentEndDate || undefined,
      isPrimary: values.isPrimary,
    }

    const ok = editingDiagnosis
      ? await update(editingDiagnosis.id, payload)
      : await create({
          clientId: resolvedClientId,
          ...payload,
        })

    if (!ok) {
      return
    }

    form.reset(diagnosisFormDefaults)
    setEditingDiagnosis(null)
    setIsDiagnosisModalOpen(false)
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
            Please save the client first before managing diagnoses.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Diagnoses</h2>
          <p className="text-slate-600 mt-1">Client diagnoses and treatment dates</p>
        </div>

        <Button
          type="button"
          onClick={() => {
            setEditingDiagnosis(null)
            form.reset(diagnosisFormDefaults)
            setIsDiagnosisModalOpen(true)
          }}
        >
          New diagnosis
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error.message}
        </div>
      )}

      <CustomTable
        columns={columns}
        data={paginatedDiagnoses}
        isLoading={isLoading}
        emptyMessage="No diagnoses added yet"
        hideEmptyIcon
        emptyContent={
          <div className="flex flex-col items-center justify-center gap-3 py-10">
            <div className="relative mb-1">
              <div className="absolute inset-0 rounded-full bg-[#037ECC]/10 blur-2xl" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-[#037ECC]/20 bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10">
                <Activity className="h-10 w-10 text-[#037ECC]/60" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-700">No diagnoses available</p>
            <p className="max-w-md text-center text-sm text-slate-500">
              Add at least one diagnosis to keep this client profile complete.
            </p>
          </div>
        }
        getRowKey={(diagnosis) => diagnosis.id}
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
        open={isDiagnosisModalOpen}
        onOpenChange={(open) => {
          setIsDiagnosisModalOpen(open)
          if (!open) {
            setEditingDiagnosis(null)
            form.reset(diagnosisFormDefaults)
          }
        }}
        title={editingDiagnosis ? "Edit diagnosis" : "New diagnosis"}
        description={editingDiagnosis ? "Update diagnosis details" : "Add diagnosis details"}
        maxWidthClassName="sm:max-w-[760px]"
      >
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void handleSaveDiagnosis()
          }}
          className="px-6 py-6"
        >
          {Object.keys(form.formState.errors).length > 0 && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {Object.entries(form.formState.errors).map(([key, err]) => (
                <p key={key}>{String(err?.message ?? key)}</p>
              ))}
            </div>
          )}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Controller
              name="code"
              control={form.control}
              render={({ field, fieldState }) => (
                <div>
                  <FloatingInput
                    label="Code"
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
                  />
                  {fieldState.error && <p className="mt-2 text-sm text-red-600">{fieldState.error.message}</p>}
                </div>
              )}
            />

            <Controller
              name="referralDate"
              control={form.control}
              render={({ field, fieldState }) => (
                <PremiumDatePicker
                  label="Referral Date"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  hasError={!!fieldState.error}
                  errorMessage={fieldState.error?.message}
                  required
                />
              )}
            />

            <Controller
              name="treatmentStartDate"
              control={form.control}
              render={({ field, fieldState }) => (
                <PremiumDatePicker
                  label="Treatment Start Date"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  hasError={!!fieldState.error}
                  errorMessage={fieldState.error?.message}
                  required
                />
              )}
            />

            <Controller
              name="treatmentEndDate"
              control={form.control}
              render={({ field, fieldState }) => (
                <PremiumDatePicker
                  label="Treatment End Date"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  hasError={!!fieldState.error}
                  errorMessage={fieldState.error?.message}
                />
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
                    description="Control diagnosis status"
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
                    description="Set diagnosis priority"
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
                setIsDiagnosisModalOpen(false)
                setEditingDiagnosis(null)
                form.reset(diagnosisFormDefaults)
              }}
              disabled={isCreating || isUpdating}
            >
              Cancel
            </Button>
            <Button type="submit" loading={isCreating || isUpdating} disabled={isCreating || isUpdating}>
              {editingDiagnosis ? "Update diagnosis" : "Save diagnosis"}
            </Button>
          </div>
        </form>
      </CustomModal>
    </div>
  )
}
