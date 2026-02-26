"use client"

import { Controller, useFormContext } from "react-hook-form"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { PremiumDatePicker } from "@/components/custom/PremiumDatePicker"
import { FormBottomBar } from "@/components/custom/FormBottomBar"
import { FilterSelect } from "@/components/custom/FilterSelect"
import { User, FileText, Languages } from "lucide-react"
import { useLanguagesCatalog } from "@/lib/modules/languages/hooks/use-languages-catalog"

interface ClientFormFieldsProps {
  isEditing: boolean
  isSubmitting: boolean
  onCancel: () => void
}

export function ClientFormFields({
  isEditing,
  isSubmitting,
  onCancel,
}: ClientFormFieldsProps) {
  const { control } = useFormContext()
  const { languages, isLoading: isLoadingLanguages } = useLanguagesCatalog()
  
  const languageOptions = [
    { value: "", label: "Select languages" },
    ...languages.map((lang) => ({ value: lang.id, label: lang.name })),
  ]

  return (
    <>
      <div className="pb-24">
        <div className="max-w-5xl mx-auto space-y-6">
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
                    {isEditing 
                      ? "Basic details for this client" 
                      : "Required fields to create a new client"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      
                <Controller
                  name="firstName"
                  control={control}
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
                  control={control}
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
                  control={control}
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
                  control={control}
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
                  control={control}
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
                  control={control}
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
                  control={control}
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
                    Clinical details for the client
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Controller
                  name="brithDate"
                  control={control}
                  render={({ field, fieldState }) => (
                    <PremiumDatePicker
                      label="Date of Birth"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      hasError={!!fieldState.error}
                      errorMessage={fieldState.error?.message}
                    />
                  )}
                />

                <Controller
                  name="chartId"
                  control={control}
                  render={({ field, fieldState }) => (
                    <div>
                      <FloatingInput
                        label="Chart ID"
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
              </div>
            </div>
          </div>
        </div>
      </div>

      <FormBottomBar
        isSubmitting={isSubmitting}
        onCancel={onCancel}
        submitText={isEditing ? "Update Client" : "Create Client"}
      />
    </>
  )
}
