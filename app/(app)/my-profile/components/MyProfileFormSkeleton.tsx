"use client"

export function MyProfileFormSkeleton() {
  return (
    <div className="pb-24 animate-pulse">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="space-y-8">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gray-200 rounded-lg" />
              <div>
                <div className="h-5 w-40 bg-gray-200 rounded mb-2" />
                <div className="h-4 w-48 bg-gray-200 rounded" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(5)].map((_, i) => (
                <div key={i}>
                  <div className="h-12 bg-gray-200 rounded-lg" />
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-200" />

          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gray-200 rounded-lg" />
              <div className="h-5 w-40 bg-gray-200 rounded" />
            </div>

            <div className="max-w-md">
              <div className="h-12 bg-gray-200 rounded-lg" />
            </div>
          </div>

          <div className="border-t border-gray-200" />

          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gray-200 rounded-lg" />
              <div className="h-5 w-40 bg-gray-200 rounded" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 max-w-4xl">
              <div className="h-24 bg-gray-200 rounded-xl" />
              <div className="h-24 bg-gray-200 rounded-xl" />
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-end gap-4">
          <div className="h-10 w-24 bg-gray-200 rounded-lg" />
          <div className="h-10 w-32 bg-gray-200 rounded-lg" />
        </div>
      </div>
    </div>
  )
}
