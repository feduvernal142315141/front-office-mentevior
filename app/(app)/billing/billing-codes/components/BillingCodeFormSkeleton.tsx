"use client"

export function BillingCodeFormSkeleton() {
  return (
    <div className="pb-24 animate-pulse">
      <div className="max-w-5xl mx-auto">
        
        <div className="mb-8 space-y-6">
          <div className="h-4 w-40 bg-gray-200 rounded"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-[52px] 2xl:h-[56px] bg-gray-100 rounded-[16px]"></div>
            
            <div className="h-[52px] 2xl:h-[56px] bg-gray-100 rounded-[16px]"></div>
            
            <div className="md:col-span-2 h-[52px] 2xl:h-[56px] bg-gray-100 rounded-[16px]"></div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="h-4 w-52 bg-gray-200 rounded"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-[52px] 2xl:h-[56px] bg-gray-100 rounded-[16px]"></div>
            
            <div className="h-[52px] 2xl:h-[56px] bg-gray-100 rounded-[16px]"></div>
            
            <div className="md:col-span-2 h-[52px] 2xl:h-[56px] bg-gray-100 rounded-[16px]"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
