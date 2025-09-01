'use client'

import { useState, useEffect } from 'react'
import { getSupabaseBrowserClient } from '../lib/supabaseClient'
import { Users, Send, ArrowRight, Sparkles, Check, X } from 'lucide-react'

interface QuickPostFromChatProps {
  userInput: string
  aiOutput: string
  tidbitNumber: number
  tidbitTitle: string
  user: any
  onSuccess?: () => void
  onCancel?: () => void
}

export default function QuickPostFromChat({
  userInput,
  aiOutput,
  tidbitNumber,
  tidbitTitle,
  user,
  onSuccess,
  onCancel
}: QuickPostFromChatProps) {
  // Hydration safety
  const [mounted, setMounted] = useState(false)
  const [posting, setPosting] = useState(false)
  const [customContent, setCustomContent] = useState(
    `Just used AI to transform my writing with Daily Tidbit #${tidbitNumber}! "${tidbitTitle}"`
  )
  const [showCustomization, setShowCustomization] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleQuickPost = async () => {
    if (!mounted || !user) {
      if (!user) {
        alert("Please sign in to post to BitBoard!")
      }
      return
    }

    setPosting(true)

    try {
      const supabase = getSupabaseBrowserClient()
      
      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        content: customContent,
        before_text: userInput,
        after_text: aiOutput,
        tidbit: tidbitNumber,
        type: 'tidbit_tutor_conversation',
        description: `AI writing improvement from Tidbit Tutor - Day ${tidbitNumber}`
      })

      if (error) throw error

      // Success - trigger callback
      if (onSuccess) {
        onSuccess()
      } else {
        // Default success behavior
        if (confirm("Posted successfully! 🎉 Want to see it on BitBoard?")) {
          window.open('/bitboard', '_blank')
        }
      }

    } catch (error) {
      console.error("Error posting to BitBoard:", error)
      alert("Failed to post. Please try again.")
    } finally {
      setPosting(false)
    }
  }

  const handleCustomPost = async () => {
    if (!mounted) return
    
    setShowCustomization(false)
    await handleQuickPost()
  }

  // Hydration safety - show loading during hydration
  if (!mounted) {
    return (
      <div className="bg-gradient-to-r from-[#59B1E3]/10 to-[#60A875]/10 rounded-xl p-6 border border-[#59B1E3]/20">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="bg-gradient-to-r from-[#59B1E3]/10 to-[#60A875]/10 rounded-xl p-6 border border-[#59B1E3]/20 text-center">
        <div className="flex items-center justify-center w-12 h-12 bg-[#59B1E3] rounded-full mx-auto mb-3">
          <Users className="w-6 h-6 text-white" />
        </div>
        <h3 className="font-bold text-gray-900 mb-2">Share Your AI Creation</h3>
        <p className="text-gray-600 mb-4">Sign in to share your before & after with the community!</p>
        <button className="px-6 py-2 bg-[#60A875] text-white rounded-lg hover:bg-green-600 transition-colors font-medium">
          Sign In to Share
        </button>
      </div>
    )
  }

  if (showCustomization) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">Customize Your Post</h3>
          <button
            onClick={() => setShowCustomization(false)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Post Message
            </label>
            <textarea
              value={customContent}
              onChange={(e) => setCustomContent(e.target.value)}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#60A875] focus:border-[#60A875] resize-none"
              placeholder="Share what you learned..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-xs font-medium text-red-800 mb-1">Before:</p>
              <p className="text-sm text-red-700 line-clamp-3">{userInput}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-xs font-medium text-green-800 mb-1">After:</p>
              <p className="text-sm text-green-700 line-clamp-3">{aiOutput}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowCustomization(false)}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCustomPost}
              disabled={posting || !customContent.trim()}
              className="flex-1 px-4 py-2 bg-[#60A875] text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {posting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Posting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Post to BitBoard
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-r from-[#59B1E3]/10 to-[#60A875]/10 rounded-xl p-6 border border-[#59B1E3]/20">
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center justify-center w-12 h-12 bg-[#59B1E3] rounded-full">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 mb-1">Great work! Share your transformation?</h3>
          <p className="text-gray-600 text-sm">Let others see your before & after AI improvement</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-red-50 rounded-lg border border-red-200">
          <p className="text-xs font-medium text-red-800 mb-1">Before:</p>
          <p className="text-sm text-red-700 line-clamp-2">{userInput}</p>
        </div>
        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
          <p className="text-xs font-medium text-green-800 mb-1">After:</p>
          <p className="text-sm text-green-700 line-clamp-2">{aiOutput}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleQuickPost}
          disabled={posting}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#59B1E3] text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 font-medium"
        >
          {posting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Posting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Quick Post
            </>
          )}
        </button>
        
        <button
          onClick={() => setShowCustomization(true)}
          className="px-4 py-3 border border-[#60A875] text-[#60A875] rounded-lg hover:bg-[#60A875] hover:text-white transition-colors font-medium"
        >
          Customize
        </button>
        
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-3 text-gray-500 hover:text-gray-700 transition-colors"
          >
            Skip
          </button>
        )}
      </div>

      <div className="mt-3 text-center">
        <p className="text-xs text-gray-500">
          ✨ This will be posted to Day {tidbitNumber} on BitBoard
        </p>
      </div>
    </div>
  )
}