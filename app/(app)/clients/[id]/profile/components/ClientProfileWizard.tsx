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
import type { StepConfig, StepStatus } from "@/lib/types/wizard.types"
import { Step1PersonalInfo } from "./steps/Step1PersonalInfo"
import { Step2Addresses } from "./steps/Step2Addresses"
import { Step10RequiredDocuments } from "./steps/Step10RequiredDocuments"
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

  useEffect(() => {
    if (client) {
      const isComplete = checkPersonalInfoComplete(client)
      
      setStepStatuses(prev => ({
        ...prev,
        personalInfo: isComplete ? "COMPLETE" : "PENDING"
      }))
    }
  }, [client, checkPersonalInfoComplete])

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
      component: () => <StepPlaceholder icon={Users} title="Caregivers" scrumId="SCRUM-125" />,
    },
    {
      id: "medications",
      title: "Medications",
      icon: <Pill className="w-4 h-4" />,
      status: stepStatuses.medications,
      isLocked: false,
      component: () => <StepPlaceholder icon={Pill} title="Medications" scrumId="SCRUM-132" />,
    },
    {
      id: "physicians",
      title: "Physicians",
      icon: <Stethoscope className="w-4 h-4" />,
      status: stepStatuses.physicians,
      isLocked: false,
      component: () => <StepPlaceholder icon={Stethoscope} title="Physicians" scrumId="SCRUM-126" />,
    },
    {
      id: "diagnoses",
      title: "Diagnoses",
      icon: <Activity className="w-4 h-4" />,
      status: stepStatuses.diagnoses,
      isLocked: false,
      component: () => <StepPlaceholder icon={Activity} title="Diagnoses" scrumId="SCRUM-127" />,
    },
    {
      id: "insurances",
      title: "Insurances",
      icon: <Shield className="w-4 h-4" />,
      status: stepStatuses.insurances,
      isLocked: false,
      component: () => <StepPlaceholder icon={Shield} title="Insurances" scrumId="SCRUM-128" />,
    },
    {
      id: "priorAuth",
      title: "Prior Authorizations",
      icon: <FileCheck className="w-4 h-4" />,
      status: stepStatuses.priorAuth,
      isLocked: false,
      component: () => <StepPlaceholder icon={FileCheck} title="Prior Authorizations" scrumId="SCRUM-48" />,
    },
    {
      id: "providers",
      title: "Providers",
      icon: <UserCog className="w-4 h-4" />,
      status: stepStatuses.providers,
      isLocked: false,
      component: () => <StepPlaceholder icon={UserCog} title="Providers" scrumId="SCRUM-129" />,
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

  const completionPercentage = useMemo(() => {
    const completedCount = Object.values(stepStatuses).filter(status => status === "COMPLETE").length
    return Math.round((completedCount / Object.keys(stepStatuses).length) * 100)
  }, [stepStatuses])

  const profileStatus = useMemo(() => {
    if (completionPercentage === 100) return "ready"
    if (completionPercentage > 0) return "complete"
    return "incomplete"
  }, [completionPercentage])

  const handleStepClick = useCallback((index: number) => {
    const targetStep = steps[index]
    if (!targetStep.isLocked) {
      setActiveStepIndex(index)
    }
  }, [steps])

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

    // Check if should continue to next step or redirect
    if (shouldContinueRef.current) {
      // Save & Continue: advance to next step
      if (activeStepIndex < steps.length - 1) {
        setActiveStepIndex(activeStepIndex + 1)
      }
      setIsSubmitting(false)
    } else {
      // Save: redirect to clients table
      router.push("/clients")
    }
    
    if (!isCreateMode) {
      refetch()
    }
  }, [activeStepIndex, steps, refetch, isCreateMode, router])

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

        <div className="flex-1 overflow-y-auto custom-scrollbar pb-24">
          <div className="max-w-6xl mx-auto py-8">
            <ActiveStepComponent
              clientId={clientId}
              client={client}
              isCreateMode={isCreateMode}
              onSaveSuccess={handleSaveSuccess}
              onValidationError={handleValidationError}
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
