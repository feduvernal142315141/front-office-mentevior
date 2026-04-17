export type StepStatus = "PENDING" | "COMPLETE" | "ERROR" | "LOCKED"

export interface StepConfig {
  id: string
  title: string
  icon: React.ReactNode
  status: StepStatus
  isLocked: boolean
  requiredFieldsMissing?: number
  component: React.ComponentType<any>
}

export interface StepComponentProps {
  clientId: string
  client: any
  isCreateMode?: boolean
  onSaveSuccess: (data: unknown) => void
  onValidationError: (errors: Record<string, string>) => void
  onProgressUpdate?: (progress: number) => void
  registerSubmit: (submitFn: () => Promise<void>) => void
  registerReset?: (resetFn: () => void) => void
  registerValidation: (isValid: boolean) => void
  onDirtyChange?: (isDirty: boolean) => void
  onStepStatusChange?: (stepId: string, status: StepStatus) => void
  onPrimaryActionLabelChange?: (label: string | undefined) => void
  registerPrimarySubmit?: (fn: () => void) => void
}

export interface WizardState {
  activeStepIndex: number
  steps: StepConfig[]
}

export interface ProfileCompletion {
  personalInfo: StepStatus
  addresses: StepStatus
  caregivers: StepStatus
  medications: StepStatus
  physicians: StepStatus
  diagnoses: StepStatus
  insurances: StepStatus
  priorAuthorizations: StepStatus
  providers: StepStatus
  requiredDocuments: StepStatus
}
