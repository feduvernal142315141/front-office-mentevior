"use client"

import { useRef, useState } from "react"
import { FileText, Plus } from "lucide-react"
import { Button } from "@/components/custom/Button"
import { ServicePlansTable, type ServicePlansTableRef } from "./components/ServicePlansTable"
import { CreateServicePlanModal } from "./components/CreateServicePlanModal"
import type { CompanyServicePlan } from "@/lib/types/company-service-plan.types"

export default function ServicePlansPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<CompanyServicePlan | null>(null)
  const tableRef = useRef<ServicePlansTableRef>(null)

  const handleCreated = () => {
    tableRef.current?.refetch()
  }

  const handleOpenCreate = () => {
    setEditingPlan(null)
    setIsCreateModalOpen(true)
  }

  const handleEdit = (plan: CompanyServicePlan) => {
    setEditingPlan(plan)
    setIsCreateModalOpen(true)
  }

  const handleModalClose = () => {
    setIsCreateModalOpen(false)
    setEditingPlan(null)
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 border border-[#037ECC]/20">
              <FileText className="h-8 w-8 text-[#037ECC]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-transparent">
                Service Plans
              </h1>
              <p className="text-slate-600 mt-1">Manage service plans and offerings</p>
            </div>
          </div>

          <Button
            variant="primary"
            onClick={handleOpenCreate}
            className="gap-2 flex items-center"
          >
            <Plus className="w-4 h-4" />
            Add Service Plan
          </Button>
        </div>

        <ServicePlansTable ref={tableRef} onEdit={handleEdit} />

        <CreateServicePlanModal
          open={isCreateModalOpen}
          onClose={handleModalClose}
          onSuccess={handleCreated}
          initialPlan={editingPlan}
        />
      </div>
    </div>
  )
}
