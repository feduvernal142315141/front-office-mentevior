"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/custom/Button"
import { CustomModal } from "@/components/custom/CustomModal"
import { useUpdatePayer } from "@/lib/modules/payers/hooks/use-update-payer"
import { usePayerById } from "@/lib/modules/payers/hooks/use-payer-by-id"
import { useCountries } from "@/lib/modules/addresses/hooks/use-countries"
import { useStates } from "@/lib/modules/addresses/hooks/use-states"
import { usePayerCatalogs } from "@/lib/modules/payers/hooks/use-payer-catalogs"
import { payerBaseFormSchema, getPayerBaseFormDefaults, type PayerBaseFormValues } from "@/lib/schemas/payer-form.schema"
import { normalizePhone } from "@/lib/utils/phone-format"
import type { Payer } from "@/lib/types/payer.types"
import { PayerBaseForm } from "../shared/PayerBaseForm"

interface EditPayerModalProps {
  payerId: string | null
  open: boolean
  onOpenChange: (nextOpen: boolean) => void
  onSaved: () => void
}

export function EditPayerModal({ payerId, open, onOpenChange, onSaved }: EditPayerModalProps) {
  const { payer, isLoading: isLoadingPayer } = usePayerById(open ? payerId : null)
  const { update, isLoading: isSaving } = useUpdatePayer()
  const { countries, isLoading: isLoadingCountries } = useCountries()
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null)
  const { states, isLoading: isLoadingStates } = useStates(selectedCountryId)
  const { clearingHouses, isLoading: isLoadingClearingHouses } = usePayerCatalogs()
  const form = useForm<PayerBaseFormValues>({
    resolver: zodResolver(payerBaseFormSchema),
    defaultValues: getPayerBaseFormDefaults(),
    mode: "onBlur",
  })

  const watchCountryId = form.watch("countryId")
  useEffect(() => {
    setSelectedCountryId(watchCountryId || null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchCountryId])

  // Populate form when payer data arrives
  useEffect(() => {
    if (payer) {
      const countryId = payer.countryId ?? ""
      form.reset({
        name: payer.name,
        phone: payer.phone ?? "",
        email: payer.email ?? "",
        externalId: payer.externalId ?? "",
        groupNumber: payer.groupNumber ?? "",
        addressLine1: payer.addressLine1 ?? "",
        addressLine2: payer.addressLine2 ?? "",
        city: payer.city ?? "",
        countryId,
        stateId: payer.stateId ?? "",
        zipCode: payer.zipCode ?? "",
        planTypeId: payer.clearingHouseId ?? payer.planTypeId ?? "",
        description: payer.description ?? "",
        logo: payer.logoUrl ?? "",
      })
      if (countryId) setSelectedCountryId(countryId)
    }
  }, [payer, form])

  const handleSave = form.handleSubmit(async (data) => {
    if (!payer) return

    const saved = await update({
      id: payer.id,
      source: payer.source,
      sourceReferenceId: payer.sourceReferenceId ?? "",
      logo: data.logo || payer.logoUrl || "",
      clearingHouseId: data.planTypeId ?? payer.clearingHouseId ?? payer.planTypeId ?? "",
      description: data.description ?? payer.description,
      name: data.name.trim(),
      phone: normalizePhone(data.phone),
      email: data.email,
      externalId: data.externalId ?? "",
      groupNumber: data.groupNumber ?? "",
      addressLine1: data.addressLine1 ?? "",
      addressLine2: data.addressLine2 ?? "",
      city: data.city ?? "",
      stateId: data.stateId ?? "",
      zipCode: data.zipCode,
    })

    if (saved) {
      onSaved()
      onOpenChange(false)
    }
  })

  const nameValue = form.watch("name")

  return (
    <CustomModal
      open={open}
      onOpenChange={onOpenChange}
      title="Edit payer"
      description="Update contact and address information for this payer"
      maxWidthClassName="sm:max-w-[960px]"
    >
      <div className="p-6 space-y-6">
        {isLoadingPayer ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className={`h-[52px] rounded-[16px] bg-gray-100 animate-pulse ${i < 2 ? "" : i === 2 || i === 3 ? "" : "md:col-span-2"}`}
              />
            ))}
          </div>
        ) : (
            <PayerBaseForm
              form={form}
              countries={countries}
              states={states}
              isLoadingCountries={isLoadingCountries}
              isLoadingStates={isLoadingStates}
              clearingHouses={clearingHouses}
              isLoadingClearingHouses={isLoadingClearingHouses}
              existingLogoUrl={payer?.logoUrl}
              isCountryDisabled={Boolean(payer?.countryId)}
            />
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            loading={isSaving}
            onClick={handleSave}
            disabled={isLoadingPayer || !nameValue?.trim()}
          >
            Save changes
          </Button>
        </div>
      </div>
    </CustomModal>
  )
}
