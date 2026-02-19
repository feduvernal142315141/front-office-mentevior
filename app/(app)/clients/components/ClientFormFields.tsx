"use client"

import { Controller, useFormContext } from "react-hook-form"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FilterSelect } from "@/components/custom/FilterSelect"
import { PremiumDatePicker } from "@/components/custom/PremiumDatePicker"
import { PremiumSwitch } from "@/components/custom/PremiumSwitch"
import { FormBottomBar } from "@/components/custom/FormBottomBar"
import { User, Heart, FileText, UserCheck } from "lucide-react"
import type { Insurance } from "@/lib/modules/clients/mocks/insurances.mock"

interface RbtOption {
  id: string
  name: string
}

interface ClientFormFieldsProps {
  isEditing: boolean
  insurances: Insurance[]
  rbts: RbtOption[]
  isLoadingRbts: boolean
  isSubmitting: boolean
  onCancel: () => void
}

export function ClientFormFields({
  isEditing,
  insurances,
  rbts,
  isLoadingRbts,
  isSubmitting,
  onCancel,
}: ClientFormFieldsProps) {
  const { control } = useFormContext()

  const insuranceOptions = [
    { value: "", label: "Select an insurance" },
    ...insurances.map((ins) => ({ value: ins.id, label: ins.name })),
  ]

  const rbtOptions = [
    { value: "", label: "No RBT assigned" },
    ...rbts.map((rbt) => ({ value: rbt.id, label: rbt.name })),
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

                {!isEditing && (
                  <div className="md:col-span-2 lg:col-span-3">
                    <Controller
                      name="active"
                      control={control}
                      render={({ field }) => (
                        <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/50 max-w-md">
                          <PremiumSwitch
                            checked={field.value ?? true}
                            onCheckedChange={field.onChange}
                            label="Active Client"
                            description="Set initial client status"
                            variant="success"
                          />
                        </div>
                      )}
                    />
                  </div>
                )}
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
                    {isEditing ? "Required clinical details" : "Optional - can be completed later"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Controller
                  name="dateOfBirth"
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
                  name="diagnosisCode"
                  control={control}
                  render={({ field, fieldState }) => (
                    <div>
                      <FloatingInput
                        label="Diagnosis Code"
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
                    {isEditing ? "Insurance and assigned therapist" : "Optional - can be assigned later"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Controller
                  name="insuranceId"
                  control={control}
                  render={({ field, fieldState }) => (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Insurance {isEditing && <span className="text-[#2563EB]">*</span>}
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
                  control={control}
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
                        disabled={isLoadingRbts}
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
                  control={control}
                  render={({ field, fieldState }) => (
                    <div>
                      <FloatingInput
                        label="Guardian Name"
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
                  name="guardianPhone"
                  control={control}
                  render={({ field, fieldState }) => (
                    <div>
                      <FloatingInput
                        label="Guardian Phone"
                        value={field.value}
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
                  control={control}
                  render={({ field, fieldState }) => (
                    <div className="md:col-span-2 lg:col-span-1">
                      <FloatingInput
                        label="Address"
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

            {isEditing && (
              <>
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
                    control={control}
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
              </>
            )}
          </div>
        </div>
      </div>

      <FormBottomBar
        isSubmitting={isSubmitting}
        onCancel={onCancel}
        submitText={isEditing ? "Update Client" : "Create Client"}
        disabled={isLoadingRbts}
      />
    </>
  )
}
