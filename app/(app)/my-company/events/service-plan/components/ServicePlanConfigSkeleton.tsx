"use client"

import { Card } from "@/components/custom/Card"

export function ServicePlanConfigSkeleton() {
  return (
    <div className="bg-gray-50/50 p-6 pb-28">
      <div className="mx-auto max-w-5xl xl:max-w-6xl">
        <div className="mb-6 flex items-center gap-4">
          <div className="rounded-xl border border-[#037ECC]/20 bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 p-3 animate-pulse w-[56px] h-[56px]" />
          <div className="space-y-2">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-72 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>

        <Card variant="elevated" padding="lg">
          <div className="h-6 w-44 bg-gray-200 rounded animate-pulse mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-[52px] rounded-[16px] bg-gray-100 animate-pulse" />
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
