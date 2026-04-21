"use client"

import { useEffect, useMemo, useState } from "react"
import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/custom/Button"
import { Switch } from "@/components/ui/switch"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerBody,
  DrawerFooter,
} from "@/components/ui/drawer"
import { formatBillingCodeDisplay } from "@/lib/utils/billing-code-display"
import { useToggleCompanyServiceStatus } from "@/lib/modules/services/hooks/use-toggle-company-service-status"
import { useCompanyServiceById } from "@/lib/modules/services/hooks/use-company-service-by-id"
import type { CompanyServiceListItem } from "@/lib/types/company-service.types"

interface ServiceDetailDrawerProps {
  service: CompanyServiceListItem | null
  isOpen: boolean
  onClose: () => void
  onUpdated: () => void
}

export function ServiceDetailDrawer({
  service,
  isOpen,
  onClose,
  onUpdated,
}: ServiceDetailDrawerProps) {
  const { toggleStatus, isLoading } = useToggleCompanyServiceStatus()
  const {
    service: serviceDetails,
    isLoading: isLoadingDetails,
    fetchById,
    clear,
  } = useCompanyServiceById()
  const [active, setActive] = useState(false)

  useEffect(() => {
    setActive(Boolean(service?.active))
  }, [service])

  useEffect(() => {
    if (!isOpen || !service?.id) return
    void fetchById(service.id)
  }, [isOpen, service?.id, fetchById])

  useEffect(() => {
    if (!isOpen) clear()
  }, [isOpen, clear])

  const statusLabel = useMemo(() => (active ? "Active" : "Inactive"), [active])

  const handleToggle = async (checked: boolean) => {
    if (!service) return
    setActive(checked)
    const result = await toggleStatus({ id: service.id, active: checked })
    if (!result) {
      setActive(!checked)
      return
    }
    onUpdated()
  }

  if (!service) return null
  const displayService = serviceDetails ?? service

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()} direction="right">
      <DrawerContent className="w-full sm:max-w-2xl bg-white shadow-2xl">
        <DrawerHeader className="sticky top-0 z-10 bg-white">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <DrawerTitle className="text-xl font-semibold text-slate-900">{displayService.name}</DrawerTitle>
              <DrawerDescription className="text-sm text-slate-600">
                Informational service configuration. Activating this service will sync predefined credentials and billing codes.
              </DrawerDescription>
            </div>
            <DrawerClose asChild>
              <button
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Close service details"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <DrawerBody className="space-y-6">
          <div className="space-y-2">
            <Badge
              variant="outline"
              className={
                active
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-slate-50 text-slate-600"
              }
            >
              {statusLabel}
            </Badge>
            <p className="text-sm text-slate-700 leading-relaxed">{displayService.description}</p>
          </div>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-800">Allowed Credentials</h3>
            {isLoadingDetails ? (
              <p className="text-sm text-slate-500">Loading service details...</p>
            ) : displayService.allowedCredentials.length === 0 ? (
              <p className="text-sm text-slate-500">This service starts without predefined credentials.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {displayService.allowedCredentials.map((credential) => (
                  <Badge
                    key={credential.id}
                    variant="outline"
                    className="border-blue-200 bg-blue-50 text-blue-700"
                  >
                    {credential.name}
                  </Badge>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-800">Allowed Billing Codes</h3>
            <div className="flex flex-wrap gap-2">
              {displayService.allowedBillingCodes.map((billingCode) => (
                <Badge
                  key={billingCode.id}
                  variant="outline"
                  className={
                    billingCode.type === "CPT"
                      ? "border-purple-200 bg-purple-50 text-purple-700"
                      : "border-slate-200 bg-slate-50 text-slate-600"
                  }
                >
                  {formatBillingCodeDisplay({
                    type: billingCode.type,
                    code: billingCode.code,
                    modifier: billingCode.modifier,
                  })}
                </Badge>
              ))}
            </div>
          </section>
        </DrawerBody>

        <DrawerFooter className="justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-800">Service Activated</p>
            <p className="text-xs text-slate-500">
              Managed records imported from services are read-only. Custom records remain independent.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={active}
              disabled={isLoading}
              onCheckedChange={(checked) => {
                void handleToggle(checked)
              }}
            />
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
