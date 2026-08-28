"use client"

import { useEffect, useState } from "react"
import { FormProvider, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Activity } from "lucide-react"

import { Button } from "@/components/custom/Button"
import { CustomModal } from "@/components/custom/CustomModal"
import { PhysicianFormFields } from "@/app/(app)/my-company/physicians/components/PhysicianFormFields"
import { usePhysicianById } from "@/lib/modules/physicians/hooks/use-physician-by-id"
import { useUpdatePhysician } from "@/lib/modules/physicians/hooks/use-update-physician"
import { physicianFormSchema } from "@/lib/schemas/physician-form.schema"

import {
  getPhysicianFormDefaults,
  mapPhysicianToFormValues,
  type PhysicianFormData,
} from "./diagnosis-helpers"
import { usePhysicianCatalogs } from "./usePhysicianCatalogs"

interface EditReferringPhysicianModalProps {
  open: boolean
  physicianId: string | null
  onClose: () => void
  /** Datos ya resueltos a nombre legible, para refrescar la tarjeta del diagnóstico. */
  onSaved: (updated: { fullName: string; specialty?: string; type?: string }) => void
}

export function EditReferringPhysicianModal({
  open,
  physicianId,
  onClose,
  onSaved,
}: EditReferringPhysicianModalProps) {
  const [saveError, setSaveError] = useState<string | null>(null)

  const catalogs = usePhysicianCatalogs(open)
  const {
    physician,
    isLoading: isLoadingPhysician,
    error: loadError,
  } = usePhysicianById(open ? physicianId ?? "" : "")
  const { update, isUpdating } = useUpdatePhysician()

  const form = useForm<PhysicianFormData>({
    resolver: zodResolver(physicianFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: getPhysicianFormDefaults(),
  })

  useEffect(() => {
    if (!physician || !open) return
    form.reset(mapPhysicianToFormValues(physician, catalogs.usaCountry?.id))
    setSaveError(null)
  }, [physician, open, form, catalogs.usaCountry?.id])

  const handleClose = () => {
    if (isUpdating) return
    form.reset(getPhysicianFormDefaults())
    setSaveError(null)
    onClose()
  }

  const handleSubmit = form.handleSubmit(async (values) => {
    if (!physicianId) return

    try {
      await update({ id: physicianId, ...values })

      const specialtyName = catalogs.physicianSpecialties.find((item) => item.code === values.specialty)?.name
      const typeName = catalogs.physicianTypes.find((item) => item.code === values.type)?.name

      onSaved({
        fullName: `${values.firstName} ${values.lastName}`.trim(),
        specialty: specialtyName ?? values.specialty,
        type: typeName ?? values.type,
      })

      setSaveError(null)
      form.reset(getPhysicianFormDefaults())
      onClose()
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to update physician")
    }
  })

  return (
    <CustomModal
      open={open}
      onOpenChange={(next) => {
        if (!next) handleClose()
      }}
      title="Edit referring physician"
      description="Update physician details without leaving diagnosis"
      maxWidthClassName="sm:max-w-[860px]"
      constrainHeight
    >
      <FormProvider {...form}>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void handleSubmit()
          }}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
            {isLoadingPhysician && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <Activity className="h-4 w-4 animate-spin text-slate-500" />
                Loading physician data...
              </div>
            )}

            {loadError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {loadError.message}
              </div>
            )}

            {saveError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {saveError}
              </div>
            )}

            <PhysicianFormFields
              isEditing
              countries={catalogs.countries}
              states={catalogs.states}
              physicianTypes={catalogs.physicianTypes}
              physicianSpecialties={catalogs.physicianSpecialties}
              isLoadingCountries={catalogs.isLoadingCountries}
              isLoadingStates={catalogs.isLoadingStates}
              isLoadingPhysicianTypes={catalogs.isLoadingPhysicianTypes}
              isLoadingPhysicianSpecialties={catalogs.isLoadingPhysicianSpecialties}
            />
          </div>

          <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">
            <Button type="button" variant="secondary" onClick={handleClose} disabled={isUpdating}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isUpdating}
              disabled={isUpdating || isLoadingPhysician || !physician}
            >
              Save physician
            </Button>
          </div>
        </form>
      </FormProvider>
    </CustomModal>
  )
}
