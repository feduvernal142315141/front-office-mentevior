"use client"

import { Controller, useFormContext } from "react-hook-form"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FilterSelect } from "@/components/custom/FilterSelect"
import { PremiumDatePicker } from "@/components/custom/PremiumDatePicker"
import { PremiumSwitch } from "@/components/custom/PremiumSwitch"
import { FormBottomBar } from "@/components/custom/FormBottomBar"
import { User, Shield, Info, UserCheck } from "lucide-react"

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
  currentUser: any
  editingUser: any
}

export function UserFormFields({
  isEditing,
  roles,
  isLoadingRoles,
  isSubmitting,
  onCancel,
  currentUser,
  editingUser,
}: UserFormFieldsProps) {
  const { control, setValue } = useFormContext()

  const isEditingSelf = isEditing && 
    currentUser && 
    editingUser && 
    currentUser.email?.toLowerCase() === editingUser.email?.toLowerCase() &&
    editingUser.role?.name?.toLowerCase() === "superadmin"

  return (
    <>

      <div className="pb-24">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="space-y-8">

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

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      
                <Controller
                  name="firstName"
                  control={control}
                  render={({ field, fieldState }) => (
                    <div>
                      <FloatingInput
                        label={"First Name"}
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
                        required
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

    
            <div className="border-t border-gray-200" />

      
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
                        Role <span className="text-[#2563EB]">*</span>
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
             
                    <Controller
                      name="active"
                      control={control}
                      render={({ field }) => (
                        <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/50">
                          <PremiumSwitch
                            checked={field.value ?? true}
                            onCheckedChange={(checked) => {
                              field.onChange(checked)
          
                              if (checked) {
                                setValue("terminated", false)
                              }
                            }}
                            label="Active User"
                            description={isEditingSelf ? "Cannot modify your own status" : "Enable or disable user access to the system"}
                            variant="success"
                            disabled={isEditingSelf}
                          />
                        </div>
                      )}
                    />

                    <Controller
                      name="terminated"
                      control={control}
                      render={({ field }) => (
                        <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/50">
                          <PremiumSwitch
                            checked={field.value ?? false}
                            onCheckedChange={(checked) => {
                              field.onChange(checked)
                              if (checked) {
                                setValue("active", false)
                              }
                            }}
                            label="Terminated"
                            description={isEditingSelf ? "Cannot modify your own status" : "Mark user as terminated or unemployed"}
                            variant="danger"
                            disabled={isEditingSelf}
                          />
                        </div>
                      )}
                    />
                  </div>
                </div>
              </>
            )}

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

      {/* Fixed Bottom Bar */}
      <FormBottomBar
        isSubmitting={isSubmitting}
        onCancel={onCancel}
        submitText={isEditing ? "Update User" : "Create User"}
        disabled={isLoadingRoles}
      />
    </>
  )
}
