export default function SkeletonCard() {
  return (
    <div className="break-inside-avoid mb-4 w-full animate-pulse">
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* Image skeleton */}
        <div className="w-full h-64 bg-gray-200"></div>
        
        {/* Content skeleton */}
        <div className="p-4 space-y-3">
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
          
          {/* User info skeleton */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
              <div className="h-5 bg-gray-200 rounded-full w-8"></div>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-6"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}