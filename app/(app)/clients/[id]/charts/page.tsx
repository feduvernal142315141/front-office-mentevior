"use client"

import { use, useCallback, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, LineChart } from "lucide-react"

import { useClientById } from "@/lib/modules/clients/hooks/use-client-by-id"
import { ClientChartsView } from "./components/ClientChartsView"

interface ClientChartsPageProps {
  params: Promise<{ id: string }>
}

/**
 * Todas las gráficas del service plan del cliente en una sola pantalla.
 * Es de sólo lectura: para capturar datos o cambiar la configuración se entra
 * al item, que es donde vive el datasheet.
 */
export default function ClientChartsPage({ params }: ClientChartsPageProps) {
  const { id } = use(params)
  const { client } = useClientById(id)

  const router = useRouter()
  const searchParams = useSearchParams()

  // La pantalla de configuración se arma a partir del `spId` de la URL: sin él
  // muestra "No service plan assigned" aunque el cliente tenga uno. Lo traemos
  // en la URL al entrar, y si se llegó acá por link directo lo completa la
  // vista cuando resuelve el service plan del cliente.
  const [spId, setSpId] = useState<string | null>(() => searchParams.get("spId"))

  const goToConfiguration = useCallback(() => {
    router.push(spId ? `/clients/${id}/configuration?spId=${spId}` : `/clients/${id}/configuration`)
  }, [id, router, spId])

  const clientName = [client?.firstName, client?.lastName].filter(Boolean).join(" ")

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 pb-24">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-8 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={goToConfiguration}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all hover:-translate-y-0.5 hover:border-[#037ECC]/40 hover:text-[#037ECC] hover:shadow-md"
            aria-label="Back to configuration"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="rounded-xl border border-[#037ECC]/20 bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 p-3">
            <LineChart className="h-7 w-7 text-[#037ECC]" />
          </div>

          <div className="min-w-0">
            <h1 className="bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-2xl font-bold text-transparent">
              Charts
            </h1>
            <p className="mt-1 truncate text-slate-600">
              {clientName ? `${clientName} — all service plan charts` : "All service plan charts"}
            </p>
          </div>
        </div>

        <ClientChartsView clientId={id} clientServicePlanId={spId} onServicePlanResolved={setSpId} />
      </div>
    </div>
  )
}
