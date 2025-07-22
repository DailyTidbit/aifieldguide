'use client'

import React from 'react'
import PostForm from '../components/PostForm'

export default function PostPage() {
  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <PostForm onPostSubmit={() => {}} />
    </div>
  )
}
