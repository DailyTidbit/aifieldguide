'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function PostForm() {
  const [content, setContent] = useState('')
  const [tidbit, setTidbit] = useState(1)
  const [maxTidbit, setMaxTidbit] = useState(30) // Update manually or dynamically later
  const [submitted, setSubmitted] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const { error } = await supabase.from('posts').insert([
      {
        content,
        tidbit,
      },
    ])

    if (!error) {
      setSubmitted(true)
      router.push(`/tidbit/${tidbit}`)
    } else {
      alert('Error submitting post')
    }
  }

  if (submitted) {
    return (
      <div className="p-6 text-center">
        <div className="w-16 h-16 bg-[#60A875] rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-[#60A875] font-semibold text-lg">Thanks for sharing! Redirecting...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto">
      <div>
        <label htmlFor="tidbit" className="block font-semibold mb-2 text-gray-900">
          Choose Tidbit #
        </label>
        <select
          id="tidbit"
          value={tidbit}
          onChange={(e) => setTidbit(Number(e.target.value))}
          className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-[#60A875]/20 focus:border-[#60A875] transition-colors"
        >
          {Array.from({ length: maxTidbit }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              Tidbit #{i + 1}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="content" className="block font-semibold mb-2 text-gray-900">
          Describe your creation
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-[#60A875]/20 focus:border-[#60A875] transition-colors"
          rows={4}
          placeholder="Tell us what you created with this tidbit..."
          required
        />
      </div>

      <button
        type="submit"
        className="bg-[#60A875] text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors font-semibold w-full"
      >
        Post to BitBoard
      </button>
    </form>
  )
}