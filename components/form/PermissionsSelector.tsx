"use client"

import { useFormContext } from "react-hook-form"
import { Checkbox } from "@/components/custom/Checkbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  PermissionModule, 
  PermissionAction,
  permissionsToObject,
  objectToPermissions
} from "@/lib/utils/permissions-new"
import { useState, useEffect } from "react"
import { 
  ChevronDown, 
  Shield, 
  UserCog,
  Users,
  CalendarCheck,
  NotebookPen,
  Hospital,
  CalendarClock,
  ClipboardList,
  ClipboardCheck,
  TrendingUp,
  Briefcase,
  DollarSign,
  UserPlus,
  Settings as SettingsIcon,
} from "lucide-react"

const MODULE_GROUPS = {
  main: {
    label: "Core Operations",
    description: "Essential day-to-day capabilities",
    icon: Shield,
    defaultExpanded: true,
    modules: [
      { key: PermissionModule.USERS_PROVIDERS, label: "Users & Providers", icon: UserCog },
      { key: PermissionModule.ROLE, label: "Roles & Permissions", icon: Shield },
      { key: PermissionModule.CLIENTS, label: "Clients", icon: Users },
      { key: PermissionModule.SCHEDULE, label: "Schedules", icon: CalendarCheck },
    ]
  },
  clinical: {
    label: "Clinical Services",
    description: "Patient care and clinical documentation",
    icon: Hospital,
    defaultExpanded: false,
    modules: [
      { key: PermissionModule.SESSION_NOTE, label: "Session Notes", icon: NotebookPen },
      { key: PermissionModule.ASSESSMENT, label: "Assessments", icon: ClipboardCheck },
      { key: PermissionModule.BEHAVIOR_PLAN, label: "Behavior Plans", icon: TrendingUp },
      { key: PermissionModule.CLINICAL_MONTHLY, label: "Clinical Monthly", icon: Hospital },
      { key: PermissionModule.MONTHLY_SUPERVISIONS, label: "Monthly Supervisions", icon: CalendarClock },
      { key: PermissionModule.SERVICE_LOG, label: "Service Log", icon: ClipboardList },
    ]
  },
  admin: {
    label: "Administrative",
    description: "Business operations and configuration",
    icon: SettingsIcon,
    defaultExpanded: false,
    modules: [
      { key: PermissionModule.MY_COMPANY, label: "My Company", icon: Briefcase },
      { key: PermissionModule.BILLING, label: "Billing", icon: DollarSign },
      { key: PermissionModule.APPLICANTS, label: "Applicants", icon: UserPlus },
      { key: PermissionModule.CONFIGURATION, label: "Configuration", icon: SettingsIcon },
    ]
  }
} as const

const ACTIONS = [
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
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(Object.entries(MODULE_GROUPS).filter(([_, g]) => g.defaultExpanded).map(([key]) => key))
  )
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

  const setGroupAccess = (groupKey: string, value: number) => {
    if (disabled) return
    
    const group = MODULE_GROUPS[groupKey as keyof typeof MODULE_GROUPS]
    const newObj = { ...permissionsObj }
    
    group.modules.forEach(({ key: module }) => {
      newObj[module] = value
    })
    
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

  const getGroupStats = (groupKey: string) => {
    const group = MODULE_GROUPS[groupKey as keyof typeof MODULE_GROUPS]
    const modulesWithAccess = group.modules.filter(({ key }) => (permissionsObj[key] || 0) > 0).length
    const fullAccess = group.modules.filter(({ key }) => permissionsObj[key] === PermissionAction.ALL).length
    return { modulesWithAccess, fullAccess, total: group.modules.length }
  }
  
  const toggleGroup = (groupKey: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey)
    } else {
      newExpanded.add(groupKey)
    }
    setExpandedGroups(newExpanded)
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
  
  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Shield className="w-5 h-5 text-blue-700" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Role Capabilities Summary</h3>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-700">
                <span className="font-semibold text-blue-700">{stats.modulesWithAccess}</span> modules enabled
              </span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-700">
                <span className="font-semibold text-green-700">{stats.fullAccess}</span> full access
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        {Object.entries(MODULE_GROUPS).map(([groupKey, group]) => {
          const isExpanded = expandedGroups.has(groupKey)
          const groupStats = getGroupStats(groupKey)
          const Icon = group.icon
          
          return (
            <div
              key={groupKey}
              className={`
                border rounded-xl overflow-hidden 
                transition-all duration-300 ease-out
                ${isExpanded 
                  ? 'border-blue-200 shadow-[0_4px_16px_rgba(37,99,235,0.12)] ring-2 ring-blue-50' 
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]'
                }
              `}
            >
              <button
                type="button"
                onClick={() => toggleGroup(groupKey)}
                className={`
                  w-full flex items-center gap-4 p-5 text-left 
                  transition-all duration-200
                  ${isExpanded ? 'bg-blue-50/30' : 'hover:bg-gray-50/80'}
                `}
                disabled={disabled}
              >
                <div className="p-2.5 rounded-lg bg-gray-100">
                  <Icon className="w-5 h-5 text-gray-600" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-gray-900">
                    {group.label}
                  </h3>
                  <p className="text-xs text-gray-600 mt-0.5">{group.description}</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs font-medium text-gray-700">
                      {groupStats.modulesWithAccess} / {groupStats.total} enabled
                    </div>
                    {groupStats.fullAccess > 0 && (
                      <div className="text-xs text-green-700">
                        {groupStats.fullAccess} full access
                      </div>
                    )}
                  </div>
                  
                  <ChevronDown 
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </button>
              
              {isExpanded && (
                <div className="border-t border-gray-200 p-4 space-y-3 bg-gray-50/30">
                  {/* Quick Actions */}
                  <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                    <span className="text-xs font-medium text-gray-600">Quick Actions</span>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setGroupAccess(groupKey, PermissionAction.ALL)}
                        disabled={disabled}
                        className="text-xs h-7 px-3 text-green-700 hover:text-green-800 hover:bg-green-50"
                      >
                        Full Access
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setGroupAccess(groupKey, 0)}
                        disabled={disabled}
                        className="text-xs h-7 px-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                      >
                        No Access
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {group.modules.map(({ key: module, label, icon: ModuleIcon }) => {
                      const isChecked = hasAnyPermission(module)
                      const hasAll = (permissionsObj[module] || 0) === PermissionAction.ALL
                      const isModuleExpanded = expandedModules.has(module)
                      
                      return (
                        <div
                          key={module}
                          className="border border-gray-200 rounded-lg bg-white hover:border-gray-300 hover:shadow-sm transition-all"
                        >
            
                          <div className="flex items-center gap-3 p-3">
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={(checked) => {
                                setModuleAccess(module, checked ? PermissionAction.ALL : 0)
                              }}
                              disabled={disabled}
                            />
                            
                            <button
                              type="button"
                              onClick={() => toggleModule(module)}
                              className="flex items-center gap-2 flex-1 min-w-0 text-left"
                              disabled={disabled}
                            >
                              <ModuleIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                              <span className="text-sm font-medium text-gray-900 truncate">
                                {label}
                              </span>
                            </button>
                            
                            <div className="flex items-center gap-2">
                              {isChecked && (
                                <Badge 
                                  variant={hasAll ? "default" : "secondary"}
                                  className={`text-xs ${hasAll ? 'bg-green-100 text-green-800' : ''}`}
                                >
                                  {hasAll ? 'Full' : 'Custom'}
                                </Badge>
                              )}
                              
                              <ChevronDown 
                                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                                  isModuleExpanded ? 'rotate-180' : ''
                                }`}
                              />
                            </div>
                          </div>
        
                          {isModuleExpanded && (
                            <div className="px-3 pb-3 pt-2 border-t border-gray-100 bg-gray-50/50">
                              <div className="flex justify-around">
                                {ACTIONS.map(({ key: action, label: actionLabel }) => {
                                  const isActionChecked = hasAction(module, action)
                                  
                                  return (
                                    <Checkbox
                                      key={action}
                                      checked={isActionChecked}
                                      onCheckedChange={() => toggleAction(module, action)}
                                      disabled={disabled}
                                      label={actionLabel}
                                      size="sm"
                                    />
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
