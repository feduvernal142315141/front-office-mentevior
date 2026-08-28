"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { Activity, Edit2, Trash2 } from "lucide-react"

import { Button } from "@/components/custom/Button"
import { CustomTable, type CustomTableColumn } from "@/components/custom/CustomTable"
import { DeleteConfirmModal } from "@/components/custom/DeleteConfirmModal"
import { useDiagnosesByClient } from "@/lib/modules/diagnoses/hooks/use-diagnoses-by-client"
import { useRemoveDiagnosis } from "@/lib/modules/diagnoses/hooks/use-remove-diagnosis"
import { getDiagnosisById } from "@/lib/modules/diagnoses/services/diagnoses.service"
import type { Diagnosis } from "@/lib/types/diagnosis.types"
import type { StepComponentProps } from "@/lib/types/wizard.types"
import { formatDateDisplay } from "@/lib/utils/date"
import { isoToLocalDate } from "@/lib/date"
import { cn } from "@/lib/utils"

import { DiagnosisFormModal } from "./diagnoses/DiagnosisFormModal"

export function Step6Diagnoses({
  clientId,
  isCreateMode = false,
  onSaveSuccess,
  onValidationError: _onValidationError,
  onProgressUpdate,
  registerSubmit,
  registerValidation,
  onStepStatusChange,
}: StepComponentProps) {
  const params = useParams<{ id?: string }>()

  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingDiagnosis, setEditingDiagnosis] = useState<Diagnosis | null>(null)
  const [loadingDiagnosisId, setLoadingDiagnosisId] = useState<string | null>(null)
  const [deletingDiagnosis, setDeletingDiagnosis] = useState<Diagnosis | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  /** El id viene de la ruta; antes se parseaba `window.location.pathname` a mano. */
  const resolvedClientId = useMemo(() => {
    if (!isCreateMode && clientId && clientId !== "new") return clientId
    const routeId = params?.id
    return routeId && routeId !== "new" ? routeId : null
  }, [clientId, isCreateMode, params?.id])

  const { diagnoses, isLoading, error, refetch } = useDiagnosesByClient(resolvedClientId)
  const { remove, isLoading: isRemoving } = useRemoveDiagnosis()

  const totalCount = diagnoses.length
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const hasPrimaryDiagnosis = useMemo(
    () => diagnoses.some((diagnosis) => diagnosis.isPrimary),
    [diagnoses]
  )
  const paginatedDiagnoses = useMemo(() => {
    const start = (page - 1) * pageSize
    return diagnoses.slice(start, start + pageSize)
  }, [diagnoses, page, pageSize])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  useEffect(() => {
    registerValidation(true)
  }, [registerValidation])

  useEffect(() => {
    registerSubmit(async () => {
      onSaveSuccess({ diagnosesCount: diagnoses.length })
    })
  }, [diagnoses.length, onSaveSuccess, registerSubmit])

  useEffect(() => {
    onStepStatusChange?.("diagnoses", diagnoses.length > 0 ? "COMPLETE" : "PENDING")
  }, [diagnoses.length, onStepStatusChange])

  const openCreateModal = useCallback(() => {
    setEditingDiagnosis(null)
    setIsFormModalOpen(true)
  }, [])

  const openEditModal = useCallback(async (diagnosis: Diagnosis) => {
    setLoadingDiagnosisId(diagnosis.id)
    try {
      const detail = await getDiagnosisById(diagnosis.id)
      setEditingDiagnosis(detail ?? diagnosis)
      setIsFormModalOpen(true)
    } finally {
      setLoadingDiagnosisId(null)
    }
  }, [])

  const handleSaved = useCallback(
    (progress: number | null) => {
      if (progress !== null) onProgressUpdate?.(progress)
      void refetch()
    },
    [onProgressUpdate, refetch]
  )

  const handleConfirmRemove = useCallback(async () => {
    if (!deletingDiagnosis) return
    const progress = await remove(deletingDiagnosis.id)
    if (progress === null) return
    onProgressUpdate?.(progress)
    setIsDeleteModalOpen(false)
    setDeletingDiagnosis(null)
    await refetch()
  }, [deletingDiagnosis, onProgressUpdate, refetch, remove])

  const columns: CustomTableColumn<Diagnosis>[] = useMemo(
    () => [
      { key: "code", header: "Code" },
      { key: "name", header: "Name" },
      {
        key: "physicianName",
        header: "Referring Physician",
        render: (diagnosis) =>
          diagnosis.physicianName?.trim() ||
          [diagnosis.physicianFirstName, diagnosis.physicianLastName].filter(Boolean).join(" ") ||
          "—",
      },
      {
        key: "referralDate",
        header: "Referral Date",
        render: (diagnosis) =>
          diagnosis.referralDate ? formatDateDisplay(isoToLocalDate(diagnosis.referralDate)) : "—",
      },
      {
        key: "status",
        header: "Status",
        align: "center",
        render: (diagnosis) => (
          <span
            className={
              diagnosis.status
                ? "inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                : "inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
            }
          >
            {diagnosis.status ? "Active" : "Inactive"}
          </span>
        ),
      },
      {
        key: "isPrimary",
        header: "Type",
        align: "center",
        render: (diagnosis) => (
          <span
            className={
              diagnosis.isPrimary
                ? "inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#037ECC]"
                : "inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700"
            }
          >
            {diagnosis.isPrimary ? "Primary" : "Secondary"}
          </span>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        align: "right",
        render: (diagnosis) => (
          <div className="flex justify-end gap-2">
            <button
              onClick={() => void openEditModal(diagnosis)}
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
              disabled={loadingDiagnosisId === diagnosis.id}
            >
              {loadingDiagnosisId === diagnosis.id ? (
                <Activity className="h-4 w-4 animate-spin text-blue-600" />
              ) : (
                <Edit2 className="h-4 w-4 text-blue-600 transition-colors duration-200 group-hover/edit:text-blue-700" />
              )}
            </button>
            <button
              onClick={() => {
                setDeletingDiagnosis(diagnosis)
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
              title="Remove diagnosis"
              aria-label="Remove diagnosis"
            >
              <Trash2 className="h-4 w-4 text-red-600 transition-colors duration-200 group-hover/delete:text-red-700" />
            </button>
          </div>
        ),
      },
    ],
    [loadingDiagnosisId, openEditModal]
  )

  if (!resolvedClientId) {
    return (
      <div className="w-full px-6 py-8 sm:px-8">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
          <p className="font-medium text-amber-700">
            Please save the client first before managing diagnoses.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full px-6 py-8 sm:px-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Diagnoses</h2>
          <p className="mt-1 text-slate-600">Client diagnoses and treatment dates</p>
        </div>

        <Button type="button" onClick={openCreateModal}>
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

      <DiagnosisFormModal
        open={isFormModalOpen}
        diagnosis={editingDiagnosis}
        clientId={resolvedClientId}
        hasPrimaryDiagnosis={hasPrimaryDiagnosis}
        onClose={() => {
          setIsFormModalOpen(false)
          setEditingDiagnosis(null)
        }}
        onSaved={handleSaved}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setDeletingDiagnosis(null)
        }}
        onConfirm={() => void handleConfirmRemove()}
        title="Remove diagnosis"
        message="Are you sure you want to remove this diagnosis from the client?"
        itemName={deletingDiagnosis ? `${deletingDiagnosis.code} - ${deletingDiagnosis.name}` : undefined}
        isDeleting={isRemoving}
      />
    </div>
  )
}
