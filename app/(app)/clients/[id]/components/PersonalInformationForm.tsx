"use client"

import { FormProvider } from "react-hook-form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Controller } from "react-hook-form"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FilterSelect } from "@/components/custom/FilterSelect"
import { PremiumDatePicker } from "@/components/custom/PremiumDatePicker"
import { PremiumSwitch } from "@/components/custom/PremiumSwitch"
import { FormBottomBar } from "@/components/custom/FormBottomBar"
import { User, Heart, FileText, UserCheck, Info } from "lucide-react"
import { useUpdateClient } from "@/lib/modules/clients/hooks/use-update-client"
import { 
  clientEditFormSchema, 
  type ClientFormValues 
} from "@/lib/schemas/client-form.schema"
import type { Client, UpdateClientDto } from "@/lib/types/client.types"
import { isoToLocalDate } from "@/lib/date"
import { getMockInsurances } from "@/lib/modules/clients/mocks/insurances.mock"
import { useUsers } from "@/lib/modules/users/hooks/use-users"

interface PersonalInformationFormProps {
  client: Client
}

export function PersonalInformationForm({ client }: PersonalInformationFormProps) {
  const router = useRouter()
  const { update, isLoading: isUpdating } = useUpdateClient()
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const { users, isLoading: isLoadingUsers } = useUsers({
    page: 0,
    pageSize: 1000,
    filters: [],
  })

  const rbts = users
    .filter((u) => u.roleName?.toLowerCase().includes("rbt"))
    .map((u) => ({
      id: u.id,
      name: u.fullName,
    }))

  const insurances = getMockInsurances()

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientEditFormSchema),
    defaultValues: {
      firstName: client.firstName,
      lastName: client.lastName,
      phoneNumber: client.phoneNumber,
      chartId: client.chartId || "",
      diagnosisCode: client.diagnosisCode || "",
      insuranceId: client.insuranceId || "",
      rbtId: client.rbtId || "",
      dateOfBirth: client.dateOfBirth ? isoToLocalDate(client.dateOfBirth) : "",
      guardianName: client.guardianName || "",
      guardianPhone: client.guardianPhone || "",
      address: client.address || "",
      active: client.active ?? true,
    },
  })

  useEffect(() => {
    const subscription = form.watch(() => {
      setHasUnsavedChanges(form.formState.isDirty)
    })
    return () => subscription.unsubscribe()
  }, [form])

  const insuranceOptions = [
    { value: "", label: "Select an insurance" },
    ...insurances.map((ins) => ({ value: ins.id, label: ins.name })),
  ]

  const rbtOptions = [
    { value: "", label: "No RBT assigned" },
    ...rbts.map((rbt) => ({ value: rbt.id, label: rbt.name })),
  ]

  const isIncompleteProfile = !client.chartId || !client.diagnosisCode || !client.insuranceId

  const onSubmit = async (data: ClientFormValues) => {
    const dto: UpdateClientDto = {
      id: client.id,
      firstName: data.firstName,
      lastName: data.lastName,
      phoneNumber: data.phoneNumber,
      chartId: data.chartId || undefined,
      diagnosisCode: data.diagnosisCode || undefined,
      insuranceId: data.insuranceId || undefined,
      rbtId: data.rbtId || undefined,
      dateOfBirth: data.dateOfBirth || undefined,
      guardianName: data.guardianName || undefined,
      guardianPhone: data.guardianPhone || undefined,
      address: data.address || undefined,
      active: data.active,
    }

    const result = await update(dto)

    if (result) {
      setHasUnsavedChanges(false)
      form.reset(data)
    }
  }

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm("You have unsaved changes. Are you sure you want to leave?")
      if (!confirmLeave) return
    }
    router.push("/clients")
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <div className="pb-24">
          <div className="max-w-5xl mx-auto p-8 space-y-6">
            
            {isIncompleteProfile && (
              <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50/50 p-5">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
                    <Info className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h5 className="text-amber-900 font-semibold text-sm mb-1">
                      Incomplete Profile
                    </h5>
                    <p className="text-amber-800 text-sm">
                      This client was created with minimum information. Please complete the required fields below 
                      (Chart ID, Diagnosis Code, and Insurance) before this client can be used for appointments, 
                      service plans, or billing.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-7">

              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <User className="w-5 h-5 text-blue-700" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">
                      Client Information
                    </h3>
                    <p className="text-sm text-gray-600">
                      Basic identification details
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
                  <Controller
                    name="firstName"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <div>
                        <FloatingInput
                          label="First Name"
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          placeholder=" "
                          hasError={!!fieldState.error}
                          autoComplete="given-name"
                          required
                        />
                        {fieldState.error && (
                          <p className="text-sm text-red-600 mt-2">
                            {fieldState.error.message}
                          </p>
                        )}
                      </div>
                    )}
                  />

                  <Controller
                    name="lastName"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <div>
                        <FloatingInput
                          label="Last Name"
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          placeholder=" "
                          hasError={!!fieldState.error}
                          autoComplete="family-name"
                          required
                        />
                        {fieldState.error && (
                          <p className="text-sm text-red-600 mt-2">
                            {fieldState.error.message}
                          </p>
                        )}
                      </div>
                    )}
                  />

                  <Controller
                    name="phoneNumber"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <div>
                        <FloatingInput
                          label="Phone Number"
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          placeholder=" "
                          type="tel"
                          hasError={!!fieldState.error}
                          autoComplete="tel"
                          required
                        />
                        {fieldState.error && (
                          <p className="text-sm text-red-600 mt-2">
                            {fieldState.error.message}
                          </p>
                        )}
                      </div>
                    )}
                  />
                </div>
              </div>

              <div className="border-t border-gray-200" />

              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <FileText className="w-5 h-5 text-purple-700" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">
                      Clinical Information
                    </h3>
                    <p className="text-sm text-gray-600">
                      Required clinical details for service delivery
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Controller
                    name="dateOfBirth"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <PremiumDatePicker
                        label="Date of Birth"
                        value={field.value || ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        hasError={!!fieldState.error}
                        errorMessage={fieldState.error?.message}
                      />
                    )}
                  />

                  <Controller
                    name="chartId"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <div>
                        <FloatingInput
                          label="Chart ID"
                          value={field.value || ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          placeholder=" "
                          hasError={!!fieldState.error}
                          required
                        />
                        {fieldState.error && (
                          <p className="text-sm text-red-600 mt-2">
                            {fieldState.error.message}
                          </p>
                        )}
                      </div>
                    )}
                  />

                  <Controller
                    name="diagnosisCode"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <div>
                        <FloatingInput
                          label="Diagnosis Code"
                          value={field.value || ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          placeholder=" "
                          hasError={!!fieldState.error}
                          required
                        />
                        {fieldState.error && (
                          <p className="text-sm text-red-600 mt-2">
                            {fieldState.error.message}
                          </p>
                        )}
                      </div>
                    )}
                  />
                </div>
              </div>

              <div className="border-t border-gray-200" />

              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <Heart className="w-5 h-5 text-green-700" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">
                      Care Details
                    </h3>
                    <p className="text-sm text-gray-600">
                      Insurance and assigned therapist
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Controller
                    name="insuranceId"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Insurance <span className="text-[#2563EB]">*</span>
                        </label>
                        <FilterSelect
                          value={field.value || ""}
                          onChange={field.onChange}
                          options={insuranceOptions}
                          placeholder="Select an insurance"
                          className="w-full"
                          fullWidth
                        />
                        {fieldState.error && (
                          <p className="text-sm text-red-600 mt-2">
                            {fieldState.error.message}
                          </p>
                        )}
                      </div>
                    )}
                  />

                  <Controller
                    name="rbtId"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Assigned RBT
                        </label>
                        <FilterSelect
                          value={field.value || ""}
                          onChange={field.onChange}
                          options={rbtOptions}
                          placeholder="Select an RBT"
                          className="w-full"
                          fullWidth
                          disabled={isLoadingUsers}
                        />
                        {fieldState.error && (
                          <p className="text-sm text-red-600 mt-2">
                            {fieldState.error.message}
                          </p>
                        )}
                      </div>
                    )}
                  />
                </div>
              </div>

              <div className="border-t border-gray-200" />

              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-amber-50 rounded-lg">
                    <FileText className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">
                      Guardian Information
                    </h3>
                    <p className="text-sm text-gray-600">
                      Contact details for the client's guardian
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Controller
                    name="guardianName"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <div>
                        <FloatingInput
                          label="Guardian Name"
                          value={field.value || ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          placeholder=" "
                          hasError={!!fieldState.error}
                        />
                        {fieldState.error && (
                          <p className="text-sm text-red-600 mt-2">
                            {fieldState.error.message}
                          </p>
                        )}
                      </div>
                    )}
                  />

                  <Controller
                    name="guardianPhone"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <div>
                        <FloatingInput
                          label="Guardian Phone"
                          value={field.value || ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          placeholder=" "
                          type="tel"
                          hasError={!!fieldState.error}
                          autoComplete="tel"
                        />
                        {fieldState.error && (
                          <p className="text-sm text-red-600 mt-2">
                            {fieldState.error.message}
                          </p>
                        )}
                      </div>
                    )}
                  />

                  <Controller
                    name="address"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <div className="md:col-span-2 lg:col-span-1">
                        <FloatingInput
                          label="Address"
                          value={field.value || ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          placeholder=" "
                          hasError={!!fieldState.error}
                        />
                        {fieldState.error && (
                          <p className="text-sm text-red-600 mt-2">
                            {fieldState.error.message}
                          </p>
                        )}
                      </div>
                    )}
                  />
                </div>
              </div>

              <div className="border-t border-gray-200" />
              
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-sky-50 rounded-lg">
                    <UserCheck className="w-5 h-5 text-sky-700" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">
                      Client Status
                    </h3>
                  </div>
                </div>

                <Controller
                  name="active"
                  control={form.control}
                  render={({ field }) => (
                    <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/50 max-w-md">
                      <PremiumSwitch
                        checked={field.value ?? true}
                        onCheckedChange={field.onChange}
                        label="Active Client"
                        description="Enable or disable client's active status"
                        variant="success"
                      />
                    </div>
                  )}
                />
              </div>
            </div>
          </div>
        </div>

        <FormBottomBar
          isSubmitting={isUpdating}
          onCancel={handleCancel}
          submitText="Save Changes"
          disabled={isLoadingUsers}
        />
      </form>
    </FormProvider>
  )
}
