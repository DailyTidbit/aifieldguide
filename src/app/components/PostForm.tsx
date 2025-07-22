'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '../lib/supabaseClient'

export default function PostForm({ onPostSubmit }: { onPostSubmit: () => void }) {
  const [user, setUser] = useState<any>(null)
  const [tidbit, setTidbit] = useState<number | null>(null)
  const [content, setContent] = useState('')
  const [beforeText, setBeforeText] = useState('')
  const [afterText, setAfterText] = useState('')
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    // Get logged-in user
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))

    // Get tidbit number from URL
    const tidbitParam = searchParams.get('tidbit')
    if (tidbitParam) {
      setTidbit(Number(tidbitParam))
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !tidbit) return

    setSubmitting(true)

    let media_url = null
    if (mediaFile) {
      const fileExt = mediaFile.name.split('.').pop()
      const filePath = `public/${Date.now()}.${fileExt}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, mediaFile)

      if (uploadError) {
        console.error(uploadError)
      } else {
        const { data } = supabase.storage.from('media').getPublicUrl(filePath)
        media_url = data.publicUrl
      }
    }

    const { error } = await supabase.from('posts').insert({
      user_id: user.id,
      content,
      before_text: beforeText || null,
      after_text: afterText || null,
      media_url,
      tidbit,
      type: 'text',
    })

    if (error) {
      alert('Error submitting post')
      console.error(error)
    } else {
      alert('Post submitted!')
      setContent('')
      setBeforeText('')
      setAfterText('')
      setMediaFile(null)
      onPostSubmit()

      // ✅ Redirect back to the walkthrough page for this Tidbit
      router.push(`https://www.dailytidbit.org/tidbits/day-${tidbit}#bitboard`)
    }

    setSubmitting(false)
  }

  if (!user || tidbit === null) return null

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl mx-auto bg-white border rounded-xl shadow p-6 space-y-4"
    >
      <h2 className="text-xl font-bold text-gray-800" style={{ fontFamily: "'Playfair Display', serif" }}>
        Post your creation
      </h2>

      {/* Tidbit display only (locked in from URL) */}
      <div className="text-sm text-gray-600">
        Posting to <strong>Tidbit #{tidbit}</strong>
      </div>

      <label className="block">
        <span className="text-sm text-gray-600 font-medium">What did you make?</span>
        <textarea
          className="border w-full mt-1 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#60A875]/20 focus:border-[#60A875] transition-colors"
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label>
          <span className="text-sm text-gray-600 font-medium">Before (optional)</span>
          <textarea
            className="border w-full mt-1 rounded px-2 py-1 focus:ring-2 focus:ring-[#60A875]/20 focus:border-[#60A875] transition-colors"
            rows={2}
            value={beforeText}
            onChange={(e) => setBeforeText(e.target.value)}
          />
        </label>

        <label>
          <span className="text-sm text-gray-600 font-medium">After (optional)</span>
          <textarea
            className="border w-full mt-1 rounded px-2 py-1 focus:ring-2 focus:ring-[#60A875]/20 focus:border-[#60A875] transition-colors"
            rows={2}
            value={afterText}
            onChange={(e) => setAfterText(e.target.value)}
          />
        </label>
      </div>

      <label className="block">
        <span className="text-sm text-gray-600 font-medium">Upload image, video, or audio (optional)</span>
        <input
          type="file"
          accept="image/*,video/mp4,video/webm,audio/mpeg"
          onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
          className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#60A875]/10 file:text-[#60A875] hover:file:bg-[#60A875]/20 transition-colors"
        />
      </label>

      <button
        type="submit"
        className="bg-[#60A875] text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={submitting}
      >
        {submitting ? 'Submitting...' : 'Post to BitBoard'}
      </button>
    </form>
  )
}
