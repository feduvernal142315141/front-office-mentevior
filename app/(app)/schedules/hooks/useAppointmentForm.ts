"use client"

import { useState, useEffect, useCallback } from "react"
import { format, parseISO } from "date-fns"
import type { 
  Appointment, 
  AppointmentFormData, 
  AppointmentLocation 
} from "@/lib/types/appointment.types"
import { useAppointments } from "@/lib/store/appointments.store"
import { 
  getMockClients, 
  getMockServices, 
  getMockBCBAs 
} from "@/lib/modules/schedules/mocks"
import { addMinutes } from "@/lib/date"
import { useToast } from "@/hooks/use-toast"

interface UseAppointmentFormProps {
  appointment?: Appointment | null
  defaultDate?: string
  defaultTime?: string
  rbtId: string
  onSuccess?: () => void
}

interface UseAppointmentFormReturn {
  formData: AppointmentFormData
  setFormData: React.Dispatch<React.SetStateAction<AppointmentFormData>>
  errors: Record<string, string>
  
  showClientDropdown: boolean
  setShowClientDropdown: (show: boolean) => void
  showServiceDropdown: boolean
  setShowServiceDropdown: (show: boolean) => void
  clientSearch: string
  setClientSearch: (search: string) => void
  
  clients: ReturnType<typeof getMockClients>
  services: ReturnType<typeof getMockServices>
  bcbas: ReturnType<typeof getMockBCBAs>
  
  selectedClient: ReturnType<typeof getMockClients>[0] | undefined
  selectedService: ReturnType<typeof getMockServices>[0] | undefined
  
  isEditing: boolean
  
  handleSubmit: (e: React.FormEvent) => void
  handleDelete: () => void
  updateField: <K extends keyof AppointmentFormData>(
    field: K, 
    value: AppointmentFormData[K]
  ) => void
  
  isSubmitting: boolean
}


const getInitialFormData = (): AppointmentFormData => ({
  clientId: "",
  serviceId: "",
  bcbaId: "",
  location: "Clinic",
  date: "",
  time: "",
  notes: "",
})


export function useAppointmentForm({
  appointment,
  defaultDate,
  defaultTime,
  rbtId,
  onSuccess,
}: UseAppointmentFormProps): UseAppointmentFormReturn {
  const { toast } = useToast()
  const { addAppointment, updateAppointment, deleteAppointment, checkConflict } = useAppointments()
  
  const [formData, setFormData] = useState<AppointmentFormData>(getInitialFormData())
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const [showServiceDropdown, setShowServiceDropdown] = useState(false)
  const [clientSearch, setClientSearch] = useState("")
  
  const clients = getMockClients()
  const services = getMockServices()
  const bcbas = getMockBCBAs()
  
  const isEditing = !!appointment
  
  const selectedClient = clients.find((c) => c.id === formData.clientId)
  const selectedService = services.find((s) => s.id === formData.serviceId)
  
  useEffect(() => {
    if (appointment) {
      const startTime = parseISO(appointment.startsAt)
      setFormData({
        clientId: appointment.clientId,
        serviceId: appointment.serviceId,
        bcbaId: appointment.bcbaId || "",
        location: appointment.location,
        date: format(startTime, "yyyy-MM-dd"),
        time: format(startTime, "HH:mm"),
        notes: appointment.notes || "",
      })
      setClientSearch("")
    } else if (defaultDate || defaultTime) {
      setFormData((prev) => ({
        ...prev,
        date: defaultDate || prev.date,
        time: defaultTime || prev.time,
      }))
      setClientSearch("")
    } else {
      setFormData(getInitialFormData())
      setClientSearch("")
    }
    
    setShowClientDropdown(false)
    setShowServiceDropdown(false)
    setErrors({})
  }, [appointment, defaultDate, defaultTime])
  
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.clientId) {
      newErrors.client = "Please select a client"
    }
    if (!formData.serviceId) {
      newErrors.service = "Please select a service"
    }
    if (!formData.date) {
      newErrors.date = "Please select a date"
    }
    if (!formData.time) {
      newErrors.time = "Please select a time"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])
  
  const updateField = useCallback(<K extends keyof AppointmentFormData>(
    field: K,
    value: AppointmentFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    setErrors((prev) => ({ ...prev, [field]: "" }))
  }, [])
  
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const service = services.find((s) => s.id === formData.serviceId)
      if (!service) {
        toast({
          title: "Error",
          description: "Selected service not found",
          variant: "destructive",
        })
        return
      }
      
      const startsAt = new Date(`${formData.date}T${formData.time}`).toISOString()
      const endsAt = addMinutes(startsAt, service.durationMin)
      
      const hasConflict = checkConflict(rbtId, startsAt, endsAt, appointment?.id)
      if (hasConflict) {
        toast({
          title: "Schedule Conflict",
          description: "This time slot conflicts with another appointment",
          variant: "destructive",
        })
        return
      }
      
      if (isEditing && appointment) {
        updateAppointment(appointment.id, {
          clientId: formData.clientId,
          serviceId: formData.serviceId,
          bcbaId: formData.bcbaId || undefined,
          location: formData.location,
          startsAt,
          endsAt,
          notes: formData.notes,
        })
        
        toast({
          title: "Appointment Updated",
          description: "The appointment has been updated successfully",
        })
      } else {

        const newAppointment: Appointment = {
          id: `apt-${Date.now()}`,
          rbtId,
          clientId: formData.clientId,
          serviceId: formData.serviceId,
          bcbaId: formData.bcbaId || undefined,
          location: formData.location,
          startsAt,
          endsAt,
          status: "Scheduled",
          notes: formData.notes,
          createdAt: new Date().toISOString(),
        }
        
        addAppointment(newAppointment)
        
        toast({
          title: "Appointment Created",
          description: "New appointment has been scheduled",
        })
      }
      
      onSuccess?.()
    } finally {
      setIsSubmitting(false)
    }
  }, [
    validateForm, 
    formData, 
    services, 
    rbtId, 
    appointment, 
    isEditing,
    checkConflict,
    updateAppointment,
    addAppointment,
    toast,
    onSuccess,
  ])
  

  const handleDelete = useCallback(() => {
    if (!appointment) return
    
    if (confirm("Are you sure you want to delete this appointment?")) {
      deleteAppointment(appointment.id)
      toast({
        title: "Appointment Deleted",
        description: "The appointment has been removed",
      })
      onSuccess?.()
    }
  }, [appointment, deleteAppointment, toast, onSuccess])
  
  return {
    formData,
    setFormData,
    errors,
    showClientDropdown,
    setShowClientDropdown,
    showServiceDropdown,
    setShowServiceDropdown,
    clientSearch,
    setClientSearch,
    clients,
    services,
    bcbas,
    selectedClient,
    selectedService,
    isEditing,
    handleSubmit,
    handleDelete,
    updateField,
    isSubmitting,
  }
}
