"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUpdateClient } from "@/lib/modules/clients/hooks/use-update-client"
import { useCreateClient } from "@/lib/modules/clients/hooks/use-create-client"
import { clientEditFormSchema, clientCreateFormSchema, type ClientFormValues } from "@/lib/schemas/client-form.schema"
import type { Client, UpdateClientDto, CreateClientDto } from "@/lib/types/client.types"
import { isoToLocalDate } from "@/lib/date"
import { formatPhoneInput, normalizePhone } from "@/lib/utils/phone-format"

interface UseStep1FormProps {
  client: Client | null
  isCreateMode?: boolean
  onSaveSuccess: (data: unknown) => void
  onValidationError: (errors: Record<string, string>) => void
}

export function useStep1Form({ client, isCreateMode = false, onSaveSuccess, onValidationError }: UseStep1FormProps) {
  const router = useRouter()
  const { update } = useUpdateClient()
  const { create } = useCreateClient()

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(isCreateMode ? clientCreateFormSchema : clientEditFormSchema),
    mode: "onChange",
    defaultValues: {
      firstName: client?.firstName || "",
      lastName: client?.lastName || "",
      phoneNumber: client?.phoneNumber || "",
      chartId: client?.chartId || "",
      brithDate: client?.brithDate ? isoToLocalDate(client.brithDate) : "",
      languages: client?.languages?.map(l => l.id) || [],
      genderId: client?.genderId || "",
      email: client?.email || "",
      ssn: client?.ssn || "",
      active: client?.status ?? true,
    },
  })

  useEffect(() => {
    form.trigger()
  }, [form])

  const handleSubmit = async () => {
    const isValid = await form.trigger()
    
    if (!isValid) {
      const errors: Record<string, string> = {}
      Object.entries(form.formState.errors).forEach(([key, error]) => {
        if (error && typeof error === 'object' && 'message' in error) {
          errors[key] = error.message as string
        }
      })
      onValidationError(errors)
      return
    }

    const data = form.getValues()

    if (isCreateMode) {
      const createDto: CreateClientDto = {
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: normalizePhone(data.phoneNumber),
        chartId: data.chartId || undefined,
        brithDate: data.brithDate || undefined,
        languages: data.languages && data.languages.length > 0 ? data.languages : undefined,
        genderId: data.genderId || undefined,
        email: data.email || undefined,
        ssn: data.ssn || undefined,
        status: data.active ?? true,
      }

      const result = await create(createDto)

      if (result && result.id) {
        form.reset(data)
        window.history.replaceState(null, '', `/clients/${result.id}/profile`)
        onSaveSuccess({ ...data, clientId: result.id })
      } else {
        onValidationError({ general: "Failed to create client" })
      }
      return
    }

    if (!form.formState.isDirty) {
      onSaveSuccess(form.getValues())
      return
    }

    const updateDto: UpdateClientDto = {
      id: client!.id,
      firstName: data.firstName,
      lastName: data.lastName,
      phoneNumber: normalizePhone(data.phoneNumber),
      chartId: data.chartId || undefined,
      brithDate: data.brithDate || undefined,
      languages: data.languages && data.languages.length > 0 ? data.languages : undefined,
      genderId: data.genderId || undefined,
      email: data.email || undefined,
      ssn: data.ssn || undefined,
      status: data.active,
    }

    const result = await update(client!.id, updateDto)

    if (result) {
      form.reset(data)
      onSaveSuccess(data)
    } else {
      onValidationError({ general: "Failed to update client" })
    }
  }

  return {
    form,
    handleSubmit,
    isValid: form.formState.isValid,
  }
}
