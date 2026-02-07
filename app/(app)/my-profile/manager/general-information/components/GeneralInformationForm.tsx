"use client"

import { FormProvider, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { 
  generalInformationSchema, 
  type GeneralInformationFormValues 
} from "@/lib/schemas/general-information.schema"
import { PersonalInformationSection } from "./PersonalInformationSection"
import { ProfessionalInformationSection } from "./ProfessionalInformationSection"
import { FormBottomBar } from "@/components/custom/FormBottomBar"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { mockGeneralInformation } from "../mocks/general-information.mock"
import { toast } from "sonner"

export function GeneralInformationForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const form = useForm<GeneralInformationFormValues>({
    resolver: zodResolver(generalInformationSchema),
    defaultValues: mockGeneralInformation,
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 800))
        form.reset(mockGeneralInformation)
      } catch (error) {
        console.error("Error loading data:", error)
        toast.error("Failed to load user information")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [form])

  const onSubmit = async (data: GeneralInformationFormValues) => {
    try {
      setIsSubmitting(true)
      console.log("Form data:", data)
      
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      toast.success("Information updated successfully", {
        description: "Your profile has been updated.",
      })
      
      setTimeout(() => {
        router.push("/my-profile")
      }, 500)
      
    } catch (error) {
      console.error("Error submitting form:", error)
      toast.error("Failed to update information", {
        description: "Please try again later.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push("/my-profile")
  }

  if (isLoading) {
    return (
      <div className="space-y-8 pb-24">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6" />
          <div className="border-t border-gray-200 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="h-14 bg-gray-200 rounded-lg" />
              ))}
            </div>
          </div>
        </div>

        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6" />
          <div className="border-t border-gray-200 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-14 bg-gray-200 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <div className="pb-24 space-y-8">
          <PersonalInformationSection />
          <ProfessionalInformationSection />
        </div>

        <FormBottomBar
          isSubmitting={isSubmitting}
          onCancel={handleCancel}
          submitText="Update Information"
        />
      </form>
    </FormProvider>
  )
}
