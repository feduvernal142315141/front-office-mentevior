"use client"

import { useFormContext } from "react-hook-form"
import { Checkbox } from "@/components/custom/Checkbox"
import { 
  PermissionModule, 
  PermissionAction,
  permissionsToObject,
  objectToPermissions,
  getModuleActions
} from "@/lib/utils/permissions-new"
import { useState, useEffect } from "react"
import { ChevronRight, Check, Eraser, Eye, ShieldCheck, UserCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"

const CORE_MODULES = [
  { key: PermissionModule.USERS_PROVIDERS, label: "Users" },
  { key: PermissionModule.CLIENTS, label: "Clients" },
  { key: PermissionModule.SCHEDULE, label: "Schedules" },
  { key: PermissionModule.SESSION_NOTE, label: "Session Note" },
  { key: PermissionModule.CLINICAL_MONTHLY, label: "Clinical Monthly" },
  { key: PermissionModule.MONTHLY_SUPERVISIONS, label: "Monthly Supervisions" },
  { key: PermissionModule.SERVICE_LOG, label: "Service Log" },
  { key: PermissionModule.ASSESSMENT, label: "Assessment" },
]

const BEHAVIOR_PLAN = {
  key: PermissionModule.BEHAVIOR_PLAN,
  label: "Behavior Plan",
  children: [
    { key: PermissionModule.MALADAPTIVE_BEHAVIORS, label: "Maladaptive Behaviors" },
    { key: PermissionModule.REPLACEMENT_PROGRAMS, label: "Replacement Programs" },
    { key: PermissionModule.CAREGIVER_PROGRAMS, label: "Caregiver Programs" },
  ]
}

const DATA_COLLECTION = {
  label: "Data Collection",
  children: [
    { key: PermissionModule.DATASHEETS, label: "Datasheets" },
    { key: PermissionModule.ON_SITE_COLLECTION, label: "On-site Collection" },
    { key: PermissionModule.CHARTS, label: "Charts" },
    { key: PermissionModule.DATA_ANALYSIS, label: "Data Analysis" },
    { key: PermissionModule.RAW_DATA, label: "Raw Data" },
  ]
}

const EVENTS = {
  label: "Events",
  children: [
    { key: PermissionModule.APPOINTMENT, label: "Appointment" },
    { key: PermissionModule.SERVICE_PLAN, label: "Service Plan" },
    { key: PermissionModule.SUPERVISION, label: "Supervision" },
  ]
}

const BILLING = {
  label: "Billing",
  children: [
    { key: PermissionModule.SERVICES_PENDING_BILLING, label: "Services Pending Billing" },
    { key: PermissionModule.BILLED_CLAIMS, label: "Billed Claims" },
    { key: PermissionModule.BILLING_CODE, label: "Billing Codes" },
  ]
}

const TEMPLATE_DOCUMENTS = {
  label: "Template Documents",
  children: [
    { key: PermissionModule.SESSION_NOTE_CONFIGURATION, label: "Session Note" },
    { key: PermissionModule.SERVICE_LOG_CONFIGURATION, label: "Service Log" },
    { key: PermissionModule.CLINICAL_MONTHLY_CONFIGURATION, label: "Clinical Monthly" },
    { key: PermissionModule.MONTHLY_SUPERVISIONS_CONFIGURATION, label: "Monthly Supervision" },
    { key: PermissionModule.ASSESSMENT_CONFIGURATION, label: "Assessment" },
  ]
}

const DOCUMENTS = {
  label: "Documents",
  children: [
    { key: PermissionModule.CLINICAL_DOCUMENTS, label: "Clinical Documents" },
    { key: PermissionModule.HR_DOCUMENTS, label: "HR Documents" },
  ]
}

const MY_COMPANY_MODULES = [
  { key: PermissionModule.ROLE, label: "Roles" },
  { key: PermissionModule.ACCOUNT_PROFILE, label: "Account Profile" },
  { key: PermissionModule.PHYSICIANS, label: "Physicians" },
  { key: PermissionModule.SERVICE_PLANS, label: "Service Plans" },
  { key: PermissionModule.MONTHLY_REPORT, label: "Monthly Report" },
  { key: PermissionModule.SIGNATURES_CAREGIVER, label: "Signatures Caregiver" },
  { key: PermissionModule.AGREEMENTS, label: "Agreements" },
  { key: PermissionModule.APPLICANTS, label: "Applicants" },
]

const MY_COMPANY_EXPANDABLES = [
  EVENTS,
  BILLING,
  DATA_COLLECTION,
  TEMPLATE_DOCUMENTS,
  DOCUMENTS,
]

const ACTIONS = [
  { key: PermissionAction.READ, label: "Read" },
  { key: PermissionAction.CREATE, label: "Create" },
  { key: PermissionAction.EDIT, label: "Edit" },
  { key: PermissionAction.DELETE, label: "Delete" },
  { key: PermissionAction.BLOCK, label: "Block" },
] as const

interface PermissionsSelectorProps {
  name?: string
  disabled?: boolean
}

export function PermissionsSelector({
  name = "permissions",
  disabled = false,
}: PermissionsSelectorProps) {
  const { setValue, watch } = useFormContext()
  const currentPermissions = watch(name) as string[] || []
  const [permissionsObj, setPermissionsObj] = useState<Record<string, number>>({})
  const [behaviorPlanExpanded, setBehaviorPlanExpanded] = useState(false)
  const [eventsExpanded, setEventsExpanded] = useState(false)
  const [billingExpanded, setBillingExpanded] = useState(false)
  const [myCompanyExpanded, setMyCompanyExpanded] = useState(false)
  const [dataCollectionExpanded, setDataCollectionExpanded] = useState(false)
  const [templateDocumentsExpanded, setTemplateDocumentsExpanded] = useState(false)
  const [documentsExpanded, setDocumentsExpanded] = useState(false)
  
  useEffect(() => {
    const obj = permissionsToObject(currentPermissions)
    setPermissionsObj(obj)
  }, [currentPermissions])
  
  const toggleAction = (module: string, action: PermissionAction) => {
    if (disabled) return
    
    const currentValue = permissionsObj[module] || 0
    let newValue: number
    
    if (currentValue & action) {
      newValue = currentValue & ~action
    } else {
      newValue = currentValue | action
    }
    
    const newObj = { ...permissionsObj, [module]: newValue }
    setPermissionsObj(newObj)
    
    const newPermissions = objectToPermissions(newObj)
    setValue(name, newPermissions, { shouldDirty: true, shouldValidate: true })
  }
  
  const setModuleAccess = (module: string, value: number) => {
    if (disabled) return
    
    const newObj = { ...permissionsObj, [module]: value }
    setPermissionsObj(newObj)
    
    const newPermissions = objectToPermissions(newObj)
    setValue(name, newPermissions, { shouldDirty: true, shouldValidate: true })
  }
  
  const hasAction = (module: string, action: PermissionAction): boolean => {
    const value = permissionsObj[module] || 0
    return (value & action) === action
  }
  
  const hasFullAccess = (module: string): boolean => {
    return (permissionsObj[module] || 0) === PermissionAction.ALL
  }
  
  const hasAnyPermission = (module: string): boolean => {
    return (permissionsObj[module] || 0) > 0
  }
  
  const toggleAllMyCompany = () => {
    const allChildModules = [
      ...MY_COMPANY_MODULES.map(m => m.key),
      ...EVENTS.children.map(c => c.key),
      ...BILLING.children.map(c => c.key),
      ...DATA_COLLECTION.children.map(c => c.key),
      ...TEMPLATE_DOCUMENTS.children.map(c => c.key),
      ...DOCUMENTS.children.map(c => c.key),
    ]
    
    const allHaveFullAccess = allChildModules.every(m => hasFullAccess(m))
    
    const newObj = { ...permissionsObj }
    allChildModules.forEach(m => {
      newObj[m] = allHaveFullAccess ? 0 : PermissionAction.ALL
    })
    
    setPermissionsObj(newObj)
    const newPermissions = objectToPermissions(newObj)
    setValue(name, newPermissions, { shouldDirty: true, shouldValidate: true })
  }
  
  const allMyCompanyChildModules = [
    ...MY_COMPANY_MODULES.map(m => m.key),
    ...EVENTS.children.map(c => c.key),
    ...BILLING.children.map(c => c.key),
    ...DATA_COLLECTION.children.map(c => c.key),
    ...TEMPLATE_DOCUMENTS.children.map(c => c.key),
    ...DOCUMENTS.children.map(c => c.key),
  ]
  const allMyCompanySelected = allMyCompanyChildModules.every(m => hasFullAccess(m))
  const someMyCompanySelected = allMyCompanyChildModules.some(m => hasAnyPermission(m))
  
  const selectAllPermissions = () => {
    if (disabled) return
    
    const allModules = [
      ...CORE_MODULES.map(m => m.key),
      ...BEHAVIOR_PLAN.children.map(c => c.key),
      ...EVENTS.children.map(c => c.key),
      ...BILLING.children.map(c => c.key),
      ...MY_COMPANY_MODULES.map(m => m.key),
      ...DATA_COLLECTION.children.map(c => c.key),
      ...TEMPLATE_DOCUMENTS.children.map(c => c.key),
      ...DOCUMENTS.children.map(c => c.key),
    ]
    
    const newObj: Record<string, number> = {}
    allModules.forEach(m => {
      newObj[m] = PermissionAction.ALL
    })
    
    setPermissionsObj(newObj)
    const newPermissions = objectToPermissions(newObj)
    setValue(name, newPermissions, { shouldDirty: true, shouldValidate: true })
  }
  
  const clearAllPermissions = () => {
    if (disabled) return
    
    setPermissionsObj({})
    setValue(name, [], { shouldDirty: true, shouldValidate: true })
  }
  
  const applyPreset = (preset: 'readonly' | 'clinical' | 'supervisor') => {
    if (disabled) return
    
    const newObj: Record<string, number> = {}
    
    if (preset === 'readonly') {
      // Read Only: Solo lectura en TODOS los módulos (Core + Behavior Plan + My Company expandables)
      const allModules = [
        ...CORE_MODULES.map(m => m.key),
        ...BEHAVIOR_PLAN.children.map(c => c.key),
        ...EVENTS.children.map(c => c.key),
        ...BILLING.children.map(c => c.key),
        ...DATA_COLLECTION.children.map(c => c.key),
        ...TEMPLATE_DOCUMENTS.children.map(c => c.key),
        ...DOCUMENTS.children.map(c => c.key),
        ...MY_COMPANY_MODULES.map(m => m.key),
      ]
      allModules.forEach(m => {
        newObj[m] = PermissionAction.READ
      })
    } else if (preset === 'clinical') {
      const clinicalModules = [
        PermissionModule.CLIENTS,
        PermissionModule.SCHEDULE,
        PermissionModule.SESSION_NOTE,
        PermissionModule.MONTHLY_SUPERVISIONS,
        PermissionModule.SERVICE_LOG,
        PermissionModule.ASSESSMENT,
        ...BEHAVIOR_PLAN.children.map(c => c.key),
      ]
      clinicalModules.forEach(m => {
        newObj[m] = PermissionAction.ALL
      })
    } else if (preset === 'supervisor') {
      // Supervisor: Full control including delete
      // Full access to operational modules (Core modules + Behavior Plan only)
      const supervisorModules = [
        PermissionModule.USERS_PROVIDERS,
        PermissionModule.CLIENTS,
        PermissionModule.SCHEDULE,
        PermissionModule.SESSION_NOTE,
        PermissionModule.CLINICAL_MONTHLY,
        PermissionModule.MONTHLY_SUPERVISIONS,
        PermissionModule.SERVICE_LOG,
        PermissionModule.ASSESSMENT,
        ...BEHAVIOR_PLAN.children.map(c => c.key),
      ]
      
      // Full control: Read + Create + Edit + Block + Delete
      const supervisorValue = PermissionAction.ALL
      supervisorModules.forEach(m => {
        newObj[m] = supervisorValue
      })
    }
    
    setPermissionsObj(newObj)
    const newPermissions = objectToPermissions(newObj)
    setValue(name, newPermissions, { shouldDirty: true, shouldValidate: true })
  }
  
  const totalModulesWithPermissions = Object.values(permissionsObj).filter(v => v > 0).length
  const totalModulesWithFullAccess = Object.values(permissionsObj).filter(v => v === PermissionAction.ALL).length
  
  // Detect which preset is currently active
  const detectActivePreset = (): 'readonly' | 'clinical' | 'supervisor' | null => {
    // Check Read Only - Todos los módulos con solo READ
    const allModules = [
      ...CORE_MODULES.map(m => m.key),
      ...BEHAVIOR_PLAN.children.map(c => c.key),
      ...EVENTS.children.map(c => c.key),
      ...BILLING.children.map(c => c.key),
      ...DATA_COLLECTION.children.map(c => c.key),
      ...TEMPLATE_DOCUMENTS.children.map(c => c.key),
      ...DOCUMENTS.children.map(c => c.key),
      ...MY_COMPANY_MODULES.map(m => m.key),
    ]
    const matchesReadOnly = allModules.every(m => permissionsObj[m] === PermissionAction.READ) &&
      totalModulesWithPermissions === allModules.length
    if (matchesReadOnly) {
      return 'readonly'
    }

    const clinicalCoreModules = [
      PermissionModule.CLIENTS,
      PermissionModule.SCHEDULE,
      PermissionModule.SESSION_NOTE,
      PermissionModule.MONTHLY_SUPERVISIONS,
      PermissionModule.SERVICE_LOG,
      PermissionModule.ASSESSMENT,
    ]
    
    const hasClinicalModules = clinicalCoreModules.every(m => permissionsObj[m] === PermissionAction.ALL)
    
    const hasBehaviorPlanPermissions = BEHAVIOR_PLAN.children.every(c => permissionsObj[c.key] === PermissionAction.ALL)
    
    const hasNoDataCollection = !permissionsObj[PermissionModule.DATASHEETS] && 
                                 !permissionsObj[PermissionModule.ON_SITE_COLLECTION] &&
                                 !permissionsObj[PermissionModule.CHARTS] &&
                                 !permissionsObj[PermissionModule.DATA_ANALYSIS] &&
                                 !permissionsObj[PermissionModule.RAW_DATA]
    
    const hasNoClinicalMonthly = !permissionsObj[PermissionModule.CLINICAL_MONTHLY]
    
    if (hasClinicalModules && hasBehaviorPlanPermissions && hasNoDataCollection && hasNoClinicalMonthly && totalModulesWithPermissions >= 9 && totalModulesWithPermissions <= 12) {
      return 'clinical'
    }
    
    const supervisorValue = PermissionAction.ALL
    
    const supervisorCoreModules = [
      PermissionModule.USERS_PROVIDERS,
      PermissionModule.CLIENTS,
      PermissionModule.SCHEDULE,
      PermissionModule.SESSION_NOTE,
      PermissionModule.CLINICAL_MONTHLY,
      PermissionModule.MONTHLY_SUPERVISIONS,
      PermissionModule.SERVICE_LOG,
      PermissionModule.ASSESSMENT,
    ]
    const supervisorMatchCount = supervisorCoreModules.filter(m => permissionsObj[m] === supervisorValue).length
    
    const hasBehaviorPlanSupervisorPermissions = BEHAVIOR_PLAN.children.every(c => permissionsObj[c.key] === supervisorValue)
    
    const hasNoMyCompanyPermissions = !permissionsObj[PermissionModule.SERVICES_PENDING_BILLING] &&
                                       !permissionsObj[PermissionModule.BILLED_CLAIMS] &&
                                       !permissionsObj[PermissionModule.MONTHLY_REPORT] &&
                                       !permissionsObj[PermissionModule.DATASHEETS] &&
                                       !permissionsObj[PermissionModule.ON_SITE_COLLECTION] &&
                                       !permissionsObj[PermissionModule.CHARTS] &&
                                       !permissionsObj[PermissionModule.DATA_ANALYSIS] &&
                                       !permissionsObj[PermissionModule.RAW_DATA] &&
                                       !permissionsObj[PermissionModule.APPOINTMENT] &&
                                       !permissionsObj[PermissionModule.SERVICE_PLAN] &&
                                       !permissionsObj[PermissionModule.SUPERVISION] &&
                                       MY_COMPANY_MODULES.every(m => !permissionsObj[m.key])
    
    if (supervisorMatchCount >= 6 && hasBehaviorPlanSupervisorPermissions && hasNoMyCompanyPermissions && totalModulesWithPermissions >= 11 && totalModulesWithPermissions <= 14) {
      return 'supervisor'
    }
    
    return null
  }
  
  const activePreset = detectActivePreset()
  const allPermissionsSelected = totalModulesWithFullAccess === [
    ...CORE_MODULES.map(m => m.key),
    ...BEHAVIOR_PLAN.children.map(c => c.key),
    ...EVENTS.children.map(c => c.key),
    ...BILLING.children.map(c => c.key),
    ...MY_COMPANY_MODULES.map(m => m.key),
    ...DATA_COLLECTION.children.map(c => c.key),
    ...TEMPLATE_DOCUMENTS.children.map(c => c.key),
    ...DOCUMENTS.children.map(c => c.key),
  ].length
  
  const getAccessLevelBadge = (moduleKey: string) => {
    const value = permissionsObj[moduleKey] || 0
    const actions = getModuleActions([`${moduleKey}-${value}`], moduleKey)
    
    if (value === 0) return null
    
    if (value === PermissionAction.ALL) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-300 cursor-help transition-all duration-120">
              <Check className="w-3 h-3 mr-1" />
              Full Access
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="left" className="bg-slate-900 text-white">
            All permissions enabled (Read, Create, Edit, Delete, Block)
          </TooltipContent>
        </Tooltip>
      )
    }
    
    const actionCount = actions.length
    let badgeColor = "bg-blue-50 text-blue-700 border-blue-200"
    
    if (actionCount === 4) {
      badgeColor = "bg-cyan-50 text-cyan-700 border-cyan-200"
    } else if (actionCount === 3) {
      badgeColor = "bg-sky-50 text-sky-700 border-sky-200"
    } else if (actionCount === 2) {
      badgeColor = "bg-amber-50 text-amber-700 border-amber-200"
    } else if (actionCount === 1) {
      badgeColor = "bg-slate-100 text-slate-700 border-slate-300"
    }
    
    const actionNames = actions.map((a: PermissionAction) => {
      if (a === PermissionAction.READ) return "Read"
      if (a === PermissionAction.CREATE) return "Create"
      if (a === PermissionAction.EDIT) return "Edit"
      if (a === PermissionAction.DELETE) return "Delete"
      if (a === PermissionAction.BLOCK) return "Block"
      return ""
    }).filter(Boolean).join(", ")
    
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`${badgeColor} cursor-help transition-all duration-120`}>
            Limited
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="left" className="bg-slate-900 text-white">
          {actionNames}
        </TooltipContent>
      </Tooltip>
    )
  }
  
  const renderExpandableWithRealChildren = (
    module: { label: string; children: { key: PermissionModule; label: string }[] },
    isExpanded: boolean,
    toggleExpanded: () => void
  ) => {
    const childrenWithPermissions = module.children.filter(c => hasAnyPermission(c.key))
    const allChildrenHavePermission = childrenWithPermissions.length === module.children.length && childrenWithPermissions.length > 0
    const someChildrenHavePermission = childrenWithPermissions.length > 0
    
    const toggleAllChildren = (checked: boolean) => {
      const newObj = { ...permissionsObj }
      module.children.forEach(child => {
        newObj[child.key] = checked ? PermissionAction.ALL : 0
      })
      setPermissionsObj(newObj)
      const newPermissions = objectToPermissions(newObj)
      setValue(name, newPermissions, { shouldDirty: true, shouldValidate: true })
    }
    
    return (
      <>
        <tr className={cn(
          "transition-all duration-150",
          someChildrenHavePermission && "bg-blue-50/30",
          "hover:bg-slate-50/80 hover:shadow-[inset_0_0_0_1px_rgba(148,163,184,0.1)]"
        )}>
          <td className="px-6 py-3">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={allChildrenHavePermission}
                indeterminate={someChildrenHavePermission && !allChildrenHavePermission}
                onCheckedChange={toggleAllChildren}
                disabled={disabled}
                size="sm"
              />
              <button
                type="button"
                onClick={toggleExpanded}
                className="flex items-center gap-2 text-sm font-medium transition-colors hover:text-[#037ECC]"
              >
                <ChevronRight 
                  className={cn(
                    "w-4 h-4 text-slate-400 transition-transform duration-200",
                    isExpanded && "rotate-90"
                  )} 
                />
                <span className={someChildrenHavePermission ? "text-slate-800" : "text-slate-500"}>
                  {module.label}
                </span>
                <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 text-[10px] px-1.5 py-0">
                  {module.children.length} sub-modules
                </Badge>
              </button>
            </div>
          </td>
          
          <td colSpan={5} className="px-4 py-3 text-center">
          </td>
          
          <td className="px-6 py-3 text-right">
            {allChildrenHavePermission ? (
              <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200">
                <Check className="w-3 h-3 mr-1" />
                All Selected
              </Badge>
            ) : someChildrenHavePermission ? (
              <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
                {childrenWithPermissions.length} of {module.children.length}
              </Badge>
            ) : null}
          </td>
        </tr>
        
        {isExpanded && (
          <>
            {module.children.map((child) => renderModuleRow(child, true))}
          </>
        )}
      </>
    )
  }
  
  const renderModuleRow = (module: { key: PermissionModule; label: string; hasChildren?: boolean }, isChild = false) => {
    const isChecked = hasAnyPermission(module.key)
    const isFull = hasFullAccess(module.key)
    
    return (
      <tr 
        key={module.key}
        className={cn(
          "transition-all duration-120 group",
          isChecked && "bg-blue-50/20",
          "hover:bg-gradient-to-r hover:from-[#037ECC]/5 hover:to-transparent",
          "border-b border-slate-100/50"
        )}
      >
        <td className="py-3 px-6">
          <div className={cn("flex items-center gap-3", isChild && "pl-6")}>
            <Checkbox
              checked={isChecked}
              onCheckedChange={(checked) => {
                setModuleAccess(module.key, checked ? PermissionAction.ALL : 0)
              }}
              disabled={disabled}
              size="sm"
            />
            <span className={cn(
              "text-sm font-medium transition-colors",
              isChecked ? "text-slate-800" : "text-slate-500"
            )}>
              {module.label}
            </span>
            {module.hasChildren && (
              <span className="text-xs text-slate-400 ml-1">
                (has sub-items)
              </span>
            )}
          </div>
        </td>
        
        {ACTIONS.map(({ key: action, label }) => (
          <td key={action} className="px-4 py-3 text-center">
            <div className="flex items-center justify-center">
              <Checkbox
                checked={hasAction(module.key, action)}
                onCheckedChange={() => toggleAction(module.key, action)}
                disabled={disabled}
                size="sm"
              />
            </div>
          </td>
        ))}
        
        <td className="px-6 py-3 text-right">
          {getAccessLevelBadge(module.key)}
        </td>
      </tr>
    )
  }
  
  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-slate-200/50 px-6 py-3 shadow-sm -mt-2 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1">Presets</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => applyPreset('readonly')}
                  disabled={disabled}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5",
                    "text-xs font-medium rounded-lg",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "transition-all duration-150",
                    "shadow-sm hover:shadow",
                    activePreset === 'readonly'
                      ? "bg-blue-500 text-white border-blue-500 ring-2 ring-blue-500/20"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                  )}
                >
                  <Eye className="w-3.5 h-3.5" />
                  Read Only
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-slate-900 text-white">
                View-only access to all modules (Read permission only)
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => applyPreset('clinical')}
                  disabled={disabled}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5",
                    "text-xs font-medium rounded-lg",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "transition-all duration-150",
                    "shadow-sm hover:shadow",
                    activePreset === 'clinical'
                      ? "bg-purple-500 text-white border-purple-500 ring-2 ring-purple-500/20"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700"
                  )}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Clinical RBT
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-slate-900 text-white">
                Default permissions for RBT clinical staff
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => applyPreset('supervisor')}
                  disabled={disabled}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5",
                    "text-xs font-medium rounded-lg",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "transition-all duration-150",
                    "shadow-sm hover:shadow",
                    activePreset === 'supervisor'
                      ? "bg-emerald-500 text-white border-emerald-500 ring-2 ring-emerald-500/20"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700"
                  )}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Supervisor
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-slate-900 text-white">
                Can create, edit, and supervise but not delete critical data
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={clearAllPermissions}
              disabled={disabled || totalModulesWithPermissions === 0}
              className="
                inline-flex items-center gap-1.5 px-3 py-1.5 
                text-xs font-medium text-slate-600
                bg-white border border-slate-200 rounded-lg
                hover:bg-red-50 hover:border-red-200 hover:text-red-700
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-150
                shadow-sm hover:shadow
              "
            >
              <Eraser className="w-3.5 h-3.5" />
              Clear
            </button>
            <button
              type="button"
              onClick={selectAllPermissions}
              disabled={disabled}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5",
                "text-xs font-medium rounded-lg",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-all duration-150",
                "shadow-sm hover:shadow-md",
                allPermissionsSelected
                  ? "bg-gradient-to-r from-[#037ECC] to-[#0369a8] text-white ring-2 ring-[#037ECC]/20"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-[#037ECC]/5 hover:border-[#037ECC]/30 hover:text-[#037ECC]"
              )}
            >
              <Check className="w-3.5 h-3.5" />
              Select All
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200">
          <h3 className="text-base font-semibold text-slate-800">Core Modules</h3>
          <p className="text-xs text-slate-500 mt-1">Configure permissions for main system modules</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200/60 bg-slate-50/30">
                <th className="px-6 py-3 text-left text-xs font-medium text-[#037ECC]/80 uppercase tracking-wider">
                  Module Name
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-[#037ECC]/80 uppercase tracking-wider">
                  Read
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-[#037ECC]/80 uppercase tracking-wider">
                  Create
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-[#037ECC]/80 uppercase tracking-wider">
                  Edit
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-[#037ECC]/80 uppercase tracking-wider">
                  Delete
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-[#037ECC]/80 uppercase tracking-wider">
                  Block
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-[#037ECC]/80 uppercase tracking-wider">
                  Access Level
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {CORE_MODULES.map((module) => renderModuleRow(module))}
              
              {renderExpandableWithRealChildren(
                BEHAVIOR_PLAN,
                behaviorPlanExpanded,
                () => setBehaviorPlanExpanded(!behaviorPlanExpanded)
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="w-full px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMyCompanyExpanded(!myCompanyExpanded)}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <ChevronRight 
              className={cn(
                "w-5 h-5 text-slate-400 transition-transform duration-200",
                myCompanyExpanded && "rotate-90"
              )} 
            />
            <div className="text-left">
              <h3 className="text-base font-semibold text-slate-800">My Company</h3>
              <p className="text-xs text-slate-500 mt-1">
                Configure permissions for company management modules
              </p>
            </div>
          </button>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (disabled) return
                const newObj = { ...permissionsObj }
                allMyCompanyChildModules.forEach((m: string) => {
                  newObj[m] = 0
                })
                setPermissionsObj(newObj)
                const newPermissions = objectToPermissions(newObj)
                setValue(name, newPermissions, { shouldDirty: true, shouldValidate: true })
              }}
              disabled={disabled || !someMyCompanySelected}
              className="
                inline-flex items-center gap-1.5 px-2.5 py-1.5 
                text-xs font-medium text-slate-600
                bg-white border border-slate-200 rounded-lg
                hover:bg-red-50 hover:border-red-200 hover:text-red-700
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-150
                shadow-sm hover:shadow
              "
            >
              <Eraser className="w-3 h-3" />
              Clear
            </button>
            <button
              type="button"
              onClick={() => toggleAllMyCompany()}
              disabled={disabled}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1.5",
                "text-xs font-medium rounded-lg",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-all duration-150",
                "shadow-sm hover:shadow-md",
                allMyCompanySelected
                  ? "bg-gradient-to-r from-[#037ECC] to-[#0369a8] text-white ring-2 ring-[#037ECC]/20"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-[#037ECC]/5 hover:border-[#037ECC]/30 hover:text-[#037ECC]"
              )}
            >
              <Check className="w-3 h-3" />
              Select All
            </button>
          </div>
        </div>
        
        {myCompanyExpanded && (
          <div className="animate-in slide-in-from-top-2 duration-200">
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200/60 bg-slate-50/30">
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#037ECC]/80 uppercase tracking-wider">
                      Module Name
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-[#037ECC]/80 uppercase tracking-wider">
                      Read
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-[#037ECC]/80 uppercase tracking-wider">
                      Create
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-[#037ECC]/80 uppercase tracking-wider">
                      Edit
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-[#037ECC]/80 uppercase tracking-wider">
                      Delete
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-[#037ECC]/80 uppercase tracking-wider">
                      Block
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-[#037ECC]/80 uppercase tracking-wider">
                      Access Level
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {renderExpandableWithRealChildren(
                    EVENTS,
                    eventsExpanded,
                    () => setEventsExpanded(!eventsExpanded)
                  )}
                  {renderExpandableWithRealChildren(
                    BILLING,
                    billingExpanded,
                    () => setBillingExpanded(!billingExpanded)
                  )}
                  {renderExpandableWithRealChildren(
                    DATA_COLLECTION, 
                    dataCollectionExpanded, 
                    () => setDataCollectionExpanded(!dataCollectionExpanded)
                  )}
                  {renderExpandableWithRealChildren(
                    TEMPLATE_DOCUMENTS, 
                    templateDocumentsExpanded, 
                    () => setTemplateDocumentsExpanded(!templateDocumentsExpanded)
                  )}
                  {renderExpandableWithRealChildren(
                    DOCUMENTS,
                    documentsExpanded,
                    () => setDocumentsExpanded(!documentsExpanded)
                  )}
                  
                  {MY_COMPANY_MODULES.map((module) => renderModuleRow(module))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="bg-blue-50/50 border border-blue-200/50 rounded-lg px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-blue-800">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span>
            <strong>{Object.values(permissionsObj).filter(v => v > 0).length}</strong> modules with permissions • 
            <strong className="ml-2">{Object.values(permissionsObj).filter(v => v === PermissionAction.ALL).length}</strong> with full access
          </span>
        </div>
      </div>
    </div>
  )
}
