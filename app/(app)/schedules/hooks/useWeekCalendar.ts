"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
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
import { useScheduleAppointments } from "@/lib/modules/schedules/hooks/use-appointments"
import { getAppointmentById, updateAppointmentStatus } from "@/lib/modules/schedules/services/appointments.service"
import { buildFilters } from "@/lib/utils/query-filters"
import { FilterOperator } from "@/lib/models/filterOperator"
import { getWeekDays, getWeekStart } from "@/lib/date"
import { useAlert } from "@/lib/contexts/alert-context"
import { matchesLocationFilter } from "@/lib/modules/schedules/utils/schedule-display"
import { useIsMobile } from "@/hooks/use-mobile"

export type CalendarScope = "provider" | "agency"
export type CalendarViewMode = "general" | "client"


export const CALENDAR_HOURS = Array.from({ length: 13 }, (_, i) => i + 7) 
export const SLOT_HEIGHT = 60 

interface UseWeekCalendarProps {
  rbtId: string
  scope?: CalendarScope
  viewMode?: CalendarViewMode
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
  showSupervisionModal: boolean
  supervisionAppointment: Appointment | null
  showDetailDrawer: boolean
  modalDefaults: AppointmentModalDefaults
  contextMenu: ContextMenuState | null
  
  searchQuery: string
  filterClient: string
  filterStatus: AppointmentStatus | "all"
  filterLocation: AppointmentLocation | "all"
  filterProvider: string
  filteredAppointments: Appointment[]
  isLoadingAppointments: boolean
  
  hoveredSlot: string | null
  clickedSlot: string | null
  
  isMobile: boolean
  viewMode: CalendarViewMode
  
  actions: {
    goToPrevWeek: () => void
    goToNextWeek: () => void
    goToToday: () => void
    setSelectedDay: (day: number) => void
    
    openNewAppointmentModal: (defaults?: AppointmentModalDefaults) => void
    openDetailDrawer: (appointment: Appointment) => void
    closeDetailDrawer: () => void
    openEditModal: (appointment: Appointment) => void
    openDuplicateModal: (appointment: Appointment) => void
    openSupervisionModal: (appointment: Appointment) => void
    closeSupervisionModal: () => void
    closeModal: () => void
    closeDuplicateModal: () => void
    
    openContextMenu: (e: React.MouseEvent, appointmentId: string) => void
    openMenuAt: (x: number, y: number, appointmentId: string) => void
    openSupervisionMenuAt: (x: number, y: number, appointmentId: string) => void
    closeContextMenu: () => void
    handleContextMenuAction: (action: string, appointmentId: string) => void
    
    handleSlotClick: (date: Date, hour: number) => void
    setHoveredSlot: (slotId: string | null) => void
    
    setSearchQuery: (query: string) => void
    setFilterClient: (clientId: string) => void
    setFilterStatus: (status: AppointmentStatus | "all") => void
    setFilterLocation: (location: AppointmentLocation | "all") => void
    setFilterProvider: (providerId: string) => void
    
    handleDragStart: (event: DragStartEvent) => void
    handleDragEnd: (event: DragEndEvent) => void
    
    handleStatusChange: (appointmentId: string, status: AppointmentStatus) => void
    handleAppointmentSaved: () => void
    getAppointmentPosition: (appointment: Appointment) => AppointmentPosition | null
    hasAppointmentCoveringSlot: (dayIndex: number, hour: number) => boolean
  }
}


export function useWeekCalendar({
  rbtId,
  scope = "provider",
  viewMode = "client",
}: UseWeekCalendarProps): UseWeekCalendarReturn {

  const alert = useAlert()
  const isMobile = useIsMobile()

  // Store — synced from GET /appointment
  const {
    appointments,
    updateAppointment,
    setAppointments,
    setIsLoading,
    setError,
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
  const [showSupervisionModal, setShowSupervisionModal] = useState(false)
  const [supervisionAppointment, setSupervisionAppointment] = useState<Appointment | null>(null)
  const [showDetailDrawer, setShowDetailDrawer] = useState(false)
  const [modalDefaults, setModalDefaults] = useState<AppointmentModalDefaults>({})
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  

  const [searchQuery, setSearchQuery] = useState("")
  const [filterClient, setFilterClient] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<AppointmentStatus | "all">("all")
  const [filterLocation, setFilterLocation] = useState<AppointmentLocation | "all">("all")
  const [filterProvider, setFilterProvider] = useState<string>("all")
  
 
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null)
  const [clickedSlot, setClickedSlot] = useState<string | null>(null)
  
 
  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart])
  const dateFrom = useMemo(() => format(parseISO(weekStart), "yyyy-MM-dd"), [weekStart])
  const dateTo = useMemo(() => {
    const days = getWeekDays(weekStart)
    return format(days[days.length - 1], "yyyy-MM-dd")
  }, [weekStart])

  // All filters go as filters[] with proper type prefixes
  const appointmentFilters = useMemo(() => {
    const rules = []

    // Provider filter
    const effectiveProvider = scope === "agency"
      ? (filterProvider === "all" ? null : filterProvider)
      : rbtId
    if (effectiveProvider) {
      rules.push({
        field: "providerId",
        value: effectiveProvider,
        operator: FilterOperator.eq,
        type: "uuid" as const,
      })
    }

    // Client filter
    if (filterClient !== "all") {
      rules.push({
        field: "clientId",
        value: filterClient,
        operator: FilterOperator.eq,
        type: "uuid" as const,
      })
    }

    if (filterStatus !== "all") {
      // Map frontend status values to backend names (with spaces)
      const statusNameMap: Record<string, string> = {
        InProgress: "In Progress",
        NoShow: "No Show",
      }
      rules.push({
        field: "appointmentStatus.name",
        value: statusNameMap[filterStatus] ?? filterStatus,
        operator: FilterOperator.relatedEqual,
        type: "string" as const,
      })
    }

    return buildFilters(rules, searchQuery.trim()
      ? { fields: ["clientFullName"], search: searchQuery }
      : undefined,
    )
  }, [scope, rbtId, filterProvider, filterClient, filterStatus, searchQuery])

  const {
    appointments: fetchedAppointments,
    isLoading: isLoadingAppointments,
    error: fetchError,
    refetch: refetchAppointments,
  } = useScheduleAppointments({
    filters: appointmentFilters.length > 0 ? appointmentFilters : undefined,
    dateFrom,
    dateTo,
  })

  useEffect(() => {
    setAppointments(fetchedAppointments)
  }, [fetchedAppointments, setAppointments])

  useEffect(() => {
    setIsLoading(isLoadingAppointments)
  }, [isLoadingAppointments, setIsLoading])

  useEffect(() => {
    setError(fetchError?.message ?? null)
  }, [fetchError, setError])

  // ─── Auto-status: Scheduled→InProgress when time arrives, InProgress→Completed when time expires ───
  useEffect(() => {
    const autoTransition = () => {
      const now = new Date()
      const currentAppointments = useAppointments.getState().appointments

      for (const apt of currentAppointments) {
        if (apt.status === "Cancelled" || apt.status === "NoShow" || apt.status === "Completed") continue

        const start = parseISO(apt.startsAt)
        const end = parseISO(apt.endsAt)

        if (apt.status === "Scheduled" && now >= start) {
          updateAppointment(apt.id, { status: "InProgress" })
          void updateAppointmentStatus(apt.id, "InProgress")
        } else if (apt.status === "InProgress" && now >= end) {
          updateAppointment(apt.id, { status: "Completed" })
          void updateAppointmentStatus(apt.id, "Completed")
        }
      }
    }

    // Run immediately on load and then every 60 seconds
    autoTransition()
    const interval = setInterval(autoTransition, 60_000)
    return () => clearInterval(interval)
  }, [appointments, updateAppointment])

  const displayDays = useMemo(
    () => (isMobile ? [weekDays[selectedDay]] : weekDays),
    [isMobile, weekDays, selectedDay]
  )
  
  // All filtering is now server-side via buildFilters.
  // myAppointments is a simple alias for the fetched data.
  const myAppointments = appointments

  const filteredAppointments = useMemo(() => {
    return myAppointments
  }, [myAppointments])
  
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

  const syncAppointmentInStore = useCallback(
    (appointment: Appointment) => {
      setSelectedAppointment(appointment)
      setAppointments(
        useAppointments.getState().appointments.map((apt) =>
          apt.id === appointment.id ? appointment : apt,
        ),
      )
    },
    [setAppointments, setSelectedAppointment],
  )

  const loadAppointmentDetails = useCallback(
    async (appointment: Appointment): Promise<Appointment> => {
      setSelectedAppointment(appointment)

      try {
        const full = await getAppointmentById(appointment.id)
        if (full) {
          syncAppointmentInStore(full)
          return full
        }
        return appointment
      } catch {
        alert.error("Error", "Failed to load appointment details")
        return appointment
      }
    },
    [alert, setSelectedAppointment, syncAppointmentInStore],
  )

  const openDetailDrawer = useCallback((appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setShowDetailDrawer(true)
  }, [setSelectedAppointment])

  const closeDetailDrawer = useCallback(() => {
    setShowDetailDrawer(false)
  }, [])

  const openEditModal = useCallback((appointment: Appointment) => {
    setShowDetailDrawer(false)
    setShowModal(true)
    void loadAppointmentDetails(appointment)
  }, [loadAppointmentDetails])
  
  const openDuplicateModal = useCallback((appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setShowDuplicateModal(true)
  }, [setSelectedAppointment])
  
  const closeModal = useCallback(() => {
    setShowModal(false)
    setSelectedAppointment(null)
    setModalDefaults({})
  }, [setSelectedAppointment])

  const handleAppointmentSaved = useCallback(() => {
    closeModal()
    void refetchAppointments()
  }, [closeModal, refetchAppointments])
  
  const closeDuplicateModal = useCallback(() => {
    setShowDuplicateModal(false)
    setSelectedAppointment(null)
  }, [setSelectedAppointment])

  const openSupervisionModal = useCallback(
    async (appointment: Appointment) => {
      const full = await loadAppointmentDetails(appointment)
      setSupervisionAppointment(full)
      setShowSupervisionModal(true)
    },
    [loadAppointmentDetails],
  )

  const closeSupervisionModal = useCallback(() => {
    setShowSupervisionModal(false)
    setSupervisionAppointment(null)
  }, [])
  
 
  const openContextMenu = useCallback((e: React.MouseEvent, appointmentId: string) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, appointmentId })
  }, [])
  
  const openMenuAt = useCallback((x: number, y: number, appointmentId: string) => {
    setContextMenu({ x, y, appointmentId })
  }, [])

  const openSupervisionMenuAt = useCallback((x: number, y: number, appointmentId: string) => {
    setContextMenu({ x, y, appointmentId, isSupervision: true })
  }, [])

  const closeContextMenu = useCallback(() => {
    setContextMenu(null)
  }, [])
  
  const handleContextMenuAction = useCallback((action: string, appointmentId: string) => {
    const appointment = myAppointments.find((apt) => apt.id === appointmentId)
    if (!appointment) return

    switch (action) {
      case "view":
        setShowModal(true)
        void loadAppointmentDetails(appointment)
        break
      case "edit":
        setShowModal(true)
        void loadAppointmentDetails(appointment)
        break
      case "duplicate":
        setSelectedAppointment(appointment)
        setShowDuplicateModal(true)
        break
      case "supervision":
        void openSupervisionModal(appointment)
        break
      case "complete":
        updateAppointment(appointmentId, { status: "Completed" })
        void updateAppointmentStatus(appointmentId, "Completed")
        alert.success("Appointment Completed", "The appointment has been marked as completed")
        break
      case "noshow":
        updateAppointment(appointmentId, { status: "NoShow" })
        void updateAppointmentStatus(appointmentId, "NoShow")
        alert.success("No Show", "The appointment has been marked as No Show")
        break
      case "delete":
        deleteAppointment(appointmentId)
        alert.success("Appointment Deleted", "The appointment has been removed")
        break
      case "cancel":
        updateAppointment(appointmentId, { status: "Cancelled" })
        void updateAppointmentStatus(appointmentId, "Cancelled")
        alert.success("Appointment Cancelled", "The appointment has been cancelled")
        break
    }

    setContextMenu(null)
  }, [myAppointments, setSelectedAppointment, deleteAppointment, updateAppointment, alert, loadAppointmentDetails, openSupervisionModal])
  
  
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
      alert.error("Schedule Conflict", "Cannot move appointment to this time slot")
      return
    }
    
    updateAppointment(appointment.id, { startsAt: newStart, endsAt: newEnd })

    alert.success("Appointment Moved", "The appointment has been rescheduled")
  }, [myAppointments, weekDays, rbtId, checkConflict, updateAppointment, alert])
  
 
  const handleStatusChange = useCallback((appointmentId: string, status: AppointmentStatus) => {
    updateAppointment(appointmentId, { status })
    void updateAppointmentStatus(appointmentId, status)
    alert.success("Status Updated", `Appointment marked as ${status}`)
  }, [updateAppointment, alert])
  

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
    showSupervisionModal,
    supervisionAppointment,
    showDetailDrawer,
    modalDefaults,
    contextMenu,
    
    searchQuery,
    filterClient,
    filterStatus,
    filterLocation,
    filterProvider,
    filteredAppointments,
    isLoadingAppointments,
    
    hoveredSlot,
    clickedSlot,
    
    isMobile,
    viewMode,
    
    actions: {
      goToPrevWeek,
      goToNextWeek,
      goToToday,
      setSelectedDay,
      openNewAppointmentModal,
      openDetailDrawer,
      closeDetailDrawer,
      openEditModal,
      openDuplicateModal,
      openSupervisionModal,
      closeSupervisionModal,
      closeModal,
      closeDuplicateModal,
      openContextMenu,
      openMenuAt,
      openSupervisionMenuAt,
      closeContextMenu,
      handleContextMenuAction,
      handleSlotClick,
      setHoveredSlot,
      setSearchQuery,
      setFilterClient,
      setFilterStatus,
      setFilterLocation,
      setFilterProvider,
      handleDragStart,
      handleDragEnd,
      handleStatusChange,
      handleAppointmentSaved,
      getAppointmentPosition,
      hasAppointmentCoveringSlot,
    },
  }
}
