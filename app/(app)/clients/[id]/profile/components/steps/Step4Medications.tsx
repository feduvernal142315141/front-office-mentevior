"use client"

import { useEffect, useMemo, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Edit2, Trash2 } from "lucide-react"
import { Button } from "@/components/custom/Button"
import { CustomModal } from "@/components/custom/CustomModal"
import { CustomTable, type CustomTableColumn } from "@/components/custom/CustomTable"
import { DeleteConfirmModal } from "@/components/custom/DeleteConfirmModal"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingTextarea } from "@/components/custom/FloatingTextarea"
import { PremiumDatePicker } from "@/components/custom/PremiumDatePicker"
import {
  medicationFormDefaults,
  medicationFormSchema,
  type MedicationFormValues,
} from "@/lib/schemas/medication-form.schema"
import { useMedicationsByClient } from "@/lib/modules/medications/hooks/use-medications-by-client"
import { useCreateMedication } from "@/lib/modules/medications/hooks/use-create-medication"
import { useUpdateMedication } from "@/lib/modules/medications/hooks/use-update-medication"
import { useRemoveMedication } from "@/lib/modules/medications/hooks/use-remove-medication"
import type { Medication } from "@/lib/types/medication.types"
import type { StepComponentProps } from "@/lib/types/wizard.types"
import { formatDateDisplay } from "@/lib/utils/date"
import { isoToLocalDate } from "@/lib/date"
import { cn } from "@/lib/utils"

export function Step4Medications({
  clientId,
  isCreateMode = false,
  onSaveSuccess,
  onValidationError,
  onProgressUpdate,
  registerSubmit,
  registerValidation,
  onDirtyChange,
  onStepStatusChange,
}: StepComponentProps) {
  const [isMedicationModalOpen, setIsMedicationModalOpen] = useState(false)
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null)
  const [deletingMedication, setDeletingMedication] = useState<Medication | null>(null)
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

  const { medications, isLoading, error, refetch } = useMedicationsByClient(resolvedClientId)
  const { create, isLoading: isCreating } = useCreateMedication()
  const { update, isLoading: isUpdating } = useUpdateMedication()
  const { remove, isLoading: isRemoving } = useRemoveMedication()

  const form = useForm<MedicationFormValues>({
    resolver: zodResolver(medicationFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: medicationFormDefaults,
  })

  const columns: CustomTableColumn<Medication>[] = [
    {
      key: "name",
      header: "Medication",
    },
    {
      key: "dosage",
      header: "Dosage",
    },
    {
      key: "treatmentStartDate",
      header: "Treatment Start Date",
      render: (medication) =>
        medication.treatmentStartDate
          ? formatDateDisplay(isoToLocalDate(medication.treatmentStartDate))
          : "—",
    },
    {
      key: "comments",
      header: "Comments",
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (medication) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => {
              setEditingMedication(medication)
              form.reset({
                name: medication.name,
                dosage: medication.dosage,
                prescriptionDate: medication.prescriptionDate ? isoToLocalDate(medication.prescriptionDate) : "",
                treatmentStartDate: medication.treatmentStartDate ? isoToLocalDate(medication.treatmentStartDate) : "",
                comments: medication.comments,
              })
              setIsMedicationModalOpen(true)
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
            title="Edit medication"
            aria-label="Edit medication"
          >
            <Edit2 className="w-4 h-4 text-blue-600 group-hover/edit:text-blue-700 transition-colors duration-200" />
          </button>
          <button
            onClick={() => {
              setDeletingMedication(medication)
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
            title="Remove medication"
            aria-label="Remove medication"
          >
            <Trash2 className="w-4 h-4 text-red-600 group-hover/delete:text-red-700 transition-colors duration-200" />
          </button>
        </div>
      ),
    },
  ]

  const totalCount = medications.length
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const paginatedMedications = useMemo(() => {
    const start = (page - 1) * pageSize
    return medications.slice(start, start + pageSize)
  }, [medications, page, pageSize])

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  useEffect(() => {
    registerValidation(true)
  }, [registerValidation])

  useEffect(() => {
    onDirtyChange?.(isMedicationModalOpen && form.formState.isDirty)
  }, [isMedicationModalOpen, form.formState.isDirty, onDirtyChange])

  useEffect(() => {
    registerSubmit(async () => {
      onSaveSuccess({ medicationsCount: medications.length })
    })
  }, [medications.length, onSaveSuccess, registerSubmit])

  useEffect(() => {
    onStepStatusChange?.("medications", medications.length > 0 ? "COMPLETE" : "PENDING")
  }, [medications.length, onStepStatusChange])

  const handleSaveMedication = form.handleSubmit(async (values) => {
    if (!resolvedClientId) {
      onValidationError({ general: "Client not found" })
      return
    }

    const payload = {
      name: values.name,
      dosage: values.dosage || "",
      prescriptionDate: values.prescriptionDate || "",
      treatmentStartDate: values.treatmentStartDate || "",
      comments: values.comments || "",
    }

    const result = editingMedication
      ? await update(editingMedication.id, payload)
      : await create({ clientId: resolvedClientId, ...payload })

    if (!result) {
      return
    }

    onProgressUpdate?.(result.progress)
    form.reset(medicationFormDefaults)
    setEditingMedication(null)
    setIsMedicationModalOpen(false)
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
    if (!deletingMedication) return
    const progress = await remove(deletingMedication.id)
    if (progress === null) return
    onProgressUpdate?.(progress)
    setIsDeleteModalOpen(false)
    setDeletingMedication(null)
    await refetch()
  }

  if (!resolvedClientId) {
    return (
      <div className="w-full px-6 py-8 sm:px-8">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <p className="text-amber-700 font-medium">
            Please save the client first before managing medications.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full px-6 py-8 sm:px-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Medications</h2>
          <p className="text-slate-600 mt-1">Current medications prescribed for this patient</p>
        </div>

        <Button
          type="button"
          onClick={() => {
            setEditingMedication(null)
            form.reset(medicationFormDefaults)
            setIsMedicationModalOpen(true)
          }}
        >
          New medication
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error.message}
        </div>
      )}

      <CustomTable
        columns={columns}
        data={paginatedMedications}
        isLoading={isLoading}
        emptyMessage="No medications added yet"
        emptyContent={
          <div className="flex flex-col items-center justify-center gap-3 py-10">
            <p className="text-sm font-medium text-slate-700">No medications available</p>
            <p className="max-w-md text-center text-sm text-slate-500">
              Add medications to keep this patient treatment plan complete.
            </p>
          </div>
        }
        getRowKey={(medication) => medication.id}
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
        open={isMedicationModalOpen}
        onOpenChange={(open) => {
          setIsMedicationModalOpen(open)
          if (!open) {
            setEditingMedication(null)
            form.reset(medicationFormDefaults)
          }
        }}
        title={editingMedication ? "Edit medication" : "New medication"}
        description={editingMedication ? "Update medication details" : "Add medication details"}
        maxWidthClassName="sm:max-w-[760px]"
      >
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void handleSaveMedication()
          }}
          className="px-6 py-6"
        >
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
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
              name="dosage"
              control={form.control}
              render={({ field, fieldState }) => (
                <div>
                  <FloatingInput
                    label="Dosage"
                    value={field.value || ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    hasError={!!fieldState.error}
                  />
                  {fieldState.error && <p className="mt-2 text-sm text-red-600">{fieldState.error.message}</p>}
                </div>
              )}
            />

            <Controller
              name="prescriptionDate"
              control={form.control}
              render={({ field, fieldState }) => (
                <PremiumDatePicker
                  label="Prescription Date"
                  value={field.value || ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  hasError={!!fieldState.error}
                  errorMessage={fieldState.error?.message}
                />
              )}
            />

            <Controller
              name="treatmentStartDate"
              control={form.control}
              render={({ field, fieldState }) => (
                <PremiumDatePicker
                  label="Treatment Start Date"
                  value={field.value || ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  hasError={!!fieldState.error}
                  errorMessage={fieldState.error?.message}
                />
              )}
            />

            <Controller
              name="comments"
              control={form.control}
              render={({ field, fieldState }) => (
                <div className="md:col-span-2">
                  <FloatingTextarea
                    label="Comments"
                    value={field.value || ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    hasError={!!fieldState.error}
                    maxLength={500}
                  />
                  {fieldState.error && <p className="mt-2 text-sm text-red-600">{fieldState.error.message}</p>}
                </div>
              )}
            />
          </div>

          <div className="mt-8 flex items-center justify-end gap-3 border-t border-slate-200 pt-5">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsMedicationModalOpen(false)
                setEditingMedication(null)
                form.reset(medicationFormDefaults)
              }}
              disabled={isCreating || isUpdating}
            >
              Cancel
            </Button>
            <Button type="submit" loading={isCreating || isUpdating} disabled={isCreating || isUpdating}>
              {editingMedication ? "Update medication" : "Save medication"}
            </Button>
          </div>
        </form>
      </CustomModal>

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setDeletingMedication(null)
        }}
        onConfirm={() => void handleConfirmRemove()}
        title="Remove medication"
        message="Are you sure you want to remove this medication from the client?"
        itemName={deletingMedication?.name}
        isDeleting={isRemoving}
      />
    </div>
  )
}
