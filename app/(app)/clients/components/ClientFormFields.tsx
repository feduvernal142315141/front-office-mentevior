"use client"

import { useState } from "react"
import { Controller, useFormContext } from "react-hook-form"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { PremiumDatePicker } from "@/components/custom/PremiumDatePicker"
import { FormBottomBar } from "@/components/custom/FormBottomBar"
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
  const [isEditingSSN, setIsEditingSSN] = useState(false)
  
  const languageOptions = [
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
                        value={field.value || ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        placeholder=" "
                        type="email"
                        hasError={!!fieldState.error}
                        autoComplete="email"
                        required={isEditing}
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
                        value={field.value || ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        placeholder=" "
                        hasError={!!fieldState.error}
                        required={isEditing}
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
                  render={({ field, fieldState }) => {
                    // Get clean SSN (only digits)
                    const cleanSSN = (field.value || "").replace(/\D/g, "")
                    
                    // Display value based on editing state and SSN length
                    let displayValue = cleanSSN
                    
                    if (!isEditingSSN) {
                      if (cleanSSN.length === 9) {
                        // Full SSN: show xxx-xx-4444
                        displayValue = `xxx-xx-${cleanSSN.slice(5)}`
                      } else if (cleanSSN.length === 4) {
                        // Partial SSN (last 4 from backend): show xxx-xx-4444
                        displayValue = `xxx-xx-${cleanSSN}`
                      } else {
                        // Unknown length: show as is
                        displayValue = field.value || ""
                      }
                    }

                    return (
                      <div 
                        data-field="ssn"
                        onFocus={() => setIsEditingSSN(true)}
                        onBlur={() => setIsEditingSSN(false)}
                      >
                        <FloatingInput
                          label="Social Security Number (SSN)"
                          name="ssn"
                          value={displayValue}
                          onChange={(value) => {
                            // When user starts typing, switch to edit mode and accept only digits
                            const digits = value.replace(/\D/g, "").slice(0, 9)
                            field.onChange(digits)
                          }}
                          onBlur={() => {
                            field.onBlur()
                          }}
                          placeholder="XXX-XX-XXXX"
                          hasError={!!fieldState.error}
                          type="text"
                          maxLength={isEditingSSN ? 9 : 11}
                          required={isEditing}
                        />
                        {fieldState.error && (
                          <p className="text-sm text-red-600 mt-2">
                            {fieldState.error.message}
                          </p>
                        )}
                      </div>
                    )
                  }}
                />

                <Controller
                  name="languages"
                  control={control}
                  render={({ field, fieldState }) => (
                    <div>
                      <FloatingSelect
                        label="Languages"
                        value={field.value?.[0] || ""}
                        onChange={(value: string) => field.onChange(value ? [value] : [])}
                        onBlur={field.onBlur}
                        options={languageOptions}
                        hasError={!!fieldState.error}
                        disabled={isLoadingLanguages}
                        searchable
                        required={isEditing}
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
                      required={isEditing}
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
                        required={isEditing}
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
