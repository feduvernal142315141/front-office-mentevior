"use client"

import { type ReactNode, useEffect, useMemo, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Home, Building2, Edit2, Trash2 } from "lucide-react"
import { Button } from "@/components/custom/Button"
import { CustomModal } from "@/components/custom/CustomModal"
import { CustomTable, type CustomTableColumn } from "@/components/custom/CustomTable"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { PremiumSwitch } from "@/components/custom/PremiumSwitch"
import { Badge } from "@/components/ui/badge"
import { useAddresses } from "@/lib/modules/addresses/hooks/use-addresses"
import { useCountries } from "@/lib/modules/addresses/hooks/use-countries"
import { useStates } from "@/lib/modules/addresses/hooks/use-states"
import { usePlacesOfService } from "@/lib/modules/addresses/hooks/use-places-of-service"
import { useClientAddresses } from "@/lib/modules/client-addresses/hooks/use-client-addresses"
import { useCreateClientAddress } from "@/lib/modules/client-addresses/hooks/use-create-client-address"
import { useUpdateClientAddress } from "@/lib/modules/client-addresses/hooks/use-update-client-address"
import { useDeleteClientAddress } from "@/lib/modules/client-addresses/hooks/use-delete-client-address"
import { getClientAddressById } from "@/lib/modules/client-addresses/services/client-addresses.service"
import { DeleteConfirmModal } from "@/components/custom/DeleteConfirmModal"
import type { ClientAddress, CreateClientAddressDto } from "@/lib/types/client-address.types"
import type { StepComponentProps } from "@/lib/types/wizard.types"
import { cn } from "@/lib/utils"

const alphanumericWithSpaces = /^[a-zA-Z0-9 ]+$/

const addressSourceSchema = z.object({
  sourceType: z.enum(["agency", "manual"]).optional(),
  nickName: z
    .string()
    .trim()
    .max(100, "Nickname must be less than 100 characters")
    .regex(alphanumericWithSpaces, { message: "Nickname must be alphanumeric" })
    .optional()
    .or(z.literal("")),
  isPrimary: z.boolean(),
  selectedAgencyAddressId: z.string().optional(),
  placeServiceId: z.string().optional(),
  addressLine1: z.string().optional(),
  apartmentSuite: z.string().optional(),
  city: z.string().optional(),
  stateId: z.string().optional(),
  zipCode: z.string().optional(),
  countryId: z.string().optional(),
}).superRefine((value, ctx) => {
  if (!value.sourceType) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Choose an address source",
      path: ["sourceType"],
    })
  }

  if (value.sourceType === "agency" && !value.selectedAgencyAddressId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Select one agency address",
      path: ["selectedAgencyAddressId"],
    })
  }

  if (value.sourceType !== "agency") {
    if (!value.nickName || value.nickName.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Nickname is required",
        path: ["nickName"],
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
type AddressSourceType = NonNullable<AddressSourceFormValues["sourceType"]>
type AddressModalStage = "select-source" | "edit-form"

const defaultValues: AddressSourceFormValues = {
  sourceType: undefined,
  nickName: "",
  isPrimary: false,
  selectedAgencyAddressId: "",
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
  onProgressUpdate,
  registerSubmit,
  registerValidation,
  onStepStatusChange,
}: StepComponentProps) {
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
  const [addressModalStage, setAddressModalStage] = useState<AddressModalStage>("select-source")
  const [editingAddress, setEditingAddress] = useState<ClientAddress | null>(null)
  const [deletingAddress, setDeletingAddress] = useState<ClientAddress | null>(null)

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
  const { create, createFromCompanyAddress, isLoading: isCreating } = useCreateClientAddress()
  const { update, isLoading: isUpdating } = useUpdateClientAddress()
  const { remove, isLoading: isDeleting } = useDeleteClientAddress()

  const {
    addresses: agencyAddresses,
    isLoading: isLoadingAgencyAddresses,
  } = useAddresses({ page: 0, pageSize: 200 })
  const { countries, isLoading: isLoadingCountries } = useCountries()
  const { placesOfService, isLoading: isLoadingPlaces } = usePlacesOfService()

  const form = useForm<AddressSourceFormValues>({
    resolver: zodResolver(addressSourceSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues,
  })

  const selectedCountryId = form.watch("countryId")
  const { states, isLoading: isLoadingStates } = useStates(selectedCountryId || null)

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

  const handleOpenModal = () => {
    form.reset({
      ...defaultValues,
      isPrimary: !isLoadingClientAddresses && addresses.length === 0,
    })
    setAddressModalStage("select-source")
    setIsAddressModalOpen(true)
  }

  const handleOpenEditModal = async (address: ClientAddress) => {
    if (address.canEdit !== true) return

    setEditingAddress(address)
    setAddressModalStage("edit-form")
    setIsAddressModalOpen(true)

    try {
      const full = await getClientAddressById(address.id)
      const data = full ?? address
      form.reset({
        sourceType: "manual",
        nickName: data.nickName || "",
        isPrimary: data.isPrimary,
        selectedAgencyAddressId: "",
        placeServiceId: data.placeServiceId || "",
        addressLine1: data.addressLine1 || "",
        apartmentSuite: data.apartmentSuite || "",
        city: data.city || "",
        stateId: data.stateId || "",
        zipCode: data.zipCode || "",
        countryId: data.countryId || "",
      })
    } catch {
      form.reset({
        sourceType: "manual",
        nickName: address.nickName || "",
        isPrimary: address.isPrimary,
        selectedAgencyAddressId: "",
        placeServiceId: address.placeServiceId || "",
        addressLine1: address.addressLine1 || "",
        apartmentSuite: address.apartmentSuite || "",
        city: address.city || "",
        stateId: address.stateId || "",
        zipCode: address.zipCode || "",
        countryId: address.countryId || "",
      })
    }
  }

  const handleSourceTypeChange = (sourceType: AddressSourceType) => {
    form.setValue("sourceType", sourceType)
    setAddressModalStage("edit-form")
  }

  const handleCloseModal = () => {
    setIsAddressModalOpen(false)
    setAddressModalStage("select-source")
    form.reset(defaultValues)
  }

  const handleSaveAddress = form.handleSubmit(async (values) => {
    if (!resolvedClientId) {
      onValidationError({ general: "Client not found" })
      return
    }

    const duplicate = values.sourceType !== "agency" && values.nickName && addresses.some(
      (address) =>
        normalizeNickname(address.nickName) === normalizeNickname(values.nickName ?? "") &&
        address.id !== editingAddress?.id
    )

    if (duplicate) {
      form.setError("nickName", {
        type: "manual",
        message: "Nickname already exists for this client",
      })
      onValidationError({ nickName: "Nickname already exists for this client" })
      return
    }

    if (editingAddress) {
      const selectedState = states.find((state) => state.id === values.stateId)
      const selectedCountry = countries.find((country) => country.id === values.countryId)

      const result = await update({
        id: editingAddress.id,
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
      })
      if (!result) return

      if (typeof result.progress === "number") {
        onProgressUpdate?.(result.progress)
      }
      setEditingAddress(null)
      form.reset(defaultValues)
      setAddressModalStage("select-source")
      setIsAddressModalOpen(false)
      await refetchClientAddresses()
      return
    }

    if (values.sourceType === "agency" && values.selectedAgencyAddressId) {
      const result = await createFromCompanyAddress({
        clientId: resolvedClientId,
        companyAddressId: values.selectedAgencyAddressId,
        isPrimary: values.isPrimary,
      })
      if (!result) return

      if (typeof result.progress === "number") {
        onProgressUpdate?.(result.progress)
      }
      form.reset(defaultValues)
      setAddressModalStage("select-source")
      setIsAddressModalOpen(false)
      await refetchClientAddresses()
      return
    }

    let payload: CreateClientAddressDto | null = null

    if (values.sourceType === "manual") {
      const selectedState = states.find((state) => state.id === values.stateId)
      const selectedCountry = countries.find((country) => country.id === values.countryId)

      payload = {
        clientId: resolvedClientId,
        nickName: values.nickName ?? "",
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

    if (!payload) {
      onValidationError({ general: "Unable to build address payload" })
      return
    }

    const result = await create(payload)
    if (!result) return

    if (typeof result.progress === "number") {
      onProgressUpdate?.(result.progress)
    }
    form.reset(defaultValues)
    setAddressModalStage("select-source")
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

  const sourceSections: {
    id: AddressSourceType
    label: string
    helper: string
    icon: ReactNode
    contentTitle: string
    contentDescription: string
    content: ReactNode
  }[] = [
    {
      id: "agency",
      label: "Agency",
      helper: "Use an existing company address",
      icon: <Building2 className="w-4 h-4" />,
      contentTitle: "Select an agency address",
      contentDescription: "Pull address details directly from your company address book.",
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
                  onChange={field.onChange}
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
      id: "manual",
      label: "Manual",
      helper: "Enter a brand-new address",
      icon: <Home className="w-4 h-4" />,
      contentTitle: "Enter address manually",
      contentDescription: "Fill in all required location fields for a new address.",
      content: (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Controller
            name="placeServiceId"
            control={form.control}
            render={({ field, fieldState }) => (
              <div className="md:col-span-2">
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
              <div className="md:col-span-2">
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
        </div>
      ),
    },
  ]

  const columns: CustomTableColumn<ClientAddress>[] = [
    {
      key: "nickName",
      header: "Nickname",
      className: "min-w-[180px]",
      render: (address) => <span className="font-medium text-slate-900">{address.nickName}</span>,
    },
    {
      key: "placeServiceName",
      header: "Place of Service",
      className: "min-w-[180px]",
      render: (address) => address.placeServiceName || "-",
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
      className: "w-[120px] whitespace-nowrap",
      align: "right",
      render: (address) => (
        <div className="flex justify-end gap-2">
          {address.canEdit === true && (
            <button
              type="button"
              onClick={() => handleOpenEditModal(address)}
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
              title="Edit address"
              aria-label="Edit address"
            >
              <Edit2 className="w-4 h-4 text-blue-600 group-hover/edit:text-blue-700 transition-colors duration-200" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setDeletingAddress(address)}
            className={cn(
              "group/trash relative h-9 w-9",
              "flex items-center justify-center rounded-xl",
              "bg-gradient-to-b from-red-50 to-red-100/80",
              "border border-red-200/60 shadow-sm",
              "hover:from-red-100 hover:to-red-200/90",
              "hover:border-red-300/80 hover:shadow-md",
              "hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm",
              "transition-all duration-200 ease-out",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/30 focus-visible:ring-offset-2"
            )}
            title="Delete address"
            aria-label="Delete address"
          >
            <Trash2 className="w-4 h-4 text-red-500 group-hover/trash:text-red-700 transition-colors duration-200" />
          </button>
        </div>
      ),
    },
  ]

  const activeSourceType = form.watch("sourceType")
  const activeSourceSection = activeSourceType
    ? sourceSections.find((section) => section.id === activeSourceType)
    : undefined
  const isManualFormActive = addressModalStage === "edit-form" && activeSourceType === "manual"
  const hasPrefilledAddressData = Boolean(
    form.getValues("nickName") ||
      form.getValues("selectedAgencyAddressId") ||
      form.getValues("addressLine1")
  )

  if (!resolvedClientId) {
    return (
      <div className="w-full px-6 py-8 sm:px-8">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <p className="text-amber-700 font-medium">
            Please save the client first before managing addresses.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full px-6 py-8 sm:px-8">
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
          if (open) {
            setAddressModalStage(hasPrefilledAddressData ? "edit-form" : "select-source")
          } else {
            setAddressModalStage("select-source")
            setEditingAddress(null)
            form.reset(defaultValues)
          }
        }}
        title={
          editingAddress
            ? "Edit Address"
            : addressModalStage === "select-source"
            ? "New Address"
            : activeSourceSection?.label ?? "New Address"
        }
        description={
          editingAddress
            ? "Update the address details"
            : addressModalStage === "select-source"
            ? "Choose where this address comes from"
            : activeSourceSection?.helper
        }
        maxWidthClassName="sm:max-w-[600px]"
        allowSelectOverflow
        contentClassName="overflow-visible"
      >
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void handleSaveAddress()
          }}
          className="flex flex-col"
        >
          <div className="px-6 py-5 overflow-visible">
            {addressModalStage === "select-source" ? (
              <div className="grid grid-cols-1 gap-3">
                {sourceSections.map((section) => (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => handleSourceTypeChange(section.id)}
                    className={cn(
                      "group flex items-center gap-4 rounded-2xl border-2 border-gray-200 bg-white p-5 text-left",
                      "hover:border-[#037ECC] hover:shadow-lg hover:shadow-blue-900/8",
                      "transition-all duration-200",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#037ECC]/30 focus-visible:ring-offset-2"
                    )}
                  >
                    <span className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                      "bg-blue-50 text-[#037ECC]",
                      "group-hover:bg-[#037ECC] group-hover:text-white",
                      "transition-colors duration-200"
                    )}>
                      {section.icon}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{section.label}</p>
                      <p className="mt-0.5 text-xs text-gray-500">{section.helper}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-5">
                {activeSourceType !== "agency" && (
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
                        {fieldState.error && <p className="mt-1.5 text-xs text-red-500">{fieldState.error.message}</p>}
                      </div>
                    )}
                  />
                )}

                <div className="border-t border-gray-100" />

                <div>{activeSourceSection?.content}</div>

                <div className="border-t border-gray-100" />

                <Controller
                  name="isPrimary"
                  control={form.control}
                  render={({ field }) => (
                    <PremiumSwitch
                      checked={Boolean(field.value)}
                      onCheckedChange={field.onChange}
                      label={field.value ? "Primary address" : "Secondary address"}
                      description={
                        field.value
                          ? "Used as the default address for this client."
                          : "Saved as an additional address."
                      }
                      variant="default"
                    />
                  )}
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-gray-200 bg-white px-6 py-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (addressModalStage === "edit-form") {
                  setAddressModalStage("select-source")
                  return
                }
                handleCloseModal()
              }}
              disabled={isCreating || isUpdating}
            >
              {addressModalStage === "edit-form" ? "Back" : "Cancel"}
            </Button>

            {addressModalStage === "edit-form" && (
              <Button
                type="submit"
                loading={isCreating || isUpdating}
                disabled={isCreating || isUpdating}
              >
                Save address
              </Button>
            )}
          </div>
        </form>
      </CustomModal>

      <DeleteConfirmModal
        isOpen={!!deletingAddress}
        onClose={() => setDeletingAddress(null)}
        onConfirm={async () => {
          if (!deletingAddress) return
          const progress = await remove(deletingAddress.id)
          if (progress !== null) {
            onProgressUpdate?.(progress)
            setDeletingAddress(null)
            await refetchClientAddresses()
          }
        }}
        title="Delete address"
        message="Are you sure you want to delete this address? This action cannot be undone."
        itemName={deletingAddress?.nickName}
        isDeleting={isDeleting}
      />
    </div>
  )
}
