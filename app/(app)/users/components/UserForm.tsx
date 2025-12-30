"use client"

import { FormProvider } from "react-hook-form"
import { useUserForm } from "../hooks/useUserForm"
import { FormTextField, FormSelectField, FormDateField } from "@/components/form"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2, Save } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

function SuccessScreen({
  email,
  temporaryPassword,
  countdown,
  onCreateAnother,
  onGoToList,
}: {
  email: string
  temporaryPassword: string
  countdown: number
  onCreateAnother: () => void
  onGoToList: () => void
}) {
  return (
    <div className="space-y-6">
      <Alert className="border-green-200 bg-green-50">
        <AlertCircle className="h-5 w-5 text-green-600" />
        <AlertTitle className="text-green-900 font-semibold">
          User Created Successfully!
        </AlertTitle>
        <AlertDescription className="text-green-800 mt-2">
          <p>The user has been created and a welcome email has been sent to:</p>
          <p className="font-mono font-bold mt-2">{email}</p>
        </AlertDescription>
      </Alert>

      <Alert className="border-yellow-200 bg-yellow-50">
        <AlertCircle className="h-5 w-5 text-yellow-600" />
        <AlertTitle className="text-yellow-900 font-semibold">
          Temporary Password
        </AlertTitle>
        <AlertDescription className="text-yellow-800 mt-2">
          <p className="mb-2">This password will only be shown once. Please save it:</p>
          <div className="bg-white border border-yellow-300 rounded-lg p-4 mt-3">
            <code className="text-lg font-mono font-bold text-gray-900 break-all">
              {temporaryPassword}
            </code>
          </div>
          <p className="text-sm mt-3 text-yellow-700">
            ⚠️ The user can change this password after their first login.
          </p>
        </AlertDescription>
      </Alert>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Auto-redirect</AlertTitle>
        <AlertDescription>
          Redirecting to users list in <strong>{countdown}</strong> seconds...
        </AlertDescription>
      </Alert>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onCreateAnother} className="flex-1">
          Create Another User
        </Button>
        <Button onClick={onGoToList} className="flex-1">
          Go to Users List
        </Button>
      </div>
    </div>
  )
}

function FormSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
      <div>
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
      <Skeleton className="h-20 w-full" />
      <div className="flex gap-3">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 flex-1" />
      </div>
    </div>
  )
}

interface UserFormProps {
  userId?: string | null
}

export function UserForm({ userId = null }: UserFormProps) {
  const {
    form,
    mode,
    isEditing,
    roles,
    isLoadingRoles,
    isLoadingUser,
    onSubmit,
    isSubmitting,
    response,
    uiState,
    actions,
  } = useUserForm({ userId })

  if (isEditing && isLoadingUser) {
    return <FormSkeleton />
  }

  if (response && uiState.showPassword && !isEditing) {
    return (
      <SuccessScreen
        email={response.email}
        temporaryPassword={response.temporaryPassword}
        countdown={uiState.redirectCountdown}
        onCreateAnother={actions.createAnother}
        onGoToList={actions.goToList}
      />
    )
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Personal Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormTextField
              name="firstName"
              label="First Name"
              placeholder="John"
              required
            />

            <FormTextField
              name="lastName"
              label="Last Name"
              placeholder="Doe"
              required
            />

            <FormTextField
              name="email"
              label="Email"
              type="email"
              placeholder="john.doe@example.com"
              description="This email will be used as username to access the Front Office"
              required
            />

            <FormTextField
              name="cellphone"
              label="Cellphone Number"
              type="tel"
              placeholder="+1 (555) 123-4567"
              required
            />

            <FormDateField
              name="hiringDate"
              label="Hiring Date"
              description={
                isEditing
                  ? "Date when the user was hired"
                  : "Pre-filled with today's date (editable)"
              }
              required
            />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Role and Permissions
          </h3>

          <FormSelectField
            name="roleId"
            label="Role"
            placeholder="Select a role"
            options={roles}
            optionLabel="name"
            optionValue="id"
            description="The role determines which permissions the user will have"
            disabled={isLoadingRoles}
            required
          />
        </div>

        {!isEditing && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Password Generation</AlertTitle>
            <AlertDescription>
              A secure temporary password will be automatically generated and sent to
              the user's email. The user can change it after their first login.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={actions.goToList}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? "Updating User..." : "Creating User..."}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {isEditing ? "Update User" : "Create User"}
              </>
            )}
          </Button>
        </div>
      </form>
    </FormProvider>
  )
}
