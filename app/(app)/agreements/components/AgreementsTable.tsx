"use client"

import { useAgreementsTable } from "@/lib/modules/agreements/hooks/use-agreements-table"
import { CustomTable } from "@/components/custom/CustomTable"
import { DocumentViewer } from "@/components/custom/DocumentViewer"

export function AgreementsTable() {
  const {
    agreements,
    columns,
    isLoading,
    error,
    selectedDocument,
    handleCloseViewer,
  } = useAgreementsTable()

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <p className="text-red-600 font-medium">Error loading agreements</p>
        <p className="text-red-500 text-sm mt-1">{error.message}</p>
      </div>
    )
  }

  return (
    <>
      <CustomTable
        columns={columns}
        data={agreements}
        isLoading={isLoading}
        emptyMessage="No agreements found"
        emptyContent={
          <div className="text-center py-8">
            <p className="text-base font-semibold text-gray-800">No agreements available</p>
            <p className="text-sm text-gray-600 mt-1">
              Agreements will appear here when they are added to the system.
            </p>
          </div>
        }
      />

      {selectedDocument && (
        <DocumentViewer
          open={!!selectedDocument}
          onClose={handleCloseViewer}
          documentUrl={selectedDocument.url}
          fileName={selectedDocument.name}
        />
      )}
    </>
  )
}
