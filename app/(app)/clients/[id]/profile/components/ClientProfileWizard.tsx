"use client"

import { useState, useMemo, useCallback, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  User, 
  MapPin, 
  Users, 
  Pill, 
  Stethoscope, 
  Activity, 
  Shield, 
  FileCheck, 
  UserCog,
  FileText
} from "lucide-react"
import { WizardStepper } from "@/components/custom/WizardStepper"
import { WizardHeader } from "@/components/custom/WizardHeader"
import { WizardFooter } from "@/components/custom/WizardFooter"
import { useClientById } from "@/lib/modules/clients/hooks/use-client-by-id"
import type { StepComponentProps, StepConfig, StepStatus } from "@/lib/types/wizard.types"
import { Step1PersonalInfo } from "./steps/Step1PersonalInfo"
import { Step2Addresses } from "./steps/Step2Addresses"
import { Step3Caregivers } from "./steps/Step3Caregivers"
import { Step4Medications } from "./steps/Step4Medications"
import { Step5Physicians } from "./steps/Step5Physicians"
import { Step6Diagnoses } from "./steps/Step6Diagnoses"
import { Step10RequiredDocuments } from "./steps/Step10RequiredDocuments"
import { Step9Providers } from "./steps/Step9Providers"
import { StepPlaceholder } from "./steps/StepPlaceholder"

interface ClientProfileWizardProps {
  clientId: string
  isCreateMode?: boolean
}

export function ClientProfileWizard({ clientId, isCreateMode = false }: ClientProfileWizardProps) {
  const router = useRouter()
  const { client, isLoading, refetch } = useClientById(isCreateMode ? null : clientId)
  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isStepValid, setIsStepValid] = useState(false)
  const [stepStatuses, setStepStatuses] = useState<Record<string, StepStatus>>({
    personalInfo: "PENDING",
    addresses: "PENDING",
    caregivers: "PENDING",
    medications: "PENDING",
    physicians: "PENDING",
    diagnoses: "PENDING",
    insurances: "PENDING",
    priorAuth: "PENDING",
    providers: "PENDING",
    documents: "PENDING",
  })

  const stepSubmitRef = useRef<(() => Promise<void>) | null>(null)
  const shouldContinueRef = useRef<boolean>(true)
  const didSetInitialStepRef = useRef(false)

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
    const normalizedProgress = Math.min(100, Math.max(0, clientData.progress ?? 0))
    const personalInfoComplete = normalizedProgress >= 10 || checkPersonalInfoComplete(clientData)
    const documentsComplete = normalizedProgress >= 20

    return {
      personalInfo: personalInfoComplete ? "COMPLETE" : "PENDING",
      documents: documentsComplete ? "COMPLETE" : "PENDING",
    }
  }, [checkPersonalInfoComplete])

  useEffect(() => {
    if (client) {
      const initialStatuses = resolveInitialStepStatuses(client)

      setStepStatuses(prev => ({
        ...prev,
        personalInfo: initialStatuses.personalInfo,
        documents: initialStatuses.documents,
      }))
    }
  }, [client, resolveInitialStepStatuses])

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
      id: "physicians",
      title: "Physicians",
      icon: <Stethoscope className="w-4 h-4" />,
      status: stepStatuses.physicians,
      isLocked: false,
      component: Step5Physicians,
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
      component: (props: StepComponentProps) => <StepPlaceholder icon={Shield} title="Insurances" scrumId="SCRUM-128" {...props} />,
    },
    {
      id: "priorAuth",
      title: "Prior Authorizations",
      icon: <FileCheck className="w-4 h-4" />,
      status: stepStatuses.priorAuth,
      isLocked: false,
      component: (props: StepComponentProps) => <StepPlaceholder icon={FileCheck} title="Prior Authorizations" scrumId="SCRUM-48" {...props} />,
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
    if (isCreateMode || !client) return

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
  }, [steps, isCreateMode, client, resolveInitialStepStatuses])

  const completionPercentage = useMemo(() => {
    const completedCount = Object.values(stepStatuses).filter(status => status === "COMPLETE").length
    return Math.round((completedCount / Object.keys(stepStatuses).length) * 100)
  }, [stepStatuses])

  const profileStatus = useMemo(() => {
    if (completionPercentage === 100) return "complete"
    return "incomplete"
  }, [completionPercentage])

  const handleStepClick = useCallback((index: number) => {
    const targetStep = steps[index]
    if (!targetStep.isLocked) {
      if (!isCreateMode && targetStep.id === "personalInfo") {
        void refetch()
      }
      setActiveStepIndex(index)
    }
  }, [steps, isCreateMode, refetch])

  const handleBack = useCallback(() => {
    if (activeStepIndex > 0) {
      setActiveStepIndex(activeStepIndex - 1)
    } else {
      router.push("/clients")
    }
  }, [activeStepIndex, router])

  const handleSave = useCallback(async () => {
    if (stepSubmitRef.current) {
      shouldContinueRef.current = false
      setIsSubmitting(true)
      await stepSubmitRef.current()
    }
  }, [])

  const handleSaveAndContinue = useCallback(async () => {
    if (stepSubmitRef.current) {
      shouldContinueRef.current = true
      setIsSubmitting(true)
      await stepSubmitRef.current()
    }
  }, [])

  const handleSaveSuccess = useCallback((data: any) => {
    const currentStepId = steps[activeStepIndex].id
    
    if (isCreateMode && data.clientId) {
      window.history.replaceState(null, '', `/clients/${data.clientId}/profile`)
    }
    
    setStepStatuses(prev => ({
      ...prev,
      [currentStepId]: "COMPLETE"
    }))

    if (currentStepId === "documents") {
      setIsSubmitting(false)
      router.push("/clients")
      return
    }

    if (shouldContinueRef.current) {
      if (activeStepIndex < steps.length - 1) {
        setActiveStepIndex(activeStepIndex + 1)
      }
      setIsSubmitting(false)
    } else {
      router.push("/clients")
    }
    
  }, [activeStepIndex, steps, isCreateMode, router])

  const handleDocumentsAlertChange = useCallback((count: number) => {
    setStepStatuses((prev) => ({
      ...prev,
      documents: count === 0 ? "COMPLETE" : "PENDING",
    }))
  }, [])

  const handleValidationError = useCallback((errors: Record<string, string>) => {
    const currentStepId = steps[activeStepIndex].id
    const errorCount = Object.keys(errors).length

    setStepStatuses(prev => ({
      ...prev,
      [currentStepId]: "ERROR"
    }))
    
    setIsSubmitting(false)
  }, [activeStepIndex, steps])

  if (!isCreateMode && (isLoading || !client)) {
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
        clientName={isCreateMode ? "New Client" : `${client?.firstName || ""} ${client?.lastName || ""}`}
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
              clientId={clientId}
              client={client}
              isCreateMode={isCreateMode}
              onSaveSuccess={handleSaveSuccess}
              onValidationError={handleValidationError}
              onDocumentsAlertChange={handleDocumentsAlertChange}
              registerSubmit={(submitFn: () => Promise<void>) => {
                stepSubmitRef.current = submitFn
              }}
              registerValidation={(isValid: boolean) => {
                setIsStepValid(isValid)
              }}
            />
          </div>
        </div>
      </div>

      <WizardFooter
        isFirstStep={activeStepIndex === 0}
        isLastStep={activeStepIndex === steps.length - 1}
        isSubmitting={isSubmitting}
        canContinue={canContinue}
        onBack={handleBack}
        onSave={handleSave}
        onSaveAndContinue={handleSaveAndContinue}
      />
    </div>
  )
}
