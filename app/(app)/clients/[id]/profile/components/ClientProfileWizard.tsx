"use client"

import { useState, useMemo, useCallback, useRef, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  User,
  MapPin,
  Users,
  Pill,
  Activity,
  Shield,
  FileCheck,
  UserCog,
  FileText
} from "lucide-react"
import { WizardStepper } from "@/components/custom/WizardStepper"
import { WizardHeader } from "@/components/custom/WizardHeader"
import { WizardFooter } from "@/components/custom/WizardFooter"
import { ConfirmationModal } from "@/components/custom/ConfirmationModal"
import { useClientById } from "@/lib/modules/clients/hooks/use-client-by-id"
import { useCaregiversByClient } from "@/lib/modules/caregivers/hooks/use-caregivers-by-client"
import { useClientInsurancesByClient } from "@/lib/modules/client-insurances/hooks/use-client-insurances-by-client"
import { useMedicationsByClient } from "@/lib/modules/medications/hooks/use-medications-by-client"
import { useDiagnosesByClient } from "@/lib/modules/diagnoses/hooks/use-diagnoses-by-client"
import { useProvidersByClient } from "@/lib/modules/providers/hooks/use-providers-by-client"
import { useClientAddresses } from "@/lib/modules/client-addresses/hooks/use-client-addresses"
import { useClientDocuments } from "@/lib/modules/client-documents/hooks/use-client-documents"
import { usePriorAuthorizationsByClient } from "@/lib/modules/prior-authorizations/hooks/use-prior-authorizations-by-client"
import type { StepComponentProps, StepConfig, StepStatus } from "@/lib/types/wizard.types"
import { Step1PersonalInfo } from "./steps/Step1PersonalInfo"
import { Step2Addresses } from "./steps/Step2Addresses"
import { Step3Caregivers } from "./steps/Step3Caregivers"
import { Step4Medications } from "./steps/Step4Medications"
import { Step6Diagnoses } from "./steps/Step6Diagnoses"
import { StepInsurances } from "./steps/StepInsurances"
import { Step10RequiredDocuments } from "./steps/Step10RequiredDocuments"
import { Step9Providers } from "./steps/Step9Providers"
import { StepPlaceholder } from "./steps/StepPlaceholder"
import { StepPriorAuthorizations } from "./steps/prior-authorizations"

interface ClientProfileWizardProps {
  clientId: string
  isCreateMode?: boolean
}

function isUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}

type SubmitIntent = "close" | "continue" | "navigate" | null

export function ClientProfileWizard({ clientId, isCreateMode = false }: ClientProfileWizardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isStepValid, setIsStepValid] = useState(false)
  const [stepStatuses, setStepStatuses] = useState<Record<string, StepStatus>>({
    personalInfo: "PENDING",
    addresses: "PENDING",
    caregivers: "PENDING",
    medications: "PENDING",
    diagnoses: "PENDING",
    insurances: "PENDING",
    priorAuth: "PENDING",
    providers: "PENDING",
    documents: "PENDING",
  })

  const stepSubmitRef = useRef<(() => Promise<void>) | null>(null)
  const stepResetRef = useRef<(() => void) | null>(null)
  const onSaveSuccessRef = useRef<(data: any) => void>(() => {})
  const onValidationErrorRef = useRef<(errors: Record<string, string>) => void>(() => {})

  const stableOnSaveSuccess = useCallback((data: any) => {
    onSaveSuccessRef.current(data)
  }, [])

  const stableOnValidationError = useCallback((errors: Record<string, string>) => {
    onValidationErrorRef.current(errors)
  }, [])
  const didSetInitialStepRef = useRef(false)
  const [createdClientId, setCreatedClientId] = useState<string | null>(null)
  const [serverProgress, setServerProgress] = useState<number | null>(null)
  const [isStepDirty, setIsStepDirty] = useState(false)
  const [showUnsavedModal, setShowUnsavedModal] = useState(false)
  const pendingNavigationRef = useRef<(() => void) | null>(null)
  const pendingNavigationAfterSaveRef = useRef<(() => void) | null>(null)
  const isSubmittingRef = useRef(false)
  const submitIntentRef = useRef<SubmitIntent>(null)
  const hasCreatedClientRef = useRef(false)
  const isInCreateMode = isCreateMode && !createdClientId

  const navigateToClientsTable = useCallback(() => {
    if (isCreateMode) {
      window.location.href = "/clients"
    } else {
      router.push("/clients")
    }
  }, [isCreateMode, router])

  const resolvedClientId = useMemo(() => {
    if (createdClientId) {
      return createdClientId
    }

    if (!isInCreateMode && clientId !== "new") {
      return isUUID(clientId) ? clientId : null
    }

    if (!pathname) {
      return null
    }

    const segments = pathname.split("/")
    const clientsIndex = segments.findIndex((segment) => segment === "clients")
    const possibleClientId = clientsIndex >= 0 ? segments[clientsIndex + 1] : null

    if (!possibleClientId || !isUUID(possibleClientId)) {
      return null
    }

    return possibleClientId
  }, [clientId, createdClientId, isInCreateMode, pathname])

  const { client, isLoading, refetch } = useClientById(resolvedClientId)

  const { caregivers } = useCaregiversByClient(resolvedClientId)
  const { addresses } = useClientAddresses(resolvedClientId)
  const { insurances } = useClientInsurancesByClient(resolvedClientId)
  const { medications } = useMedicationsByClient(resolvedClientId)
  const { diagnoses } = useDiagnosesByClient(resolvedClientId)
  const { providers } = useProvidersByClient(resolvedClientId)
  const { rows: clientDocumentRows, isLoading: isDocumentsLoading } = useClientDocuments(resolvedClientId, !!resolvedClientId)
  const { pas } = usePriorAuthorizationsByClient(resolvedClientId)

  const checkPersonalInfoComplete = useCallback((clientData: any) => {
    if (!clientData) return false
    
    const requiredFields = [
      clientData.firstName,
      clientData.lastName,
      clientData.phoneNumber,
      clientData.email,
      clientData.genderId,
      clientData.ssn,
      clientData.brithDate,
      clientData.chartId,
      clientData.languages?.length > 0,
    ]
    
    return requiredFields.every(field => !!field)
  }, [])

  const resolveInitialStepStatuses = useCallback((clientData: NonNullable<typeof client>): {
    personalInfo: StepStatus
    documents: StepStatus
  } => {
    const personalInfoComplete = checkPersonalInfoComplete(clientData)

    return {
      personalInfo: personalInfoComplete ? "COMPLETE" : "PENDING",
      documents: "PENDING",
    }
  }, [checkPersonalInfoComplete])

  useEffect(() => {
    if (client) {
      const initialStatuses = resolveInitialStepStatuses(client)

      setStepStatuses(prev => ({
        ...prev,
        personalInfo: initialStatuses.personalInfo,
      }))
    }
  }, [client, resolveInitialStepStatuses])

  useEffect(() => {
    if (!resolvedClientId) return

    setStepStatuses((prev) => ({
      ...prev,
      addresses: addresses.length > 0 ? "COMPLETE" : "PENDING",
      caregivers: caregivers.length > 0 ? "COMPLETE" : "PENDING",
      insurances: insurances.length > 0 ? "COMPLETE" : "PENDING",
      medications: medications.length > 0 ? "COMPLETE" : "PENDING",
      diagnoses: diagnoses.length > 0 ? "COMPLETE" : "PENDING",
      providers: providers.length > 0 ? "COMPLETE" : "PENDING",
      priorAuth: pas.length > 0 ? "COMPLETE" : "PENDING",
    }))
  }, [resolvedClientId, addresses.length, caregivers.length, insurances.length, medications.length, diagnoses.length, providers.length, pas.length])

  useEffect(() => {
    if (!resolvedClientId || isDocumentsLoading) return

    const allDocumentsUploaded =
      clientDocumentRows.length > 0 &&
      clientDocumentRows.every((doc) => doc.clientDocumentId !== null)

    setStepStatuses((prev) => ({
      ...prev,
      documents: allDocumentsUploaded ? "COMPLETE" : "PENDING",
    }))
  }, [resolvedClientId, isDocumentsLoading, clientDocumentRows])

  const steps: StepConfig[] = useMemo(() => [
    {
      id: "personalInfo",
      title: "Personal Information",
      icon: <User className="w-4 h-4" />,
      status: stepStatuses.personalInfo,
      isLocked: false,
      component: Step1PersonalInfo,
    },
    {
      id: "addresses",
      title: "Addresses",
      icon: <MapPin className="w-4 h-4" />,
      status: stepStatuses.addresses,
      isLocked: false,
      component: Step2Addresses,
    },
    {
      id: "caregivers",
      title: "Caregivers",
      icon: <Users className="w-4 h-4" />,
      status: stepStatuses.caregivers,
      isLocked: false,
      component: Step3Caregivers,
    },
    {
      id: "medications",
      title: "Medications",
      icon: <Pill className="w-4 h-4" />,
      status: stepStatuses.medications,
      isLocked: false,
      component: Step4Medications,
    },
    {
      id: "diagnoses",
      title: "Diagnoses",
      icon: <Activity className="w-4 h-4" />,
      status: stepStatuses.diagnoses,
      isLocked: false,
      component: Step6Diagnoses,
    },
    {
      id: "insurances",
      title: "Insurances",
      icon: <Shield className="w-4 h-4" />,
      status: stepStatuses.insurances,
      isLocked: false,
      component: StepInsurances,
    },
    {
      id: "priorAuth",
      title: "Prior Authorizations",
      icon: <FileCheck className="w-4 h-4" />,
      status: stepStatuses.priorAuth,
      isLocked: false,
      component: StepPriorAuthorizations,
    },
    {
      id: "providers",
      title: "Providers",
      icon: <UserCog className="w-4 h-4" />,
      status: stepStatuses.providers,
      isLocked: false,
      component: Step9Providers,
    },
    {
      id: "documents",
      title: "Required Documents",
      icon: <FileText className="w-4 h-4" />,
      status: stepStatuses.documents,
      isLocked: false,
      component: Step10RequiredDocuments,
    },
  ], [stepStatuses])

  useEffect(() => {
    if (didSetInitialStepRef.current) return
    if (isInCreateMode || !client) return

    const initialStatuses = resolveInitialStepStatuses(client)
    const resolvedStatuses = steps.map((step) =>
      step.id === "personalInfo"
        ? initialStatuses.personalInfo
        : step.id === "documents"
          ? initialStatuses.documents
        : step.status
    )
    const firstIncompleteIndex = resolvedStatuses.findIndex((status) => status !== "COMPLETE")
    if (firstIncompleteIndex >= 0) {
      setActiveStepIndex(firstIncompleteIndex)
    }
    didSetInitialStepRef.current = true
  }, [steps, isInCreateMode, client, resolveInitialStepStatuses])

  const EXCLUDED_FROM_COMPLETION = ["medications"]

  const localCompletionPercentage = useMemo(() => {
    const countableEntries = Object.entries(stepStatuses).filter(
      ([key]) => !EXCLUDED_FROM_COMPLETION.includes(key)
    )
    const completedCount = countableEntries.filter(([, status]) => status === "COMPLETE").length
    return Math.round((completedCount / countableEntries.length) * 100)
  }, [stepStatuses])

  const completionPercentage = useMemo(() => {
    if (typeof serverProgress === "number") {
      return Math.min(100, Math.max(0, serverProgress))
    }
    if (!isInCreateMode && typeof client?.progress === "number") {
      return Math.min(100, Math.max(0, client.progress))
    }
    return localCompletionPercentage
  }, [serverProgress, client?.progress, isInCreateMode, localCompletionPercentage])

  const profileStatus = useMemo(() => {
    if (completionPercentage === 100) return "complete"
    return "incomplete"
  }, [completionPercentage])

  const guardNavigation = useCallback((action: () => void) => {
    if (isStepDirty) {
      pendingNavigationRef.current = action
      setShowUnsavedModal(true)
    } else {
      action()
    }
  }, [isStepDirty])

  const handleUnsavedDiscard = useCallback(() => {
    const navigate = pendingNavigationRef.current
    pendingNavigationRef.current = null
    setIsStepDirty(false)
    stepResetRef.current?.()
    navigate?.()
  }, [])

  const handleUnsavedCancel = useCallback(() => {
    setShowUnsavedModal(false)
    handleUnsavedDiscard()
  }, [handleUnsavedDiscard])

  const handleUnsavedSave = useCallback(async () => {
    if (!stepSubmitRef.current || !pendingNavigationRef.current || isSubmittingRef.current) {
      setShowUnsavedModal(false)
      return
    }

    pendingNavigationAfterSaveRef.current = pendingNavigationRef.current
    pendingNavigationRef.current = null
    setShowUnsavedModal(false)
    isSubmittingRef.current = true
    submitIntentRef.current = "navigate"
    setIsSubmitting(true)
    await stepSubmitRef.current()
  }, [])

  const handleStepClick = useCallback((index: number) => {
    const targetStep = steps[index]
    if (targetStep.isLocked) return

    guardNavigation(() => {
      if (!isInCreateMode && targetStep.id === "personalInfo") {
        void refetch()
      }
      setActiveStepIndex(index)
    })
  }, [steps, isInCreateMode, refetch, guardNavigation])

  const handleCancel = useCallback(() => {
    navigateToClientsTable()
  }, [navigateToClientsTable])

  const handleSave = useCallback(async () => {
    if (!stepSubmitRef.current || isSubmittingRef.current || (isInCreateMode && hasCreatedClientRef.current)) {
      return
    }

    isSubmittingRef.current = true
    submitIntentRef.current = "close"
    setIsSubmitting(true)
    await stepSubmitRef.current()
  }, [isInCreateMode])

  const handleSaveAndContinue = useCallback(async () => {
    if (!stepSubmitRef.current || isSubmittingRef.current || (isInCreateMode && hasCreatedClientRef.current)) {
      return
    }

    isSubmittingRef.current = true
    submitIntentRef.current = "continue"
    setIsSubmitting(true)
    await stepSubmitRef.current()
  }, [isInCreateMode])

  const handleSaveSuccess = useCallback((data: any) => {
    const currentStepId = steps[activeStepIndex].id
    const submitIntent = submitIntentRef.current
    setIsStepDirty(false)

    if (typeof data?.progress === "number") {
      setServerProgress(data.progress)
    }

    if (isInCreateMode && data.clientId && submitIntent !== "close") {
      hasCreatedClientRef.current = true
      setCreatedClientId(data.clientId)
    }

    if (currentStepId === "personalInfo" && !isInCreateMode) {
      void refetch()
    }

    if (currentStepId === "documents") {
      isSubmittingRef.current = false
      submitIntentRef.current = null
      setIsSubmitting(false)
      navigateToClientsTable()
      return
    }

    if (pendingNavigationAfterSaveRef.current) {
      const navigate = pendingNavigationAfterSaveRef.current
      pendingNavigationAfterSaveRef.current = null
      isSubmittingRef.current = false
      submitIntentRef.current = null
      setIsSubmitting(false)
      navigate()
      return
    }

    if (submitIntent === "continue") {
      if (isInCreateMode && data.clientId) {
        isSubmittingRef.current = false
        submitIntentRef.current = null
        setIsSubmitting(false)
        router.replace(`/clients/${data.clientId}/profile`)
        return
      }

      if (activeStepIndex < steps.length - 1) {
        setActiveStepIndex(activeStepIndex + 1)
      }
      isSubmittingRef.current = false
      submitIntentRef.current = null
      setIsSubmitting(false)
    } else {
      isSubmittingRef.current = false
      submitIntentRef.current = null
      setIsSubmitting(false)
      navigateToClientsTable()
    }
    
  }, [activeStepIndex, steps, isInCreateMode, refetch, navigateToClientsTable])

  const handleDocumentsAlertChange = useCallback((count: number) => {
    setStepStatuses((prev) => ({
      ...prev,
      documents: count === 0 ? "COMPLETE" : "PENDING",
    }))
  }, [])

  const handleStepStatusChange = useCallback((stepId: string, status: StepStatus) => {
    setStepStatuses((prev) => {
      if (prev[stepId] === status) return prev
      return {
        ...prev,
        [stepId]: status,
      }
    })
  }, [])

  const handleValidationError = useCallback((errors: Record<string, string>) => {
    const currentStepId = steps[activeStepIndex].id

    setStepStatuses(prev => ({
      ...prev,
      [currentStepId]: "ERROR"
    }))

    if (pendingNavigationAfterSaveRef.current) {
      pendingNavigationAfterSaveRef.current = null
      setShowUnsavedModal(false)
      setActiveStepIndex(0)
    }
    
    isSubmittingRef.current = false
    submitIntentRef.current = null
    setIsSubmitting(false)
  }, [activeStepIndex, steps])

  onSaveSuccessRef.current = handleSaveSuccess
  onValidationErrorRef.current = handleValidationError

  if (!isInCreateMode && (isLoading || !client)) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <div className="animate-pulse text-slate-500">Loading client profile...</div>
      </div>
    )
  }

  const ActiveStepComponent = steps[activeStepIndex].component
  const canContinue = isStepValid && !isSubmitting

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col"
    >
      <WizardHeader
        clientName={isInCreateMode ? "New Client" : `${client?.firstName || ""} ${client?.lastName || ""}`}
        currentStep={activeStepIndex + 1}
        totalSteps={steps.length}
        completionPercentage={completionPercentage}
        profileStatus={profileStatus}
      />

      <div className="flex flex-1">
        <WizardStepper
          steps={steps}
          activeStepIndex={activeStepIndex}
          onStepClick={handleStepClick}
        />

        <div className="flex-1 overflow-y-auto custom-scrollbar pb-36">
          <div className="max-w-6xl mx-auto py-8">
            <ActiveStepComponent
              clientId={createdClientId ?? clientId}
              client={client}
              isCreateMode={isInCreateMode}
              onSaveSuccess={stableOnSaveSuccess}
              onValidationError={stableOnValidationError}
              onProgressUpdate={setServerProgress}
              onDocumentsAlertChange={handleDocumentsAlertChange}
              registerSubmit={(submitFn: () => Promise<void>) => {
                stepSubmitRef.current = submitFn
              }}
              registerReset={(resetFn: () => void) => {
                stepResetRef.current = resetFn
              }}
              registerValidation={(isValid: boolean) => {
                setIsStepValid(isValid)
              }}
              onDirtyChange={setIsStepDirty}
              onStepStatusChange={handleStepStatusChange}
            />
          </div>
        </div>
      </div>

      <WizardFooter
        isLastStep={activeStepIndex === steps.length - 1}
        isSubmitting={isSubmitting}
        canContinue={canContinue}
        onCancel={handleCancel}
        onSave={handleSave}
        onSaveAndContinue={handleSaveAndContinue}
      />

      <ConfirmationModal
        open={showUnsavedModal}
        onOpenChange={(open) => {
          setShowUnsavedModal(open)
        }}
        title="Unsaved Changes"
        description="You have unsaved changes. Save them before leaving or discard to continue without saving."
        confirmText="Save"
        cancelText="Cancel"
        variant="warning"
        isLoading={isSubmitting}
        onCancel={handleUnsavedCancel}
        onConfirm={handleUnsavedSave}
      />
    </div>
  )
}
