import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/custom/Card"

export function UserFormSkeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Personal Information Card */}
      <Card variant="elevated" padding="lg">
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-5 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-[52px] w-full rounded-[16px]" />
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Role Card */}
      <Card variant="elevated" padding="lg">
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-5 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>

          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-[52px] w-full rounded-[16px]" />
            <Skeleton className="h-4 w-80 mt-2" />
          </div>
        </div>
      </Card>

      {/* Alert */}
      <Skeleton className="h-24 w-full rounded-xl" />

      {/* Buttons */}
      <div className="flex gap-3 justify-end">
        <Skeleton className="h-12 w-32 rounded-xl" />
        <Skeleton className="h-12 w-40 rounded-xl" />
      </div>
    </div>
  )
}
