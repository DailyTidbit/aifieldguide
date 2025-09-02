'use client'

import React, { Suspense } from 'react'
import PostForm from '../components/PostForm'
import { Loader2 } from 'lucide-react'

function PostContent() {
  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <PostForm onPostSubmit={() => {}} />
    </div>
  )
}

export default function PostPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-brand-green" />
      </div>
    }>
      <PostContent />
    </Suspense>
  )
}