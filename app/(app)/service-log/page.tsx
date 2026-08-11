"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ClipboardList } from "lucide-react"
import { usePermission } from "@/lib/hooks/use-permission"
import { PermissionModule } from "@/lib/utils/permissions-new"
import { GenerateServiceLogsCard } from "./components/GenerateServiceLogsCard"
import { ServiceLogTable } from "./components/ServiceLogTable"

export default function ServiceLogPage() {
  const permission = usePermission()
  const canCreate = permission.create(PermissionModule.SERVICE_LOG)

  const [reloadKey, setReloadKey] = useState(0)
  const timersRef = useRef<number[]>([])

  useEffect(() => {
    return () => timersRef.current.forEach((t) => window.clearTimeout(t))
  }, [])

  // La generación es asíncrona: el POST solo confirma el encolado. Se refresca
  // al toque y de nuevo a los pocos segundos para capturar lo que el backend
  // persiste en segundo plano.
  const handleGenerated = useCallback(() => {
    setReloadKey((k) => k + 1)
    timersRef.current.push(
      window.setTimeout(() => setReloadKey((k) => k + 1), 4000),
      window.setTimeout(() => setReloadKey((k) => k + 1), 10000),
    )
  }, [])

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 border border-[#037ECC]/20">
            <ClipboardList className="h-8 w-8 text-[#037ECC]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-transparent">
              Service Log
            </h1>
            <p className="text-slate-600 mt-1">
              Billing support documents generated from locked session notes
            </p>
          </div>
        </div>

        <div className="space-y-5">
          {canCreate && <GenerateServiceLogsCard onGenerated={handleGenerated} />}
          <ServiceLogTable reloadKey={reloadKey} />
        </div>
      </div>
    </div>
  )
}
