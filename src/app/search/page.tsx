import { Suspense } from 'react'
import TidbitSearch from '../components/TidbitSearch'

// Enhanced loading skeleton that matches TidbitSearch structure
function SearchPageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-8">
        <div className="animate-pulse">
          {/* Header skeleton */}
          <div className="text-center mb-8">
            <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
            <div className="h-5 bg-gray-200 rounded w-96 mx-auto"></div>
          </div>
          
          {/* Search input skeleton */}
          <div className="mb-8">
            <div className="relative">
              <div className="h-12 bg-gray-200 rounded-xl w-full"></div>
            </div>
          </div>
          
          {/* Filter buttons skeleton */}
          <div className="flex flex-wrap gap-2 mb-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-200 rounded-full w-20"></div>
            ))}
          </div>
          
          {/* Results skeleton */}
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-xl border border-gray-200">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<SearchPageSkeleton />}>
        <TidbitSearch />
      </Suspense>
    </div>
  )
}