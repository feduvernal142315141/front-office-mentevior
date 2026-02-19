export function ClientFormSkeleton() {
  return (
    <div className="space-y-8 animate-pulse pb-24">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gray-200 rounded-lg" />
          <div>
            <div className="h-5 w-40 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-56 bg-gray-200 rounded" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="h-14 bg-gray-200 rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-200" />

      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gray-200 rounded-lg" />
          <div>
            <div className="h-5 w-36 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-48 bg-gray-200 rounded" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="h-14 bg-gray-200 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
