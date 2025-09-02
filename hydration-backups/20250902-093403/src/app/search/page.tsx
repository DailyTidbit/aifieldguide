
import { Suspense } from 'react'
import TidbitSearch from '../components/TidbitSearch'

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<div className="p-8">Loading search...</div>}>
        <TidbitSearch />
      </Suspense>
    </div>
  )
}