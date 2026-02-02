"use client"

import type React from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogTitle 
} from "@/components/ui/dialog"
import { VisuallyHidden } from "@/components/ui/visually-hidden"
import { Button } from "@/components/custom/Button"
import { 
  Search, 
  User, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  FileText, 
  Check, 
  Briefcase, 
  Home, 
  School, 
  Building2,
  Video,
} from "lucide-react"
import type { Appointment, AppointmentLocation } from "@/lib/types/appointment.types"
import { useAppointmentForm } from "../hooks/useAppointmentForm"
import { cn } from "@/lib/utils"


interface AppointmentModalProps {
  open: boolean
  onClose: () => void
  appointment?: Appointment | null
  defaultDate?: string
  defaultTime?: string
  rbtId: string
}


const LOCATIONS: Array<{
  value: AppointmentLocation
  label: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  { value: "Clinic", label: "Clinic", icon: Building2 },
  { value: "Home", label: "Home", icon: Home },
  { value: "School", label: "School", icon: School },
  { value: "Telehealth", label: "Telehealth", icon: Video },
]


export function AppointmentModal({
  open,
  onClose,
  appointment,
  defaultDate,
  defaultTime,
  rbtId,
}: AppointmentModalProps) {
  const {
    formData,
    errors,
    showClientDropdown,
    setShowClientDropdown,
    showServiceDropdown,
    setShowServiceDropdown,
    clientSearch,
    setClientSearch,
    clients,
    services,
    selectedClient,
    selectedService,
    isEditing,
    handleSubmit,
    handleDelete,
    updateField,
    isSubmitting,
  } = useAppointmentForm({
    appointment,
    defaultDate,
    defaultTime,
    rbtId,
    onSuccess: onClose,
  })
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className={cn(
          "sm:max-w-[520px] p-0 gap-0",
          "bg-white rounded-2xl overflow-hidden",
          "border border-gray-100",
          "shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]",
        )}
        showCloseButton={true}
      >
        <VisuallyHidden>
          <DialogTitle>
            {isEditing ? "Edit Appointment" : "New Appointment"}
          </DialogTitle>
        </VisuallyHidden>
        
        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-b from-gray-50/50 to-transparent">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? "Edit Appointment" : "New Appointment"}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Complete the details to schedule this session
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <User className="w-4 h-4 text-[#037ECC]" />
              Client & Service
            </h3>
            
            <div className="relative">
              <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                Client <span className="text-[#037ECC]">*</span>
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search client..."
                  className={cn(
                    "w-full h-11 pl-10 pr-4 rounded-xl",
                    "border border-gray-200 bg-white",
                    "text-sm text-gray-900 placeholder:text-gray-400",
                    "focus:outline-none focus:ring-2 focus:ring-[#037ECC]/20 focus:border-[#037ECC]",
                    "transition-all duration-200",
                    errors.client && "border-red-300 focus:ring-red-200 focus:border-red-400",
                  )}
                  value={selectedClient?.fullName || clientSearch}
                  onChange={(e) => {
                    setClientSearch(e.target.value)
                    setShowClientDropdown(true)
                    if (selectedClient) updateField("clientId", "")
                  }}
                  onFocus={() => setShowClientDropdown(true)}
                />
              </div>
              
              {showClientDropdown && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {clients
                    .filter((c) => 
                      !clientSearch || 
                      c.fullName.toLowerCase().includes(clientSearch.toLowerCase())
                    )
                    .map((client) => (
                      <button
                        key={client.id}
                        type="button"
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 text-left",
                          "hover:bg-gray-50 transition-colors",
                          formData.clientId === client.id && "bg-[#037ECC]/5",
                        )}
                        onClick={() => {
                          updateField("clientId", client.id)
                          setClientSearch("")
                          setShowClientDropdown(false)
                        }}
                      >
                        <div className="w-8 h-8 rounded-full bg-[#037ECC]/10 flex items-center justify-center text-xs font-medium text-[#037ECC]">
                          {client.fullName.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {client.fullName}
                          </p>
                          <p className="text-xs text-gray-500">{client.code}</p>
                        </div>
                        {formData.clientId === client.id && (
                          <Check className="w-4 h-4 text-[#037ECC]" />
                        )}
                      </button>
                    ))}
                </div>
              )}
              
              {errors.client && (
                <p className="text-xs text-red-500 mt-1">{errors.client}</p>
              )}
            </div>
            
            <div className="relative">
              <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                Service <span className="text-[#037ECC]">*</span>
              </label>
              <button
                type="button"
                className={cn(
                  "w-full h-11 px-4 rounded-xl text-left",
                  "border border-gray-200 bg-white",
                  "text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-[#037ECC]/20 focus:border-[#037ECC]",
                  "transition-all duration-200",
                  errors.service && "border-red-300",
                )}
                onClick={() => setShowServiceDropdown(!showServiceDropdown)}
              >
                {selectedService ? (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: selectedService.color }}
                    />
                    <span className="text-gray-900">{selectedService.name}</span>
                    <span className="text-gray-500 text-xs">
                      ({selectedService.durationMin} min)
                    </span>
                  </div>
                ) : (
                  <span className="text-gray-400">Select service...</span>
                )}
              </button>
              
              {showServiceDropdown && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                  {services.map((service) => (
                    <button
                      key={service.id}
                      type="button"
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 text-left",
                        "hover:bg-gray-50 transition-colors",
                        "border-l-2",
                        formData.serviceId === service.id
                          ? "bg-[#037ECC]/5 border-l-[#037ECC]"
                          : "border-l-transparent",
                      )}
                      onClick={() => {
                        updateField("serviceId", service.id)
                        setShowServiceDropdown(false)
                      }}
                    >
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: service.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {service.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {service.durationMin} minutes • Code: {service.code}
                        </p>
                      </div>
                      {formData.serviceId === service.id && (
                        <Check className="w-4 h-4 text-[#037ECC]" />
                      )}
                    </button>
                  ))}
                </div>
              )}
              
              {errors.service && (
                <p className="text-xs text-red-500 mt-1">{errors.service}</p>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-[#037ECC]" />
              Date, Time & Location
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                  Date <span className="text-[#037ECC]">*</span>
                </label>
                <input
                  type="date"
                  className={cn(
                    "w-full h-11 px-4 rounded-xl",
                    "border border-gray-200 bg-white",
                    "text-sm text-gray-900",
                    "focus:outline-none focus:ring-2 focus:ring-[#037ECC]/20 focus:border-[#037ECC]",
                    errors.date && "border-red-300",
                  )}
                  value={formData.date}
                  onChange={(e) => updateField("date", e.target.value)}
                />
                {errors.date && (
                  <p className="text-xs text-red-500 mt-1">{errors.date}</p>
                )}
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                  Time <span className="text-[#037ECC]">*</span>
                </label>
                <input
                  type="time"
                  className={cn(
                    "w-full h-11 px-4 rounded-xl",
                    "border border-gray-200 bg-white",
                    "text-sm text-gray-900",
                    "focus:outline-none focus:ring-2 focus:ring-[#037ECC]/20 focus:border-[#037ECC]",
                    errors.time && "border-red-300",
                  )}
                  value={formData.time}
                  onChange={(e) => updateField("time", e.target.value)}
                />
                {errors.time && (
                  <p className="text-xs text-red-500 mt-1">{errors.time}</p>
                )}
              </div>
            </div>
            
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                Location <span className="text-[#037ECC]">*</span>
              </label>
              <div className="flex gap-2">
                {LOCATIONS.map((loc) => {
                  const Icon = loc.icon
                  const isSelected = formData.location === loc.value
                  
                  return (
                    <button
                      key={loc.value}
                      type="button"
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl",
                        "border text-sm font-medium",
                        "transition-all duration-200",
                        isSelected
                          ? "bg-[#037ECC]/10 border-[#037ECC] text-[#037ECC]"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50",
                      )}
                      onClick={() => updateField("location", loc.value)}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{loc.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#037ECC]" />
              Notes (optional)
            </h3>
            <textarea
              placeholder="Add any relevant notes about this session..."
              className={cn(
                "w-full min-h-[80px] px-4 py-3 rounded-xl",
                "border border-gray-200 bg-white",
                "text-sm text-gray-900 placeholder:text-gray-400",
                "focus:outline-none focus:ring-2 focus:ring-[#037ECC]/20 focus:border-[#037ECC]",
                "resize-none",
              )}
              value={formData.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            {isEditing ? (
              <Button
                type="button"
                variant="danger"
                onClick={handleDelete}
                className="h-10"
              >
                Delete
              </Button>
            ) : (
              <div />
            )}
            
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                className="h-10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={isSubmitting}
                className="h-10"
              >
                {isEditing ? "Update" : "Create"} Appointment
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
