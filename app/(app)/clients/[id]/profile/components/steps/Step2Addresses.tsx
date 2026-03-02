"use client"

import { MapPin } from "lucide-react"
import { StepPlaceholder } from "./StepPlaceholder"

interface Step2AddressesProps {
  clientId: string
  client: any
  onSaveSuccess: (data: unknown) => void
  onValidationError: (errors: Record<string, string>) => void
  registerSubmit: (submitFn: () => Promise<void>) => void
  registerValidation: (isValid: boolean) => void
}

export function Step2Addresses({ registerValidation }: Step2AddressesProps) {
  return <StepPlaceholder icon={MapPin} title="Addresses" scrumId="SCRUM-124" />
}
