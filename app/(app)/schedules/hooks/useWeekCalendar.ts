"use client"

import { useState, useCallback, useMemo } from "react"
import { 
  format, 
  parseISO, 
  isSameDay, 
  getHours, 
  getMinutes,
  addWeeks,
  subWeeks,
  differenceInMinutes,
  addMinutes,
  setHours,
  setMinutes,
} from "date-fns"
import type { DragStartEvent, DragEndEvent } from "@dnd-kit/core"
import type { 
  Appointment, 
  AppointmentStatus,
  AppointmentLocation,
  AppointmentPosition,
  AppointmentModalDefaults,
  ContextMenuState,
} from "@/lib/types/appointment.types"
import { useAppointments } from "@/lib/store/appointments.store"
import { getWeekDays, getWeekStart } from "@/lib/date"
import { getMockClientById } from "@/lib/modules/schedules/mocks"
import { useToast } from "@/hooks/use-toast"
import { useIsMobile } from "@/hooks/use-mobile"


export const CALENDAR_HOURS = Array.from({ length: 13 }, (_, i) => i + 7) 
export const SLOT_HEIGHT = 60 

interface UseWeekCalendarProps {
  rbtId: string
}

interface UseWeekCalendarReturn {

  weekStart: string
  weekDays: Date[]
  displayDays: Date[]
  selectedDay: number
  activeId: string | null
  activeAppointment: Appointment | null
  
  showModal: boolean
  showDuplicateModal: boolean
  modalDefaults: AppointmentModalDefaults
  contextMenu: ContextMenuState | null
  
  searchQuery: string
  filterStatus: AppointmentStatus | "all"
  filterLocation: AppointmentLocation | "all"
  filteredAppointments: Appointment[]
  
  hoveredSlot: string | null
  clickedSlot: string | null
  
  isMobile: boolean
  
  actions: {
    goToPrevWeek: () => void
    goToNextWeek: () => void
    goToToday: () => void
    setSelectedDay: (day: number) => void
    
    openNewAppointmentModal: (defaults?: AppointmentModalDefaults) => void
    openEditModal: (appointment: Appointment) => void
    openDuplicateModal: (appointment: Appointment) => void
    closeModal: () => void
    closeDuplicateModal: () => void
    
    openContextMenu: (e: React.MouseEvent, appointmentId: string) => void
    closeContextMenu: () => void
    handleContextMenuAction: (action: string, appointmentId: string) => void
    
    handleSlotClick: (date: Date, hour: number) => void
    setHoveredSlot: (slotId: string | null) => void
    
    setSearchQuery: (query: string) => void
    setFilterStatus: (status: AppointmentStatus | "all") => void
    setFilterLocation: (location: AppointmentLocation | "all") => void
    
    handleDragStart: (event: DragStartEvent) => void
    handleDragEnd: (event: DragEndEvent) => void
    
    handleStatusChange: (appointmentId: string, status: AppointmentStatus) => void
    getAppointmentPosition: (appointment: Appointment) => AppointmentPosition | null
    hasAppointmentCoveringSlot: (dayIndex: number, hour: number) => boolean
  }
}


export function useWeekCalendar({ rbtId }: UseWeekCalendarProps): UseWeekCalendarReturn {

  const { toast } = useToast()
  const isMobile = useIsMobile()
  const { 
    appointments, 
    updateAppointment, 
    setSelectedAppointment, 
    selectedAppointment,
    checkConflict,
    deleteAppointment,
  } = useAppointments()
  

  const [weekStart, setWeekStart] = useState(getWeekStart())
  const [selectedDay, setSelectedDay] = useState(0)
  const [activeId, setActiveId] = useState<string | null>(null)
  

  const [showModal, setShowModal] = useState(false)
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [modalDefaults, setModalDefaults] = useState<AppointmentModalDefaults>({})
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  

  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<AppointmentStatus | "all">("all")
  const [filterLocation, setFilterLocation] = useState<AppointmentLocation | "all">("all")
  
 
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null)
  const [clickedSlot, setClickedSlot] = useState<string | null>(null)
  
 
  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart])
  const displayDays = useMemo(
    () => (isMobile ? [weekDays[selectedDay]] : weekDays),
    [isMobile, weekDays, selectedDay]
  )
  
  const myAppointments = useMemo(
    () => appointments.filter((apt) => apt.rbtId === rbtId),
    [appointments, rbtId]
  )
  
  const filteredAppointments = useMemo(() => {
    return myAppointments.filter((apt) => {
    
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const client = getMockClientById(apt.clientId)
        if (!client || !client.fullName.toLowerCase().includes(query)) {
          return false
        }
      }
      
     
      if (filterStatus !== "all" && apt.status !== filterStatus) {
        return false
      }
      
    
      if (filterLocation !== "all" && apt.location !== filterLocation) {
        return false
      }
      
      return true
    })
  }, [myAppointments, searchQuery, filterStatus, filterLocation])
  
  const activeAppointment = useMemo(
    () => (activeId ? myAppointments.find((apt) => apt.id === activeId) ?? null : null),
    [activeId, myAppointments]
  )
  
  
  const goToPrevWeek = useCallback(() => {
    const current = parseISO(weekStart)
    setWeekStart(subWeeks(current, 1).toISOString())
  }, [weekStart])
  
  const goToNextWeek = useCallback(() => {
    const current = parseISO(weekStart)
    setWeekStart(addWeeks(current, 1).toISOString())
  }, [weekStart])
  
  const goToToday = useCallback(() => {
    setWeekStart(getWeekStart())
  }, [])
  

  const openNewAppointmentModal = useCallback((defaults?: AppointmentModalDefaults) => {
    setModalDefaults(defaults ?? {})
    setSelectedAppointment(null)
    setShowModal(true)
  }, [setSelectedAppointment])
  
  const openEditModal = useCallback((appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setShowModal(true)
  }, [setSelectedAppointment])
  
  const openDuplicateModal = useCallback((appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setShowDuplicateModal(true)
  }, [setSelectedAppointment])
  
  const closeModal = useCallback(() => {
    setShowModal(false)
    setSelectedAppointment(null)
    setModalDefaults({})
  }, [setSelectedAppointment])
  
  const closeDuplicateModal = useCallback(() => {
    setShowDuplicateModal(false)
    setSelectedAppointment(null)
  }, [setSelectedAppointment])
  
 
  const openContextMenu = useCallback((e: React.MouseEvent, appointmentId: string) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, appointmentId })
  }, [])
  
  const closeContextMenu = useCallback(() => {
    setContextMenu(null)
  }, [])
  
  const handleContextMenuAction = useCallback((action: string, appointmentId: string) => {
    const appointment = myAppointments.find((apt) => apt.id === appointmentId)
    if (!appointment) return
    
    switch (action) {
      case "view":
      case "edit":
        setSelectedAppointment(appointment)
        setShowModal(true)
        break
      case "duplicate":
        setSelectedAppointment(appointment)
        setShowDuplicateModal(true)
        break
      case "delete":
        deleteAppointment(appointmentId)
        toast({
          title: "Appointment Deleted",
          description: "The appointment has been removed",
        })
        break
      case "cancel":
        updateAppointment(appointmentId, { status: "Cancelled" })
        toast({
          title: "Appointment Cancelled",
          description: "The appointment has been cancelled",
        })
        break
    }
    
    setContextMenu(null)
  }, [myAppointments, setSelectedAppointment, deleteAppointment, updateAppointment, toast])
  
  
  const handleSlotClick = useCallback((date: Date, hour: number) => {
    const dateStr = format(date, "yyyy-MM-dd")
    const timeStr = `${hour.toString().padStart(2, "0")}:00`
    const slotId = `slot-${format(date, "yyyy-MM-dd")}-${hour}`
    
    setClickedSlot(slotId)
    setTimeout(() => setClickedSlot(null), 1000)
    
    setModalDefaults({ date: dateStr, time: timeStr })
    setSelectedAppointment(null)
    setShowModal(true)
  }, [setSelectedAppointment])
  

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }, [])
  
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    
    if (!over) return
    
    const appointment = myAppointments.find((apt) => apt.id === active.id)
    if (!appointment) return
    
    const [_, dayIndex, hour] = over.id.toString().split("-").map(Number)
    if (isNaN(dayIndex) || isNaN(hour)) return
    
    const newDate = weekDays[dayIndex]
    const duration = differenceInMinutes(
      parseISO(appointment.endsAt), 
      parseISO(appointment.startsAt)
    )
    
    const newStart = setMinutes(setHours(newDate, hour), 0).toISOString()
    const newEnd = addMinutes(parseISO(newStart), duration).toISOString()
    
    if (checkConflict(rbtId, newStart, newEnd, appointment.id)) {
      toast({
        title: "Schedule Conflict",
        description: "Cannot move appointment to this time slot",
        variant: "destructive",
      })
      return
    }
    
    updateAppointment(appointment.id, {
      startsAt: newStart,
      endsAt: newEnd,
    })
    
    toast({
      title: "Appointment Moved",
      description: "The appointment has been rescheduled",
    })
  }, [myAppointments, weekDays, rbtId, checkConflict, updateAppointment, toast])
  
 
  const handleStatusChange = useCallback((appointmentId: string, status: AppointmentStatus) => {
    updateAppointment(appointmentId, { status })
    toast({
      title: "Status Updated",
      description: `Appointment marked as ${status}`,
    })
  }, [updateAppointment, toast])
  

  const getAppointmentPosition = useCallback((appointment: Appointment): AppointmentPosition | null => {
    const start = parseISO(appointment.startsAt)
    const dayIndex = weekDays.findIndex((d) => isSameDay(d, start))
    if (dayIndex === -1) return null
    
    const hour = getHours(start)
    const minute = getMinutes(start)
    const top = (hour - 7) * SLOT_HEIGHT + (minute / 60) * SLOT_HEIGHT
    
    const duration = differenceInMinutes(parseISO(appointment.endsAt), start)
    const height = (duration / 60) * SLOT_HEIGHT
    
    return { dayIndex, top, height }
  }, [weekDays])
  
 
  const hasAppointmentCoveringSlot = useCallback((dayIndex: number, hour: number): boolean => {
    return filteredAppointments.some((apt) => {
      const position = getAppointmentPosition(apt)
      if (!position || position.dayIndex !== dayIndex) return false
      
      const slotTop = (hour - 7) * SLOT_HEIGHT
      const slotBottom = slotTop + SLOT_HEIGHT
      const aptBottom = position.top + position.height
      
      return position.top <= slotTop && aptBottom >= slotBottom
    })
  }, [filteredAppointments, getAppointmentPosition])
  

  return {

    weekStart,
    weekDays,
    displayDays,
    selectedDay,
    activeId,
    activeAppointment,
    
    showModal,
    showDuplicateModal,
    modalDefaults,
    contextMenu,
    
    searchQuery,
    filterStatus,
    filterLocation,
    filteredAppointments,
    
    hoveredSlot,
    clickedSlot,
    
    isMobile,
    
    actions: {
      goToPrevWeek,
      goToNextWeek,
      goToToday,
      setSelectedDay,
      openNewAppointmentModal,
      openEditModal,
      openDuplicateModal,
      closeModal,
      closeDuplicateModal,
      openContextMenu,
      closeContextMenu,
      handleContextMenuAction,
      handleSlotClick,
      setHoveredSlot,
      setSearchQuery,
      setFilterStatus,
      setFilterLocation,
      handleDragStart,
      handleDragEnd,
      handleStatusChange,
      getAppointmentPosition,
      hasAppointmentCoveringSlot,
    },
  }
}
