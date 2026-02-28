"use client"

import { useState } from "react"
import { Controller, useFormContext } from "react-hook-form"
import Link from "next/link"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { PremiumDatePicker } from "@/components/custom/PremiumDatePicker"
import { PremiumSwitch } from "@/components/custom/PremiumSwitch"
import { FormBottomBar } from "@/components/custom/FormBottomBar"
import { User, FileText, Sliders, ArrowRight, UserCheck } from "lucide-react"
import { useLanguagesCatalog } from "@/lib/modules/languages/hooks/use-languages-catalog"
import { useGenderCatalog } from "@/lib/modules/gender/hooks/use-gender-catalog"
import { formatPhoneInput } from "@/lib/utils/phone-format"

interface ClientFormFieldsProps {
  isEditing: boolean
  isSubmitting: boolean
  onCancel: () => void
  editingClientId?: string
}

export function ClientFormFields({
  isEditing,
  isSubmitting,
  onCancel,
  editingClientId,
}: ClientFormFieldsProps) {
  const { control } = useFormContext()
  const { languages, isLoading: isLoadingLanguages } = useLanguagesCatalog()
  const { genders, isLoading: isLoadingGenders } = useGenderCatalog()
  const [isEditingSSN, setIsEditingSSN] = useState(false)
  
  const languageOptions = [
    ...languages.map((lang) => ({ value: lang.id, label: lang.name })),
  ]

  const genderOptions = [
    ...genders.map((gender) => ({ value: gender.id, label: gender.name })),
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
                  render={({ field, fieldState }) => {
                    const [displayValue, setDisplayValue] = useState(formatPhoneInput(field.value || ""))
                    
                    return (
                      <div>
                        <FloatingInput
                          label="Phone Number"
                          value={displayValue}
                          onChange={(value) => {
                            const formatted = formatPhoneInput(value, displayValue)
                            setDisplayValue(formatted)
                            field.onChange(formatted)
                          }}
                          onBlur={field.onBlur}
                          placeholder="(305) 555-1234"
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
                    )
                  }}
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
                  name="genderId"
                  control={control}
                  render={({ field, fieldState }) => (
                    <div>
                      <FloatingSelect
                        label="Gender"
                        value={field.value || ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        options={genderOptions}
                        hasError={!!fieldState.error}
                        disabled={isLoadingGenders}
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
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <FileText className="w-5 h-5 text-purple-700" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    Clinical Information
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                <div className="space-y-6">
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

                {isEditing && editingClientId && (
                  <Link href={`/clients/${editingClientId}/profile`} className="block w-full">
                    <div className="group relative overflow-hidden cursor-pointer rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm hover:border-[#037ECC]/40 hover:shadow-lg hover:shadow-[#037ECC]/10 transition-all duration-300 h-full min-h-[112px] flex items-center">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#037ECC]/0 via-[#079CFB]/0 to-[#037ECC]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                      <div className="relative px-5 py-4 w-full">
                        <div className="flex items-start gap-3.5">
                          <div className="flex-shrink-0 p-2.5 rounded-xl bg-[#037ECC]/10 text-[#037ECC] ring-1 ring-inset ring-[#037ECC]/20 group-hover:bg-[#037ECC]/15 transition-colors">
                            <Sliders className="w-5 h-5" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <h4 className="text-sm font-semibold text-slate-900 group-hover:text-[#037ECC] transition-colors leading-tight">
                                Client Management
                              </h4>
                              <ArrowRight className="w-4 h-4 text-[#037ECC] group-hover:text-[#079CFB] group-hover:translate-x-0.5 transition-all duration-300 flex-shrink-0 mt-0.5" />
                            </div>
                            <p className="text-xs text-slate-600 leading-snug">
                              Advanced configuration for this client
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700" />
                    </div>
                  </Link>
                )}
              </div>
            </div>

            {isEditing && (
              <>
                <div className="border-t border-gray-200" />
                
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <UserCheck className="w-5 h-5 text-green-700" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">
                        Client Status
                      </h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Controller
                      name="active"
                      control={control}
                      render={({ field }) => (
                        <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/50">
                          <PremiumSwitch
                            checked={field.value ?? true}
                            onCheckedChange={field.onChange}
                            label="Active Client"
                            description="Enable or disable client access and visibility"
                            variant="success"
                          />
                        </div>
                      )}
                    />
                  </div>
                </div>
              </>
            )}
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
