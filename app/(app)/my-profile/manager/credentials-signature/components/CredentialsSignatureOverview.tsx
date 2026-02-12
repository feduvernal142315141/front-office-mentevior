"use client"

import { useState, useCallback, useEffect } from "react"
import { toast } from "sonner"
import { useUserById } from "@/lib/modules/users/hooks/use-user-by-id"
import { useUserCredentials } from "@/lib/modules/user-credentials/hooks/use-user-credentials"
import { useSignature } from "@/lib/modules/signature/hooks/use-signature"
import { ELIGIBLE_ROLES_FOR_CREDENTIALS } from "@/lib/constants/credentials.constants"
import type {
  UserCredential,
  CreateUserCredentialDto,
  UpdateUserCredentialDto,
} from "@/lib/types/user-credentials.types"
import { AlertsBanner } from "./AlertsBanner"
import { CredentialsSection } from "./CredentialsSection"
import { SignatureSection } from "./SignatureSection"
import { SignatureEditorModal } from "./SignatureEditorModal"
import { SignatureScrollIndicator } from "./SignatureScrollIndicator"
import { ConfirmationModal } from "@/components/custom/ConfirmationModal"
import { CredentialsSignatureSkeleton } from "./CredentialsSignatureSkeleton"

interface CredentialsSignatureOverviewProps {
  isActive: boolean
  memberUserId: string | null
}

export function CredentialsSignatureOverview({
  isActive,
  memberUserId,
}: CredentialsSignatureOverviewProps) {
  const [hasLoaded, setHasLoaded] = useState(false)
  const { user: fullUser } = useUserById(isActive ? memberUserId : null)

  const {
    credentials,
    credentialTypes,
    isLoadingTypes,
    isLoading,
    expiredCredentials,
    expiringSoonCredentials,
    create: createCredential,
    update: updateCredential,
    isCreating,
    isUpdating,
    getComputedStatus,
  } = useUserCredentials(memberUserId, isActive)

  const {
    signature,
    hasSignature,
    save: saveSignature,
    remove: removeSignature,
    isLoading: isLoadingSignature,
    isSaving: isSavingSignature,
  } = useSignature(memberUserId, isActive)

  const [editingCredential, setEditingCredential] = useState<UserCredential | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSignatureEditorOpen, setIsSignatureEditorOpen] = useState(false)
  const [isDeleteSignatureModalOpen, setIsDeleteSignatureModalOpen] = useState(false)

  const roleName = fullUser?.role?.name || "Unknown"
  const canManageCredentials = ELIGIBLE_ROLES_FOR_CREDENTIALS.includes(
    roleName as (typeof ELIGIBLE_ROLES_FOR_CREDENTIALS)[number]
  )
  const isSignatureBlocked = expiredCredentials.length > 0

  const handleSaveCredential = useCallback(
    async (data: CreateUserCredentialDto) => {
      await createCredential(data)
      setIsFormOpen(false)
    },
    [createCredential]
  )

  const handleUpdateCredential = useCallback(
    async (id: string, data: UpdateUserCredentialDto) => {
      await updateCredential(id, data)
      setEditingCredential(null)
      setIsFormOpen(false)
    },
    [updateCredential]
  )

  const handleCancelEdit = useCallback(() => {
    setEditingCredential(null)
    setIsFormOpen(false)
  }, [])

  const handleEditCredential = useCallback((credential: UserCredential) => {
    setEditingCredential(credential)
    setIsFormOpen(true)
  }, [])

  const handleAddCredential = useCallback(() => {
    setEditingCredential(null)
    setIsFormOpen(true)
  }, [])

  const handleOpenSignatureEditor = useCallback(() => {
    if (isSignatureBlocked) {
      toast.error("This user cannot sign documents because at least one credential is expired.")
      return
    }
    setIsSignatureEditorOpen(true)
  }, [isSignatureBlocked])

  const handleSaveSignature = useCallback(
    async (imageBase64: string) => {
      await saveSignature(imageBase64)
      setIsSignatureEditorOpen(false)
    },
    [saveSignature]
  )

  const handleDeleteSignature = useCallback(() => {
    if (!hasSignature) return
    setIsDeleteSignatureModalOpen(true)
  }, [hasSignature])

  const handleConfirmDeleteSignature = useCallback(async () => {
    await removeSignature()
    setIsDeleteSignatureModalOpen(false)
  }, [removeSignature])

  useEffect(() => {
    if (!isActive) {
      setHasLoaded(false)
      return
    }

    if (!memberUserId) {
      setHasLoaded(false)
      return
    }

    if (!isLoading && !isLoadingTypes && !isLoadingSignature) {
      setHasLoaded(true)
    }
  }, [isActive, memberUserId, isLoading, isLoadingTypes, isLoadingSignature])

  if (isActive && !hasLoaded && (isLoading || isLoadingTypes || isLoadingSignature)) {
    return <CredentialsSignatureSkeleton />
  }

  return (
    <div className="space-y-6">
      <AlertsBanner
        expiredCount={expiredCredentials.length}
        expiringSoonCount={expiringSoonCredentials.length}
        hasSignature={hasSignature}
        isLoadingSignature={isLoadingSignature}
      />

      <CredentialsSection
        roleName={roleName}
        canManageCredentials={canManageCredentials}
        credentials={credentials}
        credentialTypes={credentialTypes}
        isLoadingTypes={isLoadingTypes}
        editingCredential={editingCredential}
        isFormOpen={isFormOpen}
        onSave={handleSaveCredential}
        onUpdate={handleUpdateCredential}
        onCancelEdit={handleCancelEdit}
        onEdit={handleEditCredential}
        onAdd={handleAddCredential}
        isSaving={isCreating || isUpdating}
        getComputedStatus={getComputedStatus}
        signatureSection={
          <SignatureSection
            signature={signature}
            blocked={isSignatureBlocked}
            isLoadingSignature={isLoadingSignature}
            onOpenEditor={handleOpenSignatureEditor}
            onDelete={handleDeleteSignature}
          />
        }
      />

      <SignatureEditorModal
        open={isSignatureEditorOpen}
        onOpenChange={setIsSignatureEditorOpen}
        onSave={handleSaveSignature}
        disabled={isSignatureBlocked}
        isSaving={isSavingSignature}
      />

      <ConfirmationModal
        open={isDeleteSignatureModalOpen}
        onOpenChange={setIsDeleteSignatureModalOpen}
        title="Delete Signature"
        description="Are you sure you want to delete your current signature? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDeleteSignature}
        variant="danger"
      />      
    </div>
  )
}
