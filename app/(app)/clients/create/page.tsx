"use client"

import { ClientForm } from "../components/ClientForm"
import { Card } from "@/components/custom/Card"

export default function CreateClientPage() {
  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-transparent">
            Create New Client
          </h1>
          <p className="text-slate-600 mt-2">Add a new client to the system</p>
        </div>
        
        <Card variant="elevated" padding="lg">
          <ClientForm />
        </Card>
      </div>
    </div>
  )
}
