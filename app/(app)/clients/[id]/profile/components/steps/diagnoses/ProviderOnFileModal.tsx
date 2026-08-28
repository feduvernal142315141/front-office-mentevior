"use client"

import { useState } from "react"

import { Button } from "@/components/custom/Button"
import { CustomModal } from "@/components/custom/CustomModal"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { usePhysicianSpecialties } from "@/lib/modules/physicians/hooks/use-physician-specialties"
import { useSaveProviderOnFile } from "@/lib/modules/provider-on-file/hooks/use-save-provider-on-file"
import type { SaveProviderOnFileDto } from "@/lib/types/provider-on-file.types"

const EMPTY_FORM: SaveProviderOnFileDto = {
  firstName: "",
  lastName: "",
  agencyName: "",
  specialyId: "",
  phone: "",
  email: "",
}

type FieldErrors = Partial<Record<keyof SaveProviderOnFileDto, string>>

interface ProviderOnFileModalProps {
  open: boolean
  onClose: () => void
  /** Se llama con el id del provider recién creado para que quede seleccionado. */
  onCreated: (providerId: string) => void
}

export function ProviderOnFileModal({ open, onClose, onCreated }: ProviderOnFileModalProps) {
  const [form, setForm] = useState<SaveProviderOnFileDto>(EMPTY_FORM)
  const [errors, setErrors] = useState<FieldErrors>({})

  const { physicianSpecialties, isLoading: isLoadingSpecialties } = usePhysicianSpecialties({ enabled: open })
  const { save, isSaving } = useSaveProviderOnFile()

  const setField = (key: keyof SaveProviderOnFileDto, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleClose = () => {
    if (isSaving) return
    setForm(EMPTY_FORM)
    setErrors({})
    onClose()
  }

  const handleSubmit = async () => {
    // Requeridos por backend: first/last name, agency, specialty y phone (email opcional)
    const nextErrors: FieldErrors = {}
    if (!form.firstName.trim()) nextErrors.firstName = "First name is required"
    if (!form.lastName.trim()) nextErrors.lastName = "Last name is required"
    if (!form.agencyName.trim()) nextErrors.agencyName = "Agency name is required"
    if (!form.specialyId) nextErrors.specialyId = "Specialty is required"
    if (!form.phone.trim()) nextErrors.phone = "Phone is required"

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setErrors({})
    const id = await save({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      agencyName: form.agencyName.trim(),
      specialyId: form.specialyId,
      phone: form.phone.trim(),
      email: form.email.trim(),
    })
    if (!id) return

    onCreated(id)
    setForm(EMPTY_FORM)
    onClose()
  }

  return (
    <CustomModal
      open={open}
      onOpenChange={(next) => {
        if (!next) handleClose()
      }}
      title="New provider on file"
      description="Register another provider involved with the client"
      maxWidthClassName="sm:max-w-[640px]"
      constrainHeight
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <FloatingInput
                label="First name"
                value={form.firstName}
                onChange={(v) => setField("firstName", v)}
                onBlur={() => {}}
                hasError={!!errors.firstName}
                required
              />
              {errors.firstName && (
                <p className="mt-1.5 text-xs font-medium text-red-500">{errors.firstName}</p>
              )}
            </div>
            <div>
              <FloatingInput
                label="Last name"
                value={form.lastName}
                onChange={(v) => setField("lastName", v)}
                onBlur={() => {}}
                hasError={!!errors.lastName}
                required
              />
              {errors.lastName && (
                <p className="mt-1.5 text-xs font-medium text-red-500">{errors.lastName}</p>
              )}
            </div>
            <div>
              <FloatingInput
                label="Agency name"
                value={form.agencyName}
                onChange={(v) => setField("agencyName", v)}
                onBlur={() => {}}
                hasError={!!errors.agencyName}
                required
              />
              {errors.agencyName && (
                <p className="mt-1.5 text-xs font-medium text-red-500">{errors.agencyName}</p>
              )}
            </div>
            <div>
              <FloatingSelect
                label="Specialty"
                value={form.specialyId}
                onChange={(v) => setField("specialyId", v)}
                options={physicianSpecialties.map((sp) => ({ value: sp.id, label: sp.name }))}
                disabled={isLoadingSpecialties}
                hasError={!!errors.specialyId}
                searchable
                required
              />
              {errors.specialyId && (
                <p className="mt-1.5 text-xs font-medium text-red-500">{errors.specialyId}</p>
              )}
            </div>
            <div>
              <FloatingInput
                label="Phone"
                value={form.phone}
                onChange={(v) => setField("phone", v)}
                onBlur={() => {}}
                inputMode="tel"
                hasError={!!errors.phone}
                required
              />
              {errors.phone && (
                <p className="mt-1.5 text-xs font-medium text-red-500">{errors.phone}</p>
              )}
            </div>
            <FloatingInput
              label="Email"
              value={form.email}
              onChange={(v) => setField("email", v)}
              onBlur={() => {}}
              inputMode="email"
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleSubmit()} loading={isSaving} disabled={isSaving}>
            Create provider
          </Button>
        </div>
      </div>
    </CustomModal>
  )
}
