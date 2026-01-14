"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { physicianFormSchema, type PhysicianFormData, getPhysicianFormDefaults } from "@/lib/schemas/physician-form.schema"
import { useCreatePhysician } from "@/lib/modules/physicians/hooks/use-create-physician"
import { useUpdatePhysician } from "@/lib/modules/physicians/hooks/use-update-physician"
import { usePhysicianById } from "@/lib/modules/physicians/hooks/use-physician-by-id"
import { useCountries } from "@/lib/modules/addresses/hooks/use-countries"
import { useStates } from "@/lib/modules/addresses/hooks/use-states"
import { usePhysicianTypes } from "@/lib/modules/physicians/hooks/use-physician-types"
import { usePhysicianSpecialties } from "@/lib/modules/physicians/hooks/use-physician-specialties"
import type { Physician } from "@/lib/types/physician.types"
import { useToast } from "@/hooks/use-toast"
import { useEffect, useState } from "react"

interface UsePhysicianFormProps {
  physicianId?: string
}

export function usePhysicianForm({ physicianId }: UsePhysicianFormProps = {}) {
  const router = useRouter()
  const { toast } = useToast()
  const isEditing = !!physicianId

  const { physician, isLoading: isLoadingPhysician } = usePhysicianById(physicianId || "")
  const { create, isCreating } = useCreatePhysician()
  const { update, isUpdating } = useUpdatePhysician()

  // Catalogs - USA only for country
  const { countries, isLoading: isLoadingCountries } = useCountries()
  const { physicianTypes, isLoading: isLoadingPhysicianTypes } = usePhysicianTypes()
  const { physicianSpecialties, isLoading: isLoadingPhysicianSpecialties } = usePhysicianSpecialties()
  const [usaCountryId, setUsaCountryId] = useState<string | null>(null)
  
  // Find USA country ID
  useEffect(() => {
    if (countries.length > 0 && !usaCountryId) {
      const usa = countries.find(c => c.name === "United States" || c.name === "USA")
      if (usa) {
        setUsaCountryId(usa.id)
      }
    }
  }, [countries, usaCountryId])
  
  // Always load USA states
  const { states, isLoading: isLoadingStates } = useStates(usaCountryId)

  const form = useForm<PhysicianFormData>({
    resolver: zodResolver(physicianFormSchema),
    defaultValues: getPhysicianFormDefaults(),
  })

  // Set USA as default country on mount (for all forms)
  useEffect(() => {
    if (countries.length > 0 && usaCountryId) {
      const currentCountryId = form.getValues("countryId")
      if (!currentCountryId) {
        form.setValue("countryId", usaCountryId)
        form.setValue("country", "United States")
      }
    }
  }, [countries, usaCountryId, form])

  // Load physician data when editing
  useEffect(() => {
    if (physician && isEditing && usaCountryId) {
      form.reset({
        firstName: physician.firstName,
        lastName: physician.lastName,
        specialty: physician.specialty,
        npi: physician.npi,
        mpi: physician.mpi,
        phone: physician.phone,
        fax: physician.fax || "",
        email: physician.email,
        type: physician.type,
        active: physician.active,
        isDefault: physician.isDefault,
        companyName: physician.companyName || "",
        address: physician.address || "",
        countryId: usaCountryId,
        stateId: physician.stateId || "",
        city: physician.city || "",
        zipCode: physician.zipCode || "",
        country: "United States",
        state: physician.state || "",
      })
    }
  }, [physician, isEditing, usaCountryId, form])

  const onSubmit = async (data: PhysicianFormData) => {
    try {
      if (isEditing && physicianId) {
        await update({
          id: physicianId,
          ...data,
          specialty: data.specialty as any,
          type: data.type as any,
        })
        toast({
          title: "Success",
          description: "Physician updated successfully",
        })
      } else {
        await create({
          ...data,
          specialty: data.specialty as any,
          type: data.type as any,
        })
        toast({
          title: "Success",
          description: "Physician created successfully",
        })
      }
      router.push("/my-company/physicians")
    } catch (error) {
      console.error("Error saving physician:", error)
      toast({
        title: "Error",
        description: isEditing
          ? "Failed to update physician"
          : "Failed to create physician",
        variant: "destructive",
      })
    }
  }

  const handleCancel = () => {
    router.push("/my-company/physicians")
  }

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    handleCancel,
    isSubmitting: isCreating || isUpdating,
    isLoading: isLoadingPhysician,
    isEditing,
    // Catalogs
    countries,
    states,
    physicianTypes,
    physicianSpecialties,
    isLoadingCountries,
    isLoadingStates,
    isLoadingPhysicianTypes,
    isLoadingPhysicianSpecialties,
  }
}
