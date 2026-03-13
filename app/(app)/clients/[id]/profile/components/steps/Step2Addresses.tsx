"use client"

import { useEffect, useMemo, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Edit2, Home, Building2, Users } from "lucide-react"
import { Button } from "@/components/custom/Button"
import { CustomModal } from "@/components/custom/CustomModal"
import { CustomTable, type CustomTableColumn } from "@/components/custom/CustomTable"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { PremiumSwitch } from "@/components/custom/PremiumSwitch"
import { Tabs, type TabItem } from "@/components/custom/Tabs"
import { Badge } from "@/components/ui/badge"
import { useAddresses } from "@/lib/modules/addresses/hooks/use-addresses"
import { useCountries } from "@/lib/modules/addresses/hooks/use-countries"
import { useStates } from "@/lib/modules/addresses/hooks/use-states"
import { usePlacesOfService } from "@/lib/modules/addresses/hooks/use-places-of-service"
import { getAddressById } from "@/lib/modules/addresses/services/addresses.service"
import { useClients } from "@/lib/modules/clients/hooks/use-clients"
import { useClientAddresses } from "@/lib/modules/client-addresses/hooks/use-client-addresses"
import { useCreateClientAddress } from "@/lib/modules/client-addresses/hooks/use-create-client-address"
import { useUpdateClientAddress } from "@/lib/modules/client-addresses/hooks/use-update-client-address"
import type { ClientAddress, CreateClientAddressDto } from "@/lib/types/client-address.types"
import type { StepComponentProps } from "@/lib/types/wizard.types"
import { cn } from "@/lib/utils"

const alphanumericWithSpaces = /^[a-zA-Z0-9 ]+$/

const addressSourceSchema = z.object({
  sourceType: z.enum(["agency", "other-clients", "manual"]),
  nickName: z
    .string()
    .trim()
    .min(1, "Nickname is required")
    .max(100, "Nickname must be less than 100 characters")
    .regex(alphanumericWithSpaces, "Nickname must be alphanumeric"),
  isPrimary: z.boolean(),
  selectedAgencyAddressId: z.string().optional(),
  selectedClientId: z.string().optional(),
  selectedClientAddressId: z.string().optional(),
  placeServiceId: z.string().optional(),
  addressLine1: z.string().optional(),
  apartmentSuite: z.string().optional(),
  city: z.string().optional(),
  stateId: z.string().optional(),
  zipCode: z.string().optional(),
  countryId: z.string().optional(),
}).superRefine((value, ctx) => {
  if (value.sourceType === "agency" && !value.selectedAgencyAddressId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Select one agency address",
      path: ["selectedAgencyAddressId"],
    })
  }

  if (value.sourceType === "other-clients") {
    if (!value.selectedClientId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select a client first",
        path: ["selectedClientId"],
      })
    }
    if (!value.selectedClientAddressId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select one address from that client",
        path: ["selectedClientAddressId"],
      })
    }
  }

  if (value.sourceType === "manual") {
    if (!value.placeServiceId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Place of service is required",
        path: ["placeServiceId"],
      })
    }

    if (!value.addressLine1?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Address Line 1 is required",
        path: ["addressLine1"],
      })
    } else if (!alphanumericWithSpaces.test(value.addressLine1.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Address Line 1 must be alphanumeric",
        path: ["addressLine1"],
      })
    }

    if (value.apartmentSuite?.trim() && !alphanumericWithSpaces.test(value.apartmentSuite.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Apartment/Suite must be alphanumeric",
        path: ["apartmentSuite"],
      })
    }

    if (!value.city?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "City is required",
        path: ["city"],
      })
    }

    if (!value.stateId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "State is required",
        path: ["stateId"],
      })
    }

    const normalizedZipCode = value.zipCode?.trim() ?? ""

    if (!normalizedZipCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Zip code is required",
        path: ["zipCode"],
      })
    } else if (!/^\d{5}$/.test(normalizedZipCode)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "ZIP Code must be exactly 5 digits",
        path: ["zipCode"],
      })
    }

    if (!value.countryId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Country is required",
        path: ["countryId"],
      })
    }
  }
})

type AddressSourceFormValues = z.infer<typeof addressSourceSchema>

const defaultValues: AddressSourceFormValues = {
  sourceType: "agency",
  nickName: "",
  isPrimary: false,
  selectedAgencyAddressId: "",
  selectedClientId: "",
  selectedClientAddressId: "",
  placeServiceId: "",
  addressLine1: "",
  apartmentSuite: "",
  city: "",
  stateId: "",
  zipCode: "",
  countryId: "",
}

function normalizeNickname(value: string) {
  return value.trim().toLowerCase()
}

export function Step2Addresses({
  clientId,
  isCreateMode = false,
  onSaveSuccess,
  onValidationError,
  registerSubmit,
  registerValidation,
  onStepStatusChange,
}: StepComponentProps) {
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)

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

  const {
    addresses,
    isLoading: isLoadingClientAddresses,
    error: clientAddressesError,
    refetch: refetchClientAddresses,
  } = useClientAddresses(resolvedClientId)
  const { create, isLoading: isCreating } = useCreateClientAddress()
  const { update, isLoading: isUpdating } = useUpdateClientAddress()

  const {
    addresses: agencyAddresses,
    isLoading: isLoadingAgencyAddresses,
  } = useAddresses({ page: 0, pageSize: 200 })
  const { clients, isLoading: isLoadingClients } = useClients({ page: 0, pageSize: 200 })
  const { countries, isLoading: isLoadingCountries } = useCountries()
  const { placesOfService, isLoading: isLoadingPlaces } = usePlacesOfService()

  const form = useForm<AddressSourceFormValues>({
    resolver: zodResolver(addressSourceSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues,
  })

  const selectedCountryId = form.watch("countryId")
  const selectedClientId = form.watch("selectedClientId")
  const { states, isLoading: isLoadingStates } = useStates(selectedCountryId || null)
  const {
    addresses: selectedClientAddresses,
    isLoading: isLoadingSelectedClientAddresses,
  } = useClientAddresses(selectedClientId || null)

  useEffect(() => {
    registerValidation(true)
  }, [registerValidation])

  useEffect(() => {
    registerSubmit(async () => {
      onSaveSuccess({ addressesCount: addresses.length })
    })
  }, [addresses.length, onSaveSuccess, registerSubmit])

  useEffect(() => {
    onStepStatusChange?.("addresses", addresses.length > 0 ? "COMPLETE" : "PENDING")
  }, [addresses.length, onStepStatusChange])

  useEffect(() => {
    const usaCountry = countries.find(
      (country) => country.name === "United States" || country.name === "USA"
    )
    if (!usaCountry) return
    if (!form.getValues("countryId")) {
      form.setValue("countryId", usaCountry.id)
    }
  }, [countries, form])

  const selectableClients = useMemo(
    () => clients.filter((clientItem) => clientItem.id !== resolvedClientId),
    [clients, resolvedClientId]
  )

  const columns: CustomTableColumn<ClientAddress>[] = [
    {
      key: "nickName",
      header: "Nickname",
      className: "min-w-[180px]",
      render: (address) => <span className="font-medium text-slate-900">{address.nickName}</span>,
    },
    {
      key: "placeService",
      header: "Place of Service",
      className: "min-w-[180px]",
      render: (address) => address.placeService || "-",
    },
    {
      key: "location",
      header: "Address",
      className: "min-w-[260px]",
      render: (address) => (
        <div className="text-sm">
          <p className="font-medium text-slate-700">{address.addressLine1}</p>
          <p className="text-slate-500">
            {address.city}, {address.state} {address.zipCode}
          </p>
        </div>
      ),
    },
    {
      key: "isPrimary",
      header: "Type",
      className: "w-[140px] whitespace-nowrap",
      align: "center",
      render: (address) => (
        <Badge
          className={cn(
            "font-semibold border",
            address.isPrimary
              ? "bg-blue-50 text-[#037ECC] border-blue-200"
              : "bg-slate-100 text-slate-600 border-slate-200"
          )}
        >
          {address.isPrimary ? "Primary" : "Secondary"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "w-[100px] whitespace-nowrap",
      align: "right",
      render: (address) => (
        <div className="flex justify-end gap-2">
          {!address.isPrimary && (
            <button
              type="button"
              onClick={async () => {
                await update({ id: address.id, isPrimary: true })
                await refetchClientAddresses()
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
              title="Set as primary"
              aria-label="Set as primary"
            >
              <Edit2 className="w-4 h-4 text-blue-600 group-hover/edit:text-blue-700 transition-colors duration-200" />
            </button>
          )}
        </div>
      ),
    },
  ]

  const handleOpenModal = () => {
    form.reset(defaultValues)
    setIsAddressModalOpen(true)
  }

  const handleSourceTypeChange = (sourceType: string) => {
    if (sourceType !== "agency" && sourceType !== "other-clients" && sourceType !== "manual") {
      return
    }
    form.setValue("sourceType", sourceType)
  }

  const handleSaveAddress = form.handleSubmit(async (values) => {
    if (!resolvedClientId) {
      onValidationError({ general: "Client not found" })
      return
    }

    const duplicate = addresses.some(
      (address) => normalizeNickname(address.nickName) === normalizeNickname(values.nickName)
    )

    if (duplicate) {
      form.setError("nickName", {
        type: "manual",
        message: "Nickname already exists for this client",
      })
      onValidationError({ nickName: "Nickname already exists for this client" })
      return
    }

    let payload: CreateClientAddressDto | null = null

    if (values.sourceType === "manual") {
      const selectedState = states.find((state) => state.id === values.stateId)
      const selectedCountry = countries.find((country) => country.id === values.countryId)

      payload = {
        clientId: resolvedClientId,
        nickName: values.nickName,
        placeServiceId: values.placeServiceId,
        addressLine1: values.addressLine1?.trim() || "",
        apartmentSuite: values.apartmentSuite?.trim() || "",
        city: values.city?.trim() || "",
        stateId: values.stateId,
        state: selectedState?.name,
        zipCode: values.zipCode?.trim() || "",
        countryId: values.countryId,
        country: selectedCountry?.name,
        isPrimary: values.isPrimary,
      }
    }

    if (values.sourceType === "agency" && values.selectedAgencyAddressId) {
      const source = await getAddressById(values.selectedAgencyAddressId)
      if (!source) {
        onValidationError({ selectedAgencyAddressId: "Selected agency address no longer exists" })
        return
      }

      payload = {
        clientId: resolvedClientId,
        nickName: values.nickName,
        placeServiceId: source.placeServiceId,
        addressLine1: source.address,
        city: source.city,
        stateId: source.stateId,
        state: source.state,
        zipCode: source.zipCode,
        countryId: source.countryId,
        country: source.country,
        isPrimary: values.isPrimary,
        sourceAddressId: source.id,
      }
    }

    if (values.sourceType === "other-clients") {
      const selectedAddress = selectedClientAddresses.find(
        (address) => address.id === values.selectedClientAddressId
      )

      if (!selectedAddress) {
        onValidationError({ selectedClientAddressId: "Select one address from the selected client" })
        return
      }

      payload = {
        clientId: resolvedClientId,
        nickName: values.nickName,
        placeServiceId: selectedAddress.placeServiceId,
        addressLine1: selectedAddress.addressLine1,
        apartmentSuite: selectedAddress.apartmentSuite,
        city: selectedAddress.city,
        stateId: selectedAddress.stateId,
        state: selectedAddress.state,
        zipCode: selectedAddress.zipCode,
        countryId: selectedAddress.countryId,
        country: selectedAddress.country,
        isPrimary: values.isPrimary,
        sourceAddressId: selectedAddress.id,
        sourceClientId: selectedClientId,
      }
    }

    if (!payload) {
      onValidationError({ general: "Unable to build address payload" })
      return
    }

    const result = await create(payload)
    if (!result) return

    form.reset(defaultValues)
    setIsAddressModalOpen(false)
    await refetchClientAddresses()
  }, () => {
    const errors: Record<string, string> = {}
    Object.entries(form.formState.errors).forEach(([key, errorItem]) => {
      if (errorItem && typeof errorItem.message === "string") {
        errors[key] = errorItem.message
      }
    })
    onValidationError(errors)
  })

  const sourceTabs: TabItem[] = [
    {
      id: "agency",
      label: "Agency",
      icon: <Building2 className="w-4 h-4" />,
      content: (
        <div className="space-y-5">
          <Controller
            name="selectedAgencyAddressId"
            control={form.control}
            render={({ field, fieldState }) => (
              <div>
                <FloatingSelect
                  label="Agency Address"
                  value={field.value || ""}
                  onChange={(value) => {
                    field.onChange(value)
                    const selected = agencyAddresses.find((address) => address.id === value)
                    if (selected && !form.getValues("nickName")) {
                      form.setValue("nickName", selected.nickName)
                    }
                  }}
                  onBlur={field.onBlur}
                  options={agencyAddresses.map((address) => ({
                    value: address.id,
                    label: `${address.nickName} - ${address.address}, ${address.city}`,
                  }))}
                  disabled={isLoadingAgencyAddresses}
                  hasError={!!fieldState.error}
                  required
                  searchable
                />
                {fieldState.error && <p className="mt-2 text-sm text-red-600">{fieldState.error.message}</p>}
              </div>
            )}
          />
        </div>
      ),
    },
    {
      id: "other-clients",
      label: "Other clients",
      icon: <Users className="w-4 h-4" />,
      content: (
        <div className="space-y-5">
          <Controller
            name="selectedClientId"
            control={form.control}
            render={({ field, fieldState }) => (
              <div>
                <FloatingSelect
                  label="Client"
                  value={field.value || ""}
                  onChange={(value) => {
                    field.onChange(value)
                    form.setValue("selectedClientAddressId", "")
                  }}
                  onBlur={field.onBlur}
                  options={selectableClients.map((clientItem) => ({
                    value: clientItem.id,
                    label: `${clientItem.fullName} (${clientItem.chartId})`,
                  }))}
                  disabled={isLoadingClients}
                  hasError={!!fieldState.error}
                  required
                  searchable
                />
                {fieldState.error && <p className="mt-2 text-sm text-red-600">{fieldState.error.message}</p>}
              </div>
            )}
          />

          <Controller
            name="selectedClientAddressId"
            control={form.control}
            render={({ field, fieldState }) => (
              <div>
                <FloatingSelect
                  label="Address"
                  value={field.value || ""}
                  onChange={(value) => {
                    field.onChange(value)
                    const selected = selectedClientAddresses.find((address) => address.id === value)
                    if (selected && !form.getValues("nickName")) {
                      form.setValue("nickName", selected.nickName)
                    }
                  }}
                  onBlur={field.onBlur}
                  options={selectedClientAddresses.map((address) => ({
                    value: address.id,
                    label: `${address.nickName} - ${address.addressLine1}, ${address.city}`,
                  }))}
                  disabled={!selectedClientId || isLoadingSelectedClientAddresses}
                  hasError={!!fieldState.error}
                  required
                  searchable
                />
                {fieldState.error && <p className="mt-2 text-sm text-red-600">{fieldState.error.message}</p>}
              </div>
            )}
          />
        </div>
      ),
    },
    {
      id: "manual",
      label: "Manual",
      icon: <Home className="w-4 h-4" />,
      content: (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Controller
            name="placeServiceId"
            control={form.control}
            render={({ field, fieldState }) => (
              <div>
                <FloatingSelect
                  label="Place of service"
                  value={field.value || ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  options={placesOfService.map((place) => ({ value: place.id, label: place.name }))}
                  disabled={isLoadingPlaces}
                  hasError={!!fieldState.error}
                  required
                  searchable
                />
                {fieldState.error && <p className="mt-2 text-sm text-red-600">{fieldState.error.message}</p>}
              </div>
            )}
          />

          <Controller
            name="countryId"
            control={form.control}
            render={({ field, fieldState }) => (
              <div>
                <FloatingSelect
                  label="Country"
                  value={field.value || ""}
                  onChange={(value) => {
                    field.onChange(value)
                    form.setValue("stateId", "")
                  }}
                  onBlur={field.onBlur}
                  options={countries.map((country) => ({ value: country.id, label: country.name }))}
                  disabled={isLoadingCountries}
                  hasError={!!fieldState.error}
                  required
                  searchable
                />
                {fieldState.error && <p className="mt-2 text-sm text-red-600">{fieldState.error.message}</p>}
              </div>
            )}
          />

          <Controller
            name="addressLine1"
            control={form.control}
            render={({ field, fieldState }) => (
              <div className="md:col-span-2">
                <FloatingInput
                  label="Address Line 1"
                  value={field.value || ""}
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
            name="apartmentSuite"
            control={form.control}
            render={({ field, fieldState }) => (
              <div>
                <FloatingInput
                  label="Apartment/Suite"
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
            name="city"
            control={form.control}
            render={({ field, fieldState }) => (
              <div>
                <FloatingInput
                  label="City"
                  value={field.value || ""}
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
            name="stateId"
            control={form.control}
            render={({ field, fieldState }) => (
              <div>
                <FloatingSelect
                  label="State"
                  value={field.value || ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  options={states.map((state) => ({ value: state.id, label: state.name }))}
                  disabled={!selectedCountryId || isLoadingStates}
                  hasError={!!fieldState.error}
                  required
                  searchable
                />
                {fieldState.error && <p className="mt-2 text-sm text-red-600">{fieldState.error.message}</p>}
              </div>
            )}
          />

          <Controller
            name="zipCode"
            control={form.control}
            render={({ field, fieldState }) => (
              <div>
                <FloatingInput
                  label="Zip Code"
                  value={field.value || ""}
                  onChange={(value) => field.onChange(value.replace(/\D/g, ""))}
                  onBlur={field.onBlur}
                  hasError={!!fieldState.error}
                  required
                  inputMode="numeric"
                  maxLength={5}
                />
                {fieldState.error && <p className="mt-2 text-sm text-red-600">{fieldState.error.message}</p>}
              </div>
            )}
          />
        </div>
      ),
    },
  ]

  if (!resolvedClientId) {
    return (
      <div className="max-w-5xl mx-auto p-8">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <p className="text-amber-700 font-medium">
            Please save the client first before managing addresses.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Addresses</h2>
          <p className="text-slate-600 mt-1">Manage service and residence addresses for this patient</p>
        </div>

        <Button type="button" onClick={handleOpenModal}>
          Add address
        </Button>
      </div>

      {clientAddressesError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {clientAddressesError.message}
        </div>
      )}

      <CustomTable
        columns={columns}
        data={addresses}
        isLoading={isLoadingClientAddresses}
        emptyMessage="No addresses added yet"
        hideEmptyIcon
        getRowKey={(row) => row.id}
      />

      <CustomModal
        open={isAddressModalOpen}
        onOpenChange={(open) => {
          setIsAddressModalOpen(open)
          if (!open) {
            form.reset(defaultValues)
          }
        }}
        title="New Address"
        description="Choose a source and add an address for this client"
        maxWidthClassName="sm:max-w-[920px]"
      >
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void handleSaveAddress()
          }}
          className="pb-6"
        >
          <div className="px-6 pt-6">
            <Controller
              name="nickName"
              control={form.control}
              render={({ field, fieldState }) => (
                <div>
                  <FloatingInput
                    label="Nickname"
                    value={field.value || ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    hasError={!!fieldState.error}
                    required
                  />
                  {fieldState.error && <p className="mt-2 text-sm text-red-600">{fieldState.error.message}</p>}
                </div>
              )}
            />
          </div>

          <Tabs
            items={sourceTabs}
            defaultTab={form.getValues("sourceType")}
            onChange={handleSourceTypeChange}
            className="mt-2"
          />

          <div className="px-6 mt-2">
            <Controller
              name="isPrimary"
              control={form.control}
              render={({ field }) => (
                <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
                  <PremiumSwitch
                    checked={Boolean(field.value)}
                    onCheckedChange={field.onChange}
                    label={field.value ? "Primary Address" : "Secondary Address"}
                    description="Mark as the default address for this client"
                    variant="default"
                  />
                </div>
              )}
            />
          </div>

          <div className="mt-8 flex items-center justify-end gap-3 border-t border-slate-200 px-6 pt-5">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsAddressModalOpen(false)
                form.reset(defaultValues)
              }}
              disabled={isCreating || isUpdating}
            >
              Cancel
            </Button>
            <Button type="submit" loading={isCreating || isUpdating} disabled={isCreating || isUpdating}>
              Save address
            </Button>
          </div>
        </form>
      </CustomModal>
    </div>
  )
}
