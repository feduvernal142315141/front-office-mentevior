"use client"

import { Controller, useFormContext } from "react-hook-form"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FilterSelect } from "@/components/custom/FilterSelect"
import { PremiumDatePicker } from "@/components/custom/PremiumDatePicker"
import { PremiumSwitch } from "@/components/custom/PremiumSwitch"
import { Button } from "@/components/custom/Button"
import { User, Shield, Save, Info, X, UserCheck, UserX } from "lucide-react"

interface RoleOption {
  id: string
  name: string
}

interface UserFormFieldsProps {
  isEditing: boolean
  roles: RoleOption[]
  isLoadingRoles: boolean
  isSubmitting: boolean
  onCancel: () => void
}

export function UserFormFields({
  isEditing,
  roles,
  isLoadingRoles,
  isSubmitting,
  onCancel,
}: UserFormFieldsProps) {
  const { control } = useFormContext()

  return (
    <>
      {/* Form Content - con padding bottom para la sticky bar */}
      <div className="pb-24">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="space-y-8">
            {/* Personal Information Section */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <User className="w-5 h-5 text-blue-700" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    Personal Information
                  </h3>
                  <p className="text-sm text-gray-600">
                    Basic details for this user
                  </p>
                </div>
              </div>

              {/* Grid 3 columnas en pantallas grandes */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* First Name */}
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
                      />
                      {fieldState.error && (
                        <p className="text-sm text-red-600 mt-2">
                          {fieldState.error.message}
                        </p>
                      )}
                    </div>
                  )}
                />

                {/* Last Name */}
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
                      />
                      {fieldState.error && (
                        <p className="text-sm text-red-600 mt-2">
                          {fieldState.error.message}
                        </p>
                      )}
                    </div>
                  )}
                />

                {/* Email */}
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
                      {!fieldState.error && (
                        <p className="text-xs text-gray-500 mt-1.5">Used as username</p>
                      )}
                      {fieldState.error && (
                        <p className="text-sm text-red-600 mt-2">
                          {fieldState.error.message}
                        </p>
                      )}
                    </div>
                  )}
                />

                {/* Cellphone */}
                <Controller
                  name="cellphone"
                  control={control}
                  render={({ field, fieldState }) => (
                    <div>
                      <FloatingInput
                        label="Cellphone Number"
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

                {/* Hiring Date */}
                <Controller
                  name="hiringDate"
                  control={control}
                  render={({ field, fieldState }) => (
                    <PremiumDatePicker
                      label="Hiring Date"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      hasError={!!fieldState.error}
                      errorMessage={fieldState.error?.message}
                      description={isEditing ? undefined : "Pre-filled with today's date"}
                    />
                  )}
                />
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200" />

            {/* Role and Permissions Section */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Shield className="w-5 h-5 text-purple-700" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    Role and Permissions
                  </h3>
                </div>
              </div>

              <div className="max-w-md">
                <Controller
                  name="roleId"
                  control={control}
                  render={({ field, fieldState }) => (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Role <span className="text-red-500">*</span>
                      </label>
                      <FilterSelect
                        value={field.value}
                        onChange={field.onChange}
                        options={[
                          { value: "", label: "Select a role" },
                          ...roles.map((role) => ({
                            value: role.id,
                            label: role.name,
                          })),
                        ]}
                        placeholder="Select a role"
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

            {/* User Status Section (only for edit mode) */}
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
                        User Status
                      </h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-16 max-w-4xl">
                    {/* Active Switch */}
                    <Controller
                      name="active"
                      control={control}
                      render={({ field }) => (
                        <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/50">
                          <PremiumSwitch
                            checked={field.value ?? true}
                            onCheckedChange={field.onChange}
                            label="Active User"
                            description="Enable or disable user access to the system"
                            variant="success"
                          />
                        </div>
                      )}
                    />

                    {/* Terminated Switch */}
                    <Controller
                      name="terminated"
                      control={control}
                      render={({ field }) => (
                        <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/50">
                          <PremiumSwitch
                            checked={field.value ?? false}
                            onCheckedChange={field.onChange}
                            label="Terminated"
                            description="Mark user as terminated or unemployed"
                            variant="danger"
                          />
                        </div>
                      )}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Password Generation Alert (only for create mode) */}
            {!isEditing && (
              <>
                <div className="border-t border-gray-200" />
                
                <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50/50 p-5">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                      <Info className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h5 className="text-blue-900 font-semibold text-sm mb-1">
                        Password Generation
                      </h5>
                      <p className="text-blue-800 text-sm">
                        A secure temporary password will be automatically generated and sent
                        to the user's email. The user can change it after their first login.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={isSubmitting}
              className="gap-2 flex items-center"
            >
              <X className="w-4 h-4" />
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || isLoadingRoles}
              loading={isSubmitting}
              className="gap-2 flex items-center min-w-[160px]"
            >
              {!isSubmitting && <Save className="w-4 h-4" />}
              {isEditing ? "Update User" : "Create User"}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
