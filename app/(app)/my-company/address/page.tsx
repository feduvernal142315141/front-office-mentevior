"use client"

import { MapPin, Plus } from "lucide-react"
import { Button } from "@/components/custom/Button"
import { useRouter } from "next/navigation"
import { AddressesTable } from "./components/AddressesTable"

export default function AddressPage() {
  const router = useRouter()

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 border border-[#037ECC]/20">
              <MapPin className="h-8 w-8 text-[#037ECC]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-transparent">
                Addresses
              </h1>
              <p className="text-slate-600 mt-1">Manage company addresses</p>
            </div>
          </div>

          <Button
            variant="primary"
            onClick={() => router.push("/my-company/address/create")}
            className="gap-2 flex items-center"
          >
            <Plus className="w-4 h-4" />
            New Address
          </Button>
        </div>

        <AddressesTable />
      </div>
    </div>
  )
}
