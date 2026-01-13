"use client"

export function BillingCodeFormSkeleton() {
  return (
    <div className="pb-24 animate-pulse">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 space-y-4">
          <div className="h-4 w-48 bg-gray-200 rounded"></div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-4">
            <div className="space-y-2">
              <div className="h-4 w-16 bg-gray-200 rounded"></div>
              <div className="h-6 w-20 bg-gray-200 rounded"></div>
            </div>
            
            <div className="space-y-2">
              <div className="h-4 w-16 bg-gray-200 rounded"></div>
              <div className="h-8 w-32 bg-gray-200 rounded"></div>
            </div>
            
            <div className="space-y-2">
              <div className="h-4 w-24 bg-gray-200 rounded"></div>
              <div className="h-6 w-full bg-gray-200 rounded"></div>
              <div className="h-6 w-3/4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="h-4 w-56 bg-gray-200 rounded"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-12 bg-gray-100 rounded-xl"></div>
            <div className="h-12 bg-gray-100 rounded-xl"></div>
            <div className="md:col-span-2 h-12 bg-gray-100 rounded-xl"></div>
            <div className="h-16 bg-gray-100 rounded-xl"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
