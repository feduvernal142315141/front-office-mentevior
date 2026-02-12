"use client"

import { Edit2 } from "lucide-react"
import { CustomTable, type CustomTableColumn } from "@/components/custom/CustomTable"
import type { UserCredential } from "@/lib/types/user-credentials.types"

interface CredentialsTableProps {
  data: UserCredential[]
  onEdit: (credential: UserCredential) => void
}

export function CredentialsTable({
  data,
  onEdit,
}: CredentialsTableProps) {
  const columns: CustomTableColumn<UserCredential>[] = [
    {
      key: "credentialTypeName",
      header: "Credential",
      render: (item) => <span className="font-medium text-gray-900">{item.credentialTypeName}</span>,
    },
    {
      key: "identificationNumber",
      header: "Identification #",
    },
    {
      key: "effectiveDate",
      header: "Effective Date",
    },
    {
      key: "expirationDate",
      header: "Expiration Date",
    },
    {
      key: "status",
      header: "Status",
      render: (item) => (
        <span
          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
            item.status === "Active"
              ? "bg-green-100 text-green-700 border border-green-200"
              : "bg-red-100 text-red-700 border border-red-200"
          }`}
        >
          {item.status}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (item) => (
        <button
          onClick={() => onEdit(item)}
          className="
            h-9 w-9 rounded-xl
            inline-flex items-center justify-center
            bg-gradient-to-b from-blue-50 to-blue-100/80
            border border-blue-200/60
            text-blue-600 hover:text-blue-700
            hover:-translate-y-0.5 transition-all duration-200
          "
          aria-label="Edit credential"
          title="Edit credential"
        >
          <Edit2 className="h-4 w-4" />
        </button>
      ),
    },
  ]

  return (
    <CustomTable
      columns={columns}
      data={data}
      emptyMessage="No credentials yet"
      compactEmpty
      getRowKey={(item) => item.id}
    />
  )
}
