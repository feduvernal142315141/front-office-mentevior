"use client";

import { useState } from "react";
import { Stethoscope, Plus, Settings } from "lucide-react";
import { Button } from "@/components/custom/Button";
import { AuditLogsModal } from "@/components/custom/AuditLogsModal";
import { useRouter } from "next/navigation";
import { PhysiciansTable } from "./components/PhysiciansTable";
import { CreateGate } from "@/components/layout/PermissionGate";
import { PermissionModule } from "@/lib/utils/permissions-new";

const DELETED_PHYSICIAN_AUDIT_FILTERS = ["action__EQ__Delete__AND"];

export default function PhysiciansPage() {
  const router = useRouter();
  const [deletedAuditOpen, setDeletedAuditOpen] = useState(false);

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 border border-[#037ECC]/20">
              <Stethoscope className="h-8 w-8 text-[#037ECC]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-transparent">
                Referring Physicians
              </h1>
              <p className="text-slate-600 mt-1">Manage your referring physicians catalog</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={() => setDeletedAuditOpen(true)}
              className="gap-2 flex items-center px-4"
              aria-label="View deleted physician audit logs"
              title="View deleted physician audit logs"
            >
              <Settings className="w-4 h-4" />
              Logs
            </Button>

            <CreateGate module={PermissionModule.PHYSICIANS}>
              <Button
                variant="primary"
                onClick={() => router.push("/my-company/physicians/create")}
                className="gap-2 flex items-center"
              >
                <Plus className="w-4 h-4" />
                New Physician
              </Button>
            </CreateGate>
          </div>
        </div>

        <PhysiciansTable />
      </div>

      <AuditLogsModal
        open={deletedAuditOpen}
        onOpenChange={setDeletedAuditOpen}
        entityName="Physician"
        title="Deleted Physician Audit Logs"
        filters={DELETED_PHYSICIAN_AUDIT_FILTERS}
      />
    </div>
  );
}
