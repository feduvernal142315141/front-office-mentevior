"use client"

interface FormFooterProps {
  isEdit?: boolean
  onCancel?: () => void
  loading?: boolean
}

export default function FormFooter({
  isEdit = false,
  onCancel,
  loading = false,
}: FormFooterProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg p-4">
      <div className="max-w-[1360px] mx-auto flex justify-end gap-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-6 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
        >
          {isEdit ? "Back" : "Cancel"}
        </button>
        <button
          type="submit"
          form="organization-form"
          disabled={loading}
          className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          {loading ? "Loading..." : isEdit ? "Save Changes" : "Create"}
        </button>
      </div>
    </div>
  )
}
