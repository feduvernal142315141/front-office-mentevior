"use client"

import { FormProvider } from "react-hook-form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Controller } from "react-hook-form"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { PremiumDatePicker } from "@/components/custom/PremiumDatePicker"
import { FormBottomBar } from "@/components/custom/FormBottomBar"
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

  const languageOptions = languages.map((lang) => ({ 
    value: lang.id, 
    label: lang.name 
  }))

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
          <div className="max-w-5xl mx-auto p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
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
                          value={field.value || ""}
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
                    name="ssn"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <div>
                        <FloatingInput
                          label="SSN"
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

              <Controller
                name="languages"
                control={form.control}
                render={({ field, fieldState }) => (
                  <div>
                    <FloatingSelect
                      label="Languages"
                      value={field.value?.[0] || ""}
                      onChange={(value) => field.onChange(value ? [value] : [])}
                      onBlur={field.onBlur}
                      options={languageOptions}
                      hasError={!!fieldState.error}
                      disabled={isLoadingLanguages}
                      searchable
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

        <FormBottomBar
          isSubmitting={isUpdating}
          onCancel={handleCancel}
          submitText="Save Changes"
        />
      </form>
    </FormProvider>
  )
}
