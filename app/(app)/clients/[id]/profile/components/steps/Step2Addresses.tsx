"use client"

import { useEffect } from "react"
import { MapPin } from "lucide-react"
import { StepPlaceholder } from "./StepPlaceholder"

interface Step2AddressesProps {
  clientId: string
  client: any
  isCreateMode?: boolean
  onSaveSuccess: (data: unknown) => void
  onValidationError: (errors: Record<string, string>) => void
  registerSubmit: (submitFn: () => Promise<void>) => void
  registerValidation: (isValid: boolean) => void
}

export function Step2Addresses({ onSaveSuccess, registerSubmit, registerValidation }: Step2AddressesProps) {
  useEffect(() => {
    registerValidation(true)
  }, [registerValidation])

  useEffect(() => {
    registerSubmit(async () => {
      onSaveSuccess({})
    })
  }, [registerSubmit, onSaveSuccess])

  return <StepPlaceholder icon={MapPin} title="Addresses" scrumId="SCRUM-124" />
}
