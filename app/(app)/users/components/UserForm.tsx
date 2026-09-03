"use client"

import { useRef, useState } from "react"
import { FormProvider } from "react-hook-form"
import { useUserForm } from "../hooks/useUserForm"
import { UserFormSkeleton } from "./UserFormSkeleton"
import { UserFormFields } from "./UserFormFields"
import { ConfirmationModal } from "@/components/custom/ConfirmationModal"
import { useAuth } from "@/lib/hooks/use-auth"
import { useUserById } from "@/lib/modules/users/hooks/use-user-by-id"
import type { UserFormValues } from "@/lib/schemas/user-form.schema"

interface UserFormProps {
  userId?: string | null
}

function emailsDiffer(next: string, saved?: string) {
  const a = next.trim().toLowerCase()
  const b = (saved ?? "").trim().toLowerCase()
  return b.length > 0 && a !== b
}

export function UserForm({ userId = null }: UserFormProps) {
  const { user: authUser } = useAuth()
  // Fetch full user data from API (like Topbar does) to get role as object with .name
  const { user: fullCurrentUser } = useUserById(authUser?.id || null)

  const {
    form,
    isEditing,
    roles,
    isLoadingRoles,
    isLoadingUser,
    onSubmit,
    isSubmitting,
    actions,
    user,
    memberUserTypes,
    isLoadingMemberUserTypes,
    billingCodeOptions,
    isLoadingBillingCodes,
  } = useUserForm({ userId })

  const [emailConfirmOpen, setEmailConfirmOpen] = useState(false)
  const pendingValuesRef = useRef<UserFormValues | null>(null)

  if (isEditing && isLoadingUser) {
    return <UserFormSkeleton />
  }

  // Merge auth user (has id, email, permissions) with full user (has role as object)
  const currentUser = fullCurrentUser
    ? { ...authUser, id: authUser?.id, role: fullCurrentUser.role }
    : authUser

  const handleValidSubmit = (data: UserFormValues) => {
    if (isEditing && emailsDiffer(data.email, user?.email)) {
      pendingValuesRef.current = data
      setEmailConfirmOpen(true)
      return
    }
    void onSubmit(data)
  }

  const finishEmailChange = (resendEmail: boolean) => {
    const data = pendingValuesRef.current
    if (!data) return
    void onSubmit({ ...data, resendEmail })
  }

  const pendingEmail = pendingValuesRef.current?.email?.trim() ?? ""
  const savedEmail = (user?.email ?? "").trim()

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(handleValidSubmit)} noValidate>
        <UserFormFields
          isEditing={isEditing}
          roles={roles}
          isLoadingRoles={isLoadingRoles}
          isSubmitting={isSubmitting}
          onCancel={actions.goToList}
          currentUser={currentUser}
          editingUser={user}
          memberUserTypeOptions={memberUserTypes}
          isLoadingMemberUserTypes={isLoadingMemberUserTypes}
          billingCodeOptions={billingCodeOptions}
          isLoadingBillingCodes={isLoadingBillingCodes}
        />
      </form>

      <ConfirmationModal
        open={emailConfirmOpen}
        onOpenChange={(open) => {
          if (isSubmitting) return
          setEmailConfirmOpen(open)
          if (!open) pendingValuesRef.current = null
        }}
        variant="warning"
        title="Send a password link?"
        description={
          savedEmail && pendingEmail
            ? `${savedEmail} will no longer work as a username. We'll email a password link to ${pendingEmail}. The link expires in 15 minutes.`
            : "We'll email a password link to the new address. The link expires in 15 minutes."
        }
        confirmText="Send link and update"
        discardText="Update without sending"
        cancelText="Cancel"
        isLoading={isSubmitting}
        onConfirm={() => finishEmailChange(true)}
        onDiscard={() => finishEmailChange(false)}
      />
    </FormProvider>
  )
}
