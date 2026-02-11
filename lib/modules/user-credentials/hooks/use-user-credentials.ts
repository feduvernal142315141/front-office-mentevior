"use client"

import { useState, useEffect, useCallback } from "react"
import type {
  UserCredential,
  UserCredentialTypeOption,
  CreateUserCredentialDto,
  UpdateUserCredentialDto,
} from "@/lib/types/user-credentials.types"
import {
  getUserCredentials,
  getUserCredentialTypes,
  createUserCredential,
  updateUserCredential,
} from "../services/user-credentials.service"
import { toast } from "sonner"
import { EXPIRING_SOON_DAYS } from "@/lib/constants/credentials.constants"

function getCredentialStatus(expirationDate: string): "Active" | "Expired" {
  if (!expirationDate) return "Expired"
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const [year, month, day] = expirationDate.split("-").map(Number)
  const expiration = new Date(year, (month || 1) - 1, day || 1)
  expiration.setHours(0, 0, 0, 0)
  return expiration > today ? "Active" : "Expired"
}

function daysUntil(dateStr: string): number {
  const [year, month, day] = dateStr.split("-").map(Number)
  const target = new Date(year, (month || 1) - 1, day || 1)
  target.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = target.getTime() - today.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

interface UseUserCredentialsReturn {
  credentials: UserCredential[]
  credentialTypes: UserCredentialTypeOption[]
  isLoading: boolean
  isLoadingTypes: boolean
  error: Error | null
  expiredCredentials: UserCredential[]
  expiringSoonCredentials: UserCredential[]
  create: (data: CreateUserCredentialDto) => Promise<UserCredential | null>
  update: (id: string, data: UpdateUserCredentialDto) => Promise<UserCredential | null>
  refetch: () => Promise<void>
  isCreating: boolean
  isUpdating: boolean
  getComputedStatus: (expirationDate: string) => "Active" | "Expired"
}

export function useUserCredentials(): UseUserCredentialsReturn {
  const [credentials, setCredentials] = useState<UserCredential[]>([])
  const [credentialTypes, setCredentialTypes] = useState<UserCredentialTypeOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingTypes, setIsLoadingTypes] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const fetchCredentials = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getUserCredentials()

      setCredentials(data)
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error("Failed to fetch credentials")
      setError(errorObj)
      console.error("Error fetching credentials:", errorObj)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchCredentialTypes = useCallback(async () => {
    try {
      setIsLoadingTypes(true)
      const data = await getUserCredentialTypes()
      setCredentialTypes(data)
    } catch (err) {
      console.error("Failed to fetch credential types:", err)
    } finally {
      setIsLoadingTypes(false)
    }
  }, [])

  useEffect(() => {
    fetchCredentials()
    fetchCredentialTypes()
  }, [fetchCredentials, fetchCredentialTypes])

  const expiredCredentials = credentials.filter((c) => c.status === "Expired")

  const expiringSoonCredentials = credentials.filter((c) => {
    const remaining = daysUntil(c.expirationDate)
    return remaining > 0 && remaining <= EXPIRING_SOON_DAYS
  })

  const create = async (data: CreateUserCredentialDto): Promise<UserCredential | null> => {
    try {
      setIsCreating(true)

      const status = data.status ?? getCredentialStatus(data.expirationDate)
      const payload: CreateUserCredentialDto = { ...data, status }
      
      const result = await createUserCredential(payload)

      if (result) {       
        toast.success("Credential saved successfully.")
      }

      await fetchCredentials()
      return result
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error("Failed to create credential")
      toast.error(errorObj.message)
      return null
    } finally {
      setIsCreating(false)
    }
  }

  const update = async (id: string, data: UpdateUserCredentialDto): Promise<UserCredential | null> => {
    try {
      setIsUpdating(true)
      
      const status = data.expirationDate 
        ? getCredentialStatus(data.expirationDate)
        : undefined
      const payload = status !== undefined ? { ...data, status } : data
      
      const result = await updateUserCredential(id, payload)

      if (result) {
      
        toast.success("Credential updated successfully.")
      }

      await fetchCredentials()
      return result
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error("Failed to update credential")
      toast.error(errorObj.message)
      return null
    } finally {
      setIsUpdating(false)
    }
  }

  return {
    credentials,
    credentialTypes,
    isLoading,
    isLoadingTypes,
    error,
    expiredCredentials,
    expiringSoonCredentials,
    create,
    update,
    refetch: fetchCredentials,
    isCreating,
    isUpdating,
    getComputedStatus: getCredentialStatus,
  }
}
