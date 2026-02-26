"use client"

import { FormProvider } from "react-hook-form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Controller } from "react-hook-form"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { PremiumDatePicker } from "@/components/custom/PremiumDatePicker"
import { FormBottomBar } from "@/components/custom/FormBottomBar"
import { FilterSelect } from "@/components/custom/FilterSelect"
import { User, FileText } from "lucide-react"
import { useUpdateClient } from "@/lib/modules/clients/hooks/use-update-client"
import { 
  clientFormSchema, 
  type ClientFormValues 
} from "@/lib/schemas/client-form.schema"
import type { Client, UpdateClientDto } from "@/lib/types/client.types"
import { useLanguagesCatalog } from "@/lib/modules/languages/hooks/use-languages-catalog"
import { isoToLocalDate } from "@/lib/date"

interface PersonalInformationFormProps {
  client: Client
}

export function PersonalInformationForm({ client }: PersonalInformationFormProps) {
  const router = useRouter()
  const { update, isLoading: isUpdating } = useUpdateClient()
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const { languages, isLoading: isLoadingLanguages } = useLanguagesCatalog()

  const languageOptions = [
    { value: "", label: "Select a language" },
    ...languages.map((lang) => ({ value: lang.id, label: lang.name })),
  ]

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      firstName: client.firstName || "",
      lastName: client.lastName || "",
      phoneNumber: client.phoneNumber || "",
      chartId: client.chartId || "",
      brithDate: client.brithDate ? isoToLocalDate(client.brithDate) : "",
      languages: client.languages?.map(l => l.id) || [],
      gender: client.gender || "",
      email: client.email || "",
      ssn: client.ssn || "",
    },
  })

  useEffect(() => {
    const subscription = form.watch(() => {
      setHasUnsavedChanges(form.formState.isDirty)
    })
    return () => subscription.unsubscribe()
  }, [form])

  const onSubmit = async (data: ClientFormValues) => {
    const dto: UpdateClientDto = {
      id: client.id,
      firstName: data.firstName,
      lastName: data.lastName,
      phoneNumber: data.phoneNumber,
      chartId: data.chartId || undefined,
      brithDate: data.brithDate || undefined,
      languages: data.languages && data.languages.length > 0 ? data.languages : undefined,
      gender: data.gender || undefined,
      email: data.email || undefined,
      ssn: data.ssn || undefined,
    }

    const result = await update(client.id, dto)

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

                  <Controller
                    name="email"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <div>
                        <FloatingInput
                          label="Email"
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          placeholder=" "
                          type="email"
                          hasError={!!fieldState.error}
                          autoComplete="email"
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
                    name="gender"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <div>
                        <FloatingInput
                          label="Gender"
                          value={field.value}
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
                    name="ssn"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <div>
                        <FloatingInput
                          label="SSN"
                          value={field.value}
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
                    name="languages"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <div className="md:col-span-2 lg:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Languages
                        </label>
                        <FilterSelect
                          value={field.value?.[0] || ""}
                          onChange={(value) => field.onChange(value ? [value] : [])}
                          options={languageOptions}
                          placeholder="Select a language"
                          className="w-full"
                          fullWidth
                          disabled={isLoadingLanguages}
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
                    name="brithDate"
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
            </div>
          </div>
        </div>

        <FormBottomBar
          isSubmitting={isUpdating}
          onCancel={handleCancel}
          submitText="Save Changes"
        />
      </form>
    </FormProvider>
  )
}
