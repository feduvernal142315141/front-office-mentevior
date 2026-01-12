"use client";

import { Stethoscope } from "lucide-react";
import { Card } from "@/components/custom/Card";
import { PhysicianForm } from "../../components/PhysicianForm";
import { use } from "react";

interface EditPhysicianPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditPhysicianPage({ params }: EditPhysicianPageProps) {
  const { id } = use(params);

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 border border-[#037ECC]/20">
            <Stethoscope className="h-8 w-8 text-[#037ECC]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-transparent">
              Edit Physician
            </h1>
            <p className="text-slate-600 mt-1">Update physician information</p>
          </div>
        </div>
        
        <Card variant="elevated" padding="lg">
          <PhysicianForm physicianId={id} />
        </Card>
      </div>
    </div>
  );
}
