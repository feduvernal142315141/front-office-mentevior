"use client"

import { useMemo, useState } from "react"
import { FormProvider, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/custom/Button"
import { CustomModal } from "@/components/custom/CustomModal"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { Tabs, type TabItem } from "@/components/custom/Tabs"
import { PhysicianFormFields } from "@/app/(app)/my-company/physicians/components/PhysicianFormFields"
import { useCreateManualClientPhysician } from "@/lib/modules/client-physicians/hooks/use-create-manual-client-physician"
import { usePhysicians } from "@/lib/modules/physicians/hooks/use-physicians"
import { physicianFormSchema } from "@/lib/schemas/physician-form.schema"
import type { CreateManualClientPhysicianDto } from "@/lib/types/client-physician.types"

import {
  getPhysicianFormDefaults,
  type PhysicianFormData,
  type SelectedReferringPhysician,
} from "./diagnosis-helpers"
import { usePhysicianCatalogs } from "./usePhysicianCatalogs"

interface ReferringPhysicianModalProps {
  open: boolean
  onClose: () => void
  clientId: string
  /** Se excluye del select de agencia para no ofrecer el que ya está puesto. */
  currentPhysicianId?: string
  onSelect: (physician: SelectedReferringPhysician) => void
}

export function ReferringPhysicianModal({
  open,
  onClose,
  clientId,
  currentPhysicianId,
  onSelect,
}: ReferringPhysicianModalProps) {
  const [activeTab, setActiveTab] = useState("agency")
  const [selectedAgencyPhysicianId, setSelectedAgencyPhysicianId] = useState("")

  const { physicians: agencyPhysicians, isLoading: isLoadingAgencyPhysicians } = usePhysicians(
    { page: 0, pageSize: 200 },
    { enabled: open }
  )

  const catalogs = usePhysicianCatalogs(open)
  const { createManual, isLoading: isCreating } = useCreateManualClientPhysician()

  const form = useForm<PhysicianFormData>({
    resolver: zodResolver(physicianFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: getPhysicianFormDefaults(),
  })

  const selectableAgencyPhysicians = useMemo(
    () => agencyPhysicians.filter((physician) => physician.id !== currentPhysicianId),
    [agencyPhysicians, currentPhysicianId]
  )

  const reset = () => {
    setActiveTab("agency")
    setSelectedAgencyPhysicianId("")
    form.reset(getPhysicianFormDefaults())
  }

  const handleClose = () => {
    if (isCreating) return
    reset()
    onClose()
  }

  const handleSelectAgency = (physicianId: string) => {
    const physician = agencyPhysicians.find((item) => item.id === physicianId)
    if (!physician) return

    onSelect({
      physicianId: physician.id,
      fullName: `${physician.firstName} ${physician.lastName}`.trim(),
      specialty: physician.specialty,
      type: physician.type,
      source: "agency",
    })
    reset()
    onClose()
  }

  const handleSaveManual = form.handleSubmit(async (values) => {
    const payload: CreateManualClientPhysicianDto = {
      clientId,
      firstName: values.firstName,
      lastName: values.lastName,
      specialty: values.specialty,
      npi: values.npi,
      mpi: values.mpi,
      phone: values.phone,
      fax: values.fax || undefined,
      email: values.email,
      type: values.type,
      active: values.active,
      companyName: values.companyName || undefined,
      address: values.address || undefined,
      city: values.city || undefined,
      state: values.state || undefined,
      zipCode: values.zipCode || undefined,
      country: values.country || undefined,
      countryId: catalogs.usaCountry?.id || undefined,
      stateId: values.stateId || undefined,
    }

    const createdPhysicianId = await createManual(payload)
    if (!createdPhysicianId) return

    const specialtyName = catalogs.physicianSpecialties.find((item) => item.code === values.specialty)?.name
    const typeName = catalogs.physicianTypes.find((item) => item.code === values.type)?.name

    onSelect({
      physicianId: createdPhysicianId,
      fullName: `${values.firstName} ${values.lastName}`.trim(),
      specialty: specialtyName ?? values.specialty,
      type: typeName ?? values.type,
      source: "manual",
    })
    reset()
    onClose()
  })

  const tabs: TabItem[] = [
    {
      id: "agency",
      label: "Agency",
      content: (
        <div className="space-y-5 pt-4">
          <FloatingSelect
            label="Agency Physician"
            value={selectedAgencyPhysicianId}
            onChange={(physicianId) => {
              setSelectedAgencyPhysicianId(physicianId)
              handleSelectAgency(physicianId)
            }}
            options={selectableAgencyPhysicians.map((physician) => ({
              value: physician.id,
              label: `${physician.firstName} ${physician.lastName}`,
            }))}
            searchable
            disabled={isLoadingAgencyPhysicians}
          />

          <div className="flex items-center justify-end gap-3 pt-1">
            <Button type="button" variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
          </div>
        </div>
      ),
    },
    {
      id: "manual",
      label: "Manual",
      content: (
        <FormProvider {...form}>
          <div className="space-y-4 pt-4">
            <div className="max-h-[420px] overflow-y-auto pt-2 pr-1">
              <PhysicianFormFields
                isEditing={false}
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

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={handleClose} disabled={isCreating}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => void handleSaveManual()}
                loading={isCreating}
                disabled={isCreating}
              >
                Save physician
              </Button>
            </div>
          </div>
        </FormProvider>
      ),
    },
  ]

  return (
    <CustomModal
      open={open}
      onOpenChange={(next) => {
        if (!next) handleClose()
      }}
      title="Referring Physicians"
      description="Select one referring physician from agency catalog or create manually"
      maxWidthClassName="sm:max-w-[860px]"
      constrainHeight
    >
      <div className="min-h-0 flex-1 overflow-y-auto pb-2">
        <Tabs items={tabs} defaultTab={activeTab} onChange={setActiveTab} />
      </div>
    </CustomModal>
  )
}
