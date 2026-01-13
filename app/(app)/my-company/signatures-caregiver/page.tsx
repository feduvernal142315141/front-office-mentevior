"use client"

import { useEffect, useState } from "react"
import { Check, PenTool } from "lucide-react"
import { SignatureType } from "@/lib/types/caregiver-signature-config.types"
import {
  getCaregiverSignatureConfig,
  updateCaregiverSignatureConfig,
} from "@/lib/services/caregiver-signature-config.service"
import { useToast } from "@/hooks/use-toast"

export default function SignaturesCaregiverPage() {
  const [selectedType, setSelectedType] = useState<SignatureType>(SignatureType.CHECKMARK)
  const [configId, setConfigId] = useState<string | undefined>()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadConfiguration()
  }, [])

  const loadConfiguration = async () => {
    try {
      setIsLoading(true)
      const config = await getCaregiverSignatureConfig()
      if (config) {
        // Convert old NONE values to CHECKMARK
        const signatureType = config.signatureType === SignatureType.NONE 
          ? SignatureType.CHECKMARK 
          : config.signatureType
        
        setSelectedType(signatureType)
        setConfigId(config.id)
        
        // If it was NONE, update it to CHECKMARK in the database
        if (config.signatureType === SignatureType.NONE) {
          await updateCaregiverSignatureConfig({
            id: config.id,
            signatureType: SignatureType.CHECKMARK,
            active: true,
          })
        }
      } else {
        // No configuration exists yet, set default to CHECKMARK
        setSelectedType(SignatureType.CHECKMARK)
        setConfigId(undefined)
      }
    } catch (error) {
      console.error("Error loading configuration:", error)
      toast({
        title: "Error",
        description: "Failed to load configuration",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectType = async (type: SignatureType) => {
    if (isSaving) return

    try {
      setIsSaving(true)
      
      // Always fetch the latest config to ensure we have the correct ID
      const currentConfig = await getCaregiverSignatureConfig()
      const idToUse = currentConfig?.id || configId
      
      const newId = await updateCaregiverSignatureConfig({
        id: idToUse,
        signatureType: type,
        active: true,
      })
      
      // Update configId with the returned ID (whether created or updated)
      if (newId) {
        setConfigId(newId)
      }
      
      setSelectedType(type)
      toast({
        title: "Success",
        description: "Configuration updated successfully",
      })
    } catch (error) {
      console.error("Error updating configuration:", error)
      toast({
        title: "Error",
        description: "Failed to update configuration",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Signatures Caregiver</h1>
          <p className="mt-2 text-gray-600">
            Configure how caregivers confirm their participation in Progress Notes
          </p>
        </div>
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading configuration...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Signatures Caregiver</h1>
          <p className="mt-2 text-gray-600">
            Configure how caregivers confirm their participation in Progress Notes
          </p>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        {/* Check Mark Option */}
        <button
          onClick={() => handleSelectType(SignatureType.CHECKMARK)}
          disabled={isSaving}
          className={`
            relative p-8 rounded-2xl border-2 transition-all duration-200 bg-white
            ${
              selectedType === SignatureType.CHECKMARK
                ? "border-blue-500 bg-blue-50 shadow-lg shadow-blue-100"
                : "border-gray-200 hover:border-blue-300 hover:shadow-md"
            }
            ${isSaving ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          `}
        >
          {selectedType === SignatureType.CHECKMARK && (
            <div className="absolute top-4 right-4 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
          )}
          
          <div className="flex flex-col items-center text-center">
            <div
              className={`
              w-16 h-16 rounded-full flex items-center justify-center mb-4
              ${
                selectedType === SignatureType.CHECKMARK
                  ? "bg-blue-100"
                  : "bg-gray-100"
              }
            `}
            >
              <Check
                className={`
                w-8 h-8
                ${selectedType === SignatureType.CHECKMARK ? "text-blue-600" : "text-gray-400"}
              `}
              />
            </div>
            <h3
              className={`
              text-lg font-semibold mb-2
              ${selectedType === SignatureType.CHECKMARK ? "text-blue-900" : "text-gray-900"}
            `}
            >
              Check Mark
            </h3>
            <p className="text-sm text-gray-600">
              Caregivers confirm with a simple checkbox in Progress Notes
            </p>
          </div>
        </button>

        {/* Signature Option */}
        <button
          onClick={() => handleSelectType(SignatureType.SIGNATURE)}
          disabled={isSaving}
          className={`
            relative p-8 rounded-2xl border-2 transition-all duration-200 bg-white
            ${
              selectedType === SignatureType.SIGNATURE
                ? "border-blue-500 bg-blue-50 shadow-lg shadow-blue-100"
                : "border-gray-200 hover:border-blue-300 hover:shadow-md"
            }
            ${isSaving ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          `}
        >
          {selectedType === SignatureType.SIGNATURE && (
            <div className="absolute top-4 right-4 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
          )}
          
          <div className="flex flex-col items-center text-center">
            <div
              className={`
              w-16 h-16 rounded-full flex items-center justify-center mb-4
              ${
                selectedType === SignatureType.SIGNATURE
                  ? "bg-blue-100"
                  : "bg-gray-100"
              }
            `}
            >
              <PenTool
                className={`
                w-8 h-8
                ${selectedType === SignatureType.SIGNATURE ? "text-blue-600" : "text-gray-400"}
              `}
              />
            </div>
            <h3
              className={`
              text-lg font-semibold mb-2
              ${selectedType === SignatureType.SIGNATURE ? "text-blue-900" : "text-gray-900"}
            `}
            >
              Electronic Signature
            </h3>
            <p className="text-sm text-gray-600">
              Caregivers draw their signature electronically in Progress Notes
            </p>
          </div>
        </button>
      </div>

      <div className="mt-8">
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
          <h4 className="font-semibold text-blue-900 mb-3 text-lg">Important Notes:</h4>
          <ul className="text-sm text-blue-800 space-y-2 list-disc list-inside">
            <li>Caregiver confirmation is optional and not required to complete Progress Notes</li>
            <li>Changes apply only to new Progress Notes created after this update</li>
            <li>Existing Progress Notes will not be modified</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
  )
}
