export type StepStatus = "PENDING" | "COMPLETE" | "ERROR" | "LOCKED"

export interface StepConfig {
  id: string
  title: string
  icon: React.ReactNode
  status: StepStatus
  isLocked: boolean
  requiredFieldsMissing?: number
  component: React.ComponentType<StepComponentProps>
}

export interface StepComponentProps {
  clientId: string
  onSaveSuccess: (data: unknown) => void
  onValidationError: (errors: Record<string, string>) => void
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
