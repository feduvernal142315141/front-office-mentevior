"use client"

import { useFormContext } from "react-hook-form"
import { Checkbox } from "@/components/custom/Checkbox"
import { 
  PermissionModule, 
  PermissionAction,
  permissionsToObject,
  objectToPermissions
} from "@/lib/utils/permissions-new"
import { useState, useEffect } from "react"
import { 
  ChevronDown,
  Check,
  Plus,
  Pencil,
  Trash2,
  Ban,
  MoreHorizontal,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { navItems } from "@/components/layout/nav-items"

type DesignMode = "standard" | "premium"
const DESIGN_MODE: DesignMode = "premium"


const ROUTE_TO_PERMISSION_MAP: Record<string, PermissionModule | null> = {
  '/dashboard': null, 
  '/users': PermissionModule.USERS_PROVIDERS,
  '/clients': PermissionModule.CLIENTS,
  '/schedules': PermissionModule.SCHEDULE,
  '/session-note': PermissionModule.SESSION_NOTE,
  '/clinical-monthly': PermissionModule.CLINICAL_MONTHLY,
  '/monthly-supervisions': PermissionModule.MONTHLY_SUPERVISIONS,
  '/service-log': PermissionModule.SERVICE_LOG,
  '/assessment': PermissionModule.ASSESSMENT,
  '/behavior-plan': PermissionModule.BEHAVIOR_PLAN,
  
  '/my-company': PermissionModule.MY_COMPANY,
  '/data-collection': PermissionModule.DATA_COLLECTION,
  '/signatures-caregiver': PermissionModule.SIGNATURES_CAREGIVER,
  '/template-documents': PermissionModule.TEMPLATE_DOCUMENTS,
  '/clinical-documents': PermissionModule.CLINICAL_DOCUMENTS,
  '/hr-documents': PermissionModule.HR_DOCUMENTS,
  '/agreements': PermissionModule.AGREEMENTS,
  '/applicants': PermissionModule.APPLICANTS,
  
  '/behavior-plan/maladaptive-behaviors': PermissionModule.MALADAPTIVE_BEHAVIORS,
  '/behavior-plan/replacement-programs': PermissionModule.REPLACEMENT_PROGRAMS,
  '/behavior-plan/caregiver-programs': PermissionModule.CAREGIVER_PROGRAMS,
  
  '/roles': PermissionModule.ROLE,
  '/my-company/account-profile': null, 
  '/my-company/address': null, 
  '/my-company/billing': PermissionModule.BILLING,
  '/my-company/credentials': null, 
  '/my-company/events': null, 
  '/my-company/physicians': null, 
  '/my-company/service-plans': null, 
  
  '/data-collection/datasheets': null,
  '/data-collection/onsite-collection': null,
  '/data-collection/charts': null, 
  '/data-collection/data-analysis': null,
  '/data-collection/raw-data': null, 
  
  '/signatures-caregiver/check': null,
  '/signatures-caregiver/sign': null, 
  
  // Template Documents sub-modules
  '/template-documents/session-note': null,
  '/template-documents/service-log': null, 
  '/template-documents/clinical-monthly': null,
  '/template-documents/monthly-supervision': null, 
  '/template-documents/assessment': null, 
}

// Build modules list from nav-items with proper permission mapping
const ALL_MODULES = navItems
  .filter(item => item.section === "main" || item.section === "system")
  .map(item => {
    const permissionKey = ROUTE_TO_PERMISSION_MAP[item.href]
    
    // Skip modules that don't have permissions (like dashboard)
    if (!permissionKey) return null
    
    return {
      key: permissionKey,
      label: item.label,
      hasChildren: !!item.children && item.children.length > 0,
      children: item.children
        ?.map(child => {
          const childPermissionKey = ROUTE_TO_PERMISSION_MAP[child.href]
          // Skip children without permissions
          if (!childPermissionKey) return null
          
          return {
            key: childPermissionKey,
            label: child.label,
          }
        })
        .filter(Boolean) as { key: PermissionModule; label: string }[] || []
    }
  })
  .filter(Boolean) as {
    key: PermissionModule
    label: string
    hasChildren: boolean
    children: { key: PermissionModule; label: string }[]
  }[]

const ACTIONS = [
  { key: PermissionAction.CREATE, label: "Create", icon: "Plus" as const },
  { key: PermissionAction.EDIT, label: "Edit", icon: "Pencil" as const },
  { key: PermissionAction.DELETE, label: "Delete", icon: "Trash2" as const },
  { key: PermissionAction.BLOCK, label: "Block", icon: "Ban" as const },
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
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  
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
  
  const hasAnyPermission = (module: string): boolean => {
    return (permissionsObj[module] || 0) > 0
  }
  
  const hasFullAccess = (module: string): boolean => {
    return (permissionsObj[module] || 0) === PermissionAction.ALL
  }
  
  const toggleModule = (module: string) => {
    const newExpanded = new Set(expandedModules)
    if (newExpanded.has(module)) {
      newExpanded.delete(module)
    } else {
      newExpanded.add(module)
    }
    setExpandedModules(newExpanded)
  }
  
  const getStats = () => {
    const modulesWithAccess = Object.values(permissionsObj).filter(v => v > 0).length
    const fullAccess = Object.values(permissionsObj).filter(v => v === PermissionAction.ALL).length
    return { modulesWithAccess, fullAccess }
  }
  
  const stats = getStats()
  
  const IconComponent = {
    Plus,
    Pencil,
    Trash2,
    Ban,
  }
  
  // ===================================================
  // PREMIUM MODE: Enterprise affordances
  // ===================================================
  if (DESIGN_MODE === "premium") {
    return (
      <div className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-slate-50 to-slate-50/30 rounded-xl border border-slate-200/60">
            <span className="text-sm font-semibold text-slate-700 tracking-tight">Permission Summary</span>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#037ECC]" />
                <span className="text-slate-600">
                  <span className="font-semibold text-[#037ECC]">{stats.modulesWithAccess}</span> active
                </span>
              </div>
              <div className="w-px h-3 bg-slate-300" />
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-slate-600">
                  <span className="font-semibold text-emerald-600">{stats.fullAccess}</span> full access
                </span>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 px-1">
            Hover over a module to customize its permissions
          </p>
        </div>
        
        {/* Modules List - PREMIUM with affordances */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
          <div className="divide-y divide-slate-50">
            {ALL_MODULES.map((module) => {
              const isChecked = hasAnyPermission(module.key)
              const hasAll = hasFullAccess(module.key)
              const isExpanded = expandedModules.has(module.key)
              const hasChildren = module.hasChildren
              
              return (
                <div key={module.key} className="group/row relative">
                  {/* LEFT BORDER - appears on hover (affordance) */}
                  <div className={cn(
                    "absolute left-0 top-0 bottom-0 w-0.5 bg-[#037ECC] transition-all duration-200 opacity-0 group-hover/row:opacity-100"
                  )} />
                  
                  {/* Main Module Row - CLICKABLE ENTIRE ROW */}
                  <div 
                    className={cn(
                      "flex items-center gap-3 px-5 py-4 transition-all duration-200 cursor-pointer",
                      "hover:bg-[#037ECC]/[0.02] hover:pl-6",
                      hasChildren && "bg-slate-50/30"
                    )}
                    onClick={() => {
                      if (hasChildren) {
                        toggleModule(module.key)
                      } else {
                        setModuleAccess(module.key, isChecked ? 0 : PermissionAction.ALL)
                      }
                    }}
                  >
                    {/* Checkbox - Smaller, less prominent */}
                    <div 
                      className="flex items-center shrink-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        setModuleAccess(module.key, isChecked ? 0 : PermissionAction.ALL)
                      }}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded border flex items-center justify-center transition-all cursor-pointer",
                        isChecked 
                          ? "bg-[#037ECC] border-[#037ECC]" 
                          : "border-slate-300 hover:border-[#037ECC]/40 hover:bg-slate-50"
                      )}>
                        {isChecked && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                    </div>
                    
                    {/* Module Name - PROTAGONIST */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className={cn(
                        "text-sm font-semibold truncate transition-colors",
                        isChecked ? "text-[#037ECC]" : "text-slate-700"
                      )}>
                        {module.label}
                      </span>
                      {hasChildren && (
                        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-slate-200/70 text-[10px] font-medium text-slate-600 transition-transform group-hover/row:scale-105">
                          {module.children.length}
                        </span>
                      )}
                    </div>
                    
                    {/* Hint: Three dots (hidden when actions appear) */}
                    {!hasAll && (
                      <div className={cn(
                        "flex items-center opacity-100 group-hover/row:opacity-0 transition-opacity pointer-events-none",
                        "text-slate-300"
                      )}>
                        <MoreHorizontal className="w-4 h-4" />
                      </div>
                    )}
                    
                    {/* Actions - Appear on hover, icons only */}
                    {!hasAll && (
                      <div 
                        className={cn(
                          "flex items-center gap-1.5 absolute right-24 opacity-0 group-hover/row:opacity-100 transition-all duration-200",
                          "translate-x-2 group-hover/row:translate-x-0"
                        )}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {ACTIONS.map(({ key: action, icon, label }) => {
                          const Icon = IconComponent[icon as keyof typeof IconComponent]
                          const isActive = hasAction(module.key, action)
                          
                          return (
                            <button
                              key={action}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleAction(module.key, action)
                              }}
                              disabled={disabled}
                              title={label}
                              className={cn(
                                "w-7 h-7 rounded-md flex items-center justify-center transition-all duration-150",
                                "hover:scale-110 active:scale-95",
                                isActive
                                  ? "bg-[#037ECC] text-white shadow-sm"
                                  : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                              )}
                            >
                              <Icon className="w-3.5 h-3.5" />
                            </button>
                          )
                        })}
                      </div>
                    )}
                    
                    {/* Status Badge with hover glow */}
                    <div className="w-20 flex justify-end shrink-0">
                      {hasAll ? (
                        <span className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200/50",
                          "transition-all hover:shadow-emerald-200/50 hover:shadow-md"
                        )}
                        title="All permissions enabled"
                        >
                          <Check className="w-3 h-3" />
                          Full
                        </span>
                      ) : isChecked ? (
                        <span className={cn(
                          "px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 text-xs font-medium border border-amber-200/50",
                          "transition-all hover:shadow-amber-200/50 hover:shadow-md"
                        )}
                        title="Some permissions restricted"
                        >
                          Custom
                        </span>
                      ) : null}
                    </div>
                    
                    {/* Expand button with micro-animation */}
                    {hasChildren && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleModule(module.key)
                        }}
                        className="w-6 h-6 shrink-0 rounded-md hover:bg-slate-200/60 transition-all flex items-center justify-center group/chevron"
                      >
                        <ChevronDown 
                          className={cn(
                            "w-4 h-4 text-slate-400 transition-all duration-300 ease-out",
                            "group-hover/chevron:text-[#037ECC]",
                            isExpanded && "rotate-180"
                          )}
                        />
                      </button>
                    )}
                  </div>
                  
                  {/* Children - Premium hierarchy */}
                  {hasChildren && isExpanded && (
                    <div className="bg-gradient-to-b from-slate-50/50 to-white border-t border-slate-100/50">
                      {module.children.map((child, idx) => {
                        const childChecked = hasAnyPermission(child.key)
                        const childHasAll = hasFullAccess(child.key)
                        
                        return (
                          <div
                            key={child.key}
                            className={cn(
                              "group/child relative flex items-center gap-3 px-5 py-3 pl-14 transition-all duration-150",
                              "hover:bg-white/80 cursor-pointer hover:pl-[60px]",
                              idx === module.children.length - 1 && "pb-4"
                            )}
                            onClick={() => setModuleAccess(child.key, childChecked ? 0 : PermissionAction.ALL)}
                          >
                            {/* Línea guía vertical */}
                            <div className="absolute left-7 top-0 bottom-0 w-px bg-gradient-to-b from-slate-200 to-transparent" />
                            
                            {/* LEFT BORDER for children */}
                            <div className={cn(
                              "absolute left-0 top-0 bottom-0 w-0.5 bg-[#037ECC]/50 transition-all duration-200 opacity-0 group-hover/child:opacity-100"
                            )} />
                            
                            {/* Child Checkbox */}
                            <div 
                              className="flex items-center shrink-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                setModuleAccess(child.key, childChecked ? 0 : PermissionAction.ALL)
                              }}
                            >
                              <div className={cn(
                                "w-3.5 h-3.5 rounded border flex items-center justify-center transition-all cursor-pointer",
                                childChecked 
                                  ? "bg-[#037ECC] border-[#037ECC]" 
                                  : "border-slate-300 hover:border-[#037ECC]/40 hover:bg-slate-50"
                              )}>
                                {childChecked && <Check className="w-2 h-2 text-white" />}
                              </div>
                            </div>
                            
                            {/* Child Name */}
                            <div className="flex-1 min-w-0">
                              <span className={cn(
                                "text-xs font-medium truncate transition-colors",
                                childChecked ? "text-slate-700" : "text-slate-500"
                              )}>
                                {child.label}
                              </span>
                            </div>
                            
                            {/* Hint for children */}
                            {!childHasAll && (
                              <div className={cn(
                                "flex items-center opacity-100 group-hover/child:opacity-0 transition-opacity pointer-events-none",
                                "text-slate-300"
                              )}>
                                <MoreHorizontal className="w-3.5 h-3.5" />
                              </div>
                            )}
                            
                            {/* Child Actions */}
                            {!childHasAll && (
                              <div 
                                className={cn(
                                  "flex items-center gap-1.5 absolute right-24 opacity-0 group-hover/child:opacity-100 transition-all duration-200",
                                  "translate-x-2 group-hover/child:translate-x-0"
                                )}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {ACTIONS.map(({ key: action, icon, label }) => {
                                  const Icon = IconComponent[icon as keyof typeof IconComponent]
                                  const isActive = hasAction(child.key, action)
                                  
                                  return (
                                    <button
                                      key={action}
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        toggleAction(child.key, action)
                                      }}
                                      disabled={disabled}
                                      title={label}
                                      className={cn(
                                        "w-6 h-6 rounded flex items-center justify-center transition-all duration-150",
                                        "hover:scale-110 active:scale-95",
                                        isActive
                                          ? "bg-[#037ECC] text-white shadow-sm"
                                          : "bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                                      )}
                                    >
                                      <Icon className="w-3 h-3" />
                                    </button>
                                  )
                                })}
                              </div>
                            )}
                            
                            {/* Child Status Badge */}
                            <div className="w-20 flex justify-end shrink-0">
                              {childHasAll ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-medium border border-emerald-200/50 transition-all hover:shadow-emerald-200/50 hover:shadow-md" title="All permissions enabled">
                                  <Check className="w-2.5 h-2.5" />
                                  Full
                                </span>
                              ) : childChecked ? (
                                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-medium border border-amber-200/50 transition-all hover:shadow-amber-200/50 hover:shadow-md" title="Some permissions restricted">
                                  Custom
                                </span>
                              ) : null}
                            </div>
                            
                            {/* Spacer */}
                            <div className="w-6 shrink-0" />
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }
  
  // ===================================================
  // STANDARD MODE: Always visible, simpler
  // ===================================================
  return (
    <div className="space-y-3">
      {/* Simple Summary */}
      <div className="flex items-center justify-between px-5 py-3 bg-slate-50 rounded-lg border border-slate-200">
        <span className="text-sm font-semibold text-slate-700">Permission Summary</span>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-600">
            <span className="font-semibold text-[#037ECC]">{stats.modulesWithAccess}</span> active
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-600">
            <span className="font-semibold text-emerald-600">{stats.fullAccess}</span> full access
          </span>
        </div>
      </div>
      
      {/* Modules List - STANDARD (always visible) */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
        <div className="divide-y divide-slate-100">
          {ALL_MODULES.map((module) => {
            const isChecked = hasAnyPermission(module.key)
            const hasAll = hasFullAccess(module.key)
            const isExpanded = expandedModules.has(module.key)
            const hasChildren = module.hasChildren
            
            return (
              <div key={module.key} className="group">
                {/* Main Module Row */}
                <div className={cn(
                  "flex items-center gap-3 px-5 py-4 transition-colors",
                  "hover:bg-slate-50",
                  hasChildren && "bg-slate-50/30"
                )}>
                  {/* Checkbox */}
                  <div className="flex items-center shrink-0">
                    <div className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center transition-all cursor-pointer",
                      isChecked 
                        ? "bg-[#037ECC] border-[#037ECC]" 
                        : "border-slate-300 hover:border-[#037ECC]/40"
                    )}
                    onClick={() => setModuleAccess(module.key, isChecked ? 0 : PermissionAction.ALL)}
                    >
                      {isChecked && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                  </div>
                  
                  {/* Module Name */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className={cn(
                      "text-sm font-semibold truncate",
                      isChecked ? "text-[#037ECC]" : "text-slate-700"
                    )}>
                      {module.label}
                    </span>
                    {hasChildren && (
                      <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-slate-200/70 text-[10px] font-medium text-slate-600">
                        {module.children.length}
                      </span>
                    )}
                  </div>
                  
                  {/* Actions - ALWAYS VISIBLE */}
                  {!hasAll && (
                    <div className="flex items-center gap-1.5">
                      {ACTIONS.map(({ key: action, icon, label }) => {
                        const Icon = IconComponent[icon as keyof typeof IconComponent]
                        const isActive = hasAction(module.key, action)
                        
                        return (
                          <button
                            key={action}
                            type="button"
                            onClick={() => toggleAction(module.key, action)}
                            disabled={disabled}
                            title={label}
                            className={cn(
                              "w-7 h-7 rounded-md flex items-center justify-center transition-all",
                              isActive
                                ? "bg-[#037ECC] text-white"
                                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                            )}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </button>
                        )
                      })}
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="w-20 flex justify-end shrink-0">
                    {hasAll ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200/50">
                        <Check className="w-3 h-3" />
                        Full
                      </span>
                    ) : isChecked ? (
                      <span className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 text-xs font-medium border border-amber-200/50">
                        Custom
                      </span>
                    ) : null}
                  </div>
                  
                  {/* Expand button */}
                  {hasChildren && (
                    <button
                      type="button"
                      onClick={() => toggleModule(module.key)}
                      className="w-6 h-6 shrink-0 rounded-md hover:bg-slate-200/60 transition-colors flex items-center justify-center"
                    >
                      <ChevronDown 
                        className={cn(
                          "w-4 h-4 text-slate-400 transition-transform duration-200",
                          isExpanded && "rotate-180"
                        )}
                      />
                    </button>
                  )}
                </div>
                
                {/* Children */}
                {hasChildren && isExpanded && (
                  <div className="bg-slate-50/50 border-t border-slate-100/50">
                    {module.children.map((child, idx) => {
                      const childChecked = hasAnyPermission(child.key)
                      const childHasAll = hasFullAccess(child.key)
                      
                      return (
                        <div
                          key={child.key}
                          className={cn(
                            "flex items-center gap-3 px-5 py-3 pl-14 hover:bg-slate-100/50 transition-colors relative",
                            idx === module.children.length - 1 && "pb-4"
                          )}
                        >
                          <div className="absolute left-7 top-0 bottom-0 w-px bg-slate-200/50" />
                          
                          <div className="flex items-center shrink-0">
                            <div className={cn(
                              "w-3.5 h-3.5 rounded border flex items-center justify-center transition-all cursor-pointer",
                              childChecked 
                                ? "bg-[#037ECC] border-[#037ECC]" 
                                : "border-slate-300 hover:border-[#037ECC]/40"
                            )}
                            onClick={() => setModuleAccess(child.key, childChecked ? 0 : PermissionAction.ALL)}
                            >
                              {childChecked && <Check className="w-2 h-2 text-white" />}
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <span className={cn(
                              "text-xs font-medium truncate",
                              childChecked ? "text-slate-700" : "text-slate-500"
                            )}>
                              {child.label}
                            </span>
                          </div>
                          
                          {!childHasAll && (
                            <div className="flex items-center gap-1.5">
                              {ACTIONS.map(({ key: action, icon, label }) => {
                                const Icon = IconComponent[icon as keyof typeof IconComponent]
                                const isActive = hasAction(child.key, action)
                                
                                return (
                                  <button
                                    key={action}
                                    type="button"
                                    onClick={() => toggleAction(child.key, action)}
                                    disabled={disabled}
                                    title={label}
                                    className={cn(
                                      "w-6 h-6 rounded flex items-center justify-center transition-all",
                                      isActive
                                        ? "bg-[#037ECC] text-white"
                                        : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                                    )}
                                  >
                                    <Icon className="w-3 h-3" />
                                  </button>
                                )
                              })}
                            </div>
                          )}
                          
                          <div className="w-20 flex justify-end shrink-0">
                            {childHasAll ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-medium border border-emerald-200/50">
                                <Check className="w-2.5 h-2.5" />
                                Full
                              </span>
                            ) : childChecked ? (
                              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-medium border border-amber-200/50">
                                Custom
                              </span>
                            ) : null}
                          </div>
                          
                          <div className="w-6 shrink-0" />
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
