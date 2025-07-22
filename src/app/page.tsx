import { Play, ArrowRight, Users, BookOpen, Brain, Target, Clock, Tag, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from './lib/supabaseClient'
import { Suspense } from 'react'

interface TodaysTip {
  day_number: number
  title: string
  walkthrough_intro: string
  what_you_need: string
  video_url: string
  image_url: string
  bitboard_url: string
  tags: string[]
  difficulty_level: number
  estimated_time: number
}

interface CommunityPost {
  id: string
  content: string
  author: string
  created_at: string
}

// Loading component for today's tidbit section
function TodaysTidbitSkeleton() {
  return (
    <div className="max-w-3xl mx-auto animate-pulse">
      <div className="flex justify-center mb-6 sm:mb-8">
        <div className="relative max-w-3xl w-full px-4">
          <div className="w-full max-w-md mx-auto h-64 bg-gray-200 rounded-2xl"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-gray-100 p-4 sm:p-6 rounded-xl h-32"></div>
        <div className="bg-gray-100 p-4 sm:p-6 rounded-xl h-32"></div>
      </div>

      <div className="bg-gray-200 rounded-xl h-64 mb-4 sm:mb-6"></div>
      <div className="bg-gray-100 rounded-xl h-16 mb-6 sm:mb-8"></div>
      <div className="bg-gray-100 rounded-xl h-48 mb-6 sm:mb-8"></div>
    </div>
  )
}

// Async component for fetching today's tidbit
async function TodaysTidbit() {
  try {
    // Add timeout and error handling to the query
    const { data: tidbitData, error: tidbitError } = await Promise.race([
      supabase
        .from('tidbits')
        .select('*')
        .order('day_number', { ascending: false })
        .limit(1)
        .single(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), 8000)
      )
    ]) as any

    if (tidbitError) {
      throw tidbitError
    }

    // Mock community data for now - you can replace with actual API call later
    const mockCommunityPosts: CommunityPost[] = [
      {
        id: '1',
        content: 'Just rewrote my entire email using this technique - went from rambling mess to clear and confident! 🎯',
        author: 'Sarah M.',
        created_at: '2 hours ago'
      },
      {
        id: '2', 
        content: 'This saved me so much time on my work presentations. The AI suggestions were spot on!',
        author: 'Mike R.',
        created_at: '5 hours ago'
      }
    ]

    const todaysTip: TodaysTip | null = tidbitData ? {
      day_number: tidbitData.day_number,
      title: tidbitData.title,
      walkthrough_intro: tidbitData.walkthrough_intro,
      what_you_need: tidbitData.what_you_need,
      video_url: tidbitData.video_url,
      image_url: tidbitData.image_url,
      bitboard_url: tidbitData.bitboard_url,
      tags: tidbitData.tags || [],
      difficulty_level: tidbitData.difficulty_level || 1,
      estimated_time: tidbitData.estimated_time || 5
    } : null

    const getDifficultyLabel = (level: number) => {
      const labels = { 1: "Beginner", 2: "Easy", 3: "Medium", 4: "Hard", 5: "Advanced" }
      return labels[level as keyof typeof labels] || "Beginner"
    }

    const getDifficultyColor = (level: number) => {
      const colors = {
        1: "bg-green-100 text-green-800 border-green-300",
        2: "bg-blue-100 text-blue-800 border-blue-300", 
        3: "bg-yellow-100 text-yellow-800 border-yellow-300",
        4: "bg-orange-100 text-orange-800 border-orange-300",
        5: "bg-red-100 text-red-800 border-red-300"
      }
      return colors[level as keyof typeof colors] || colors[1]
    }

    if (!todaysTip) {
      return (
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-gray-100 rounded-xl sm:rounded-2xl p-8 sm:p-12 text-center">
            <Brain className="w-12 sm:w-16 h-12 sm:h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-bold text-gray-600 mb-2">No Tidbit Available</h3>
            <p className="text-sm sm:text-base text-gray-500">Check back soon for new content!</p>
          </div>
        </div>
      )
    }

    return (
      <div className="max-w-3xl mx-auto">
        {todaysTip?.image_url && (
          <div className="flex justify-center mb-6 sm:mb-8">
            <div className="relative max-w-3xl w-full px-4">
              <Image
                src={todaysTip.image_url}
                alt={`Day ${todaysTip.day_number} illustration`}
                width={600}
                height={600}
                className="w-full max-w-md mx-auto h-auto aspect-square rounded-2xl shadow-xl object-cover"
                priority
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+Wj2nkdkryehqpz5Nqj9EB+dGbdQe/ukcUtGZ3uGo6NNWQcf5cQz9GWrUy5J3b7V9v9F8sQJbcRi/XPxY5+Ks7g3p18BZKOvnKdqvdm6LtRiclNEH//9k="
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8 text-left">
          <div className="bg-gray-50 p-4 sm:p-6 rounded-xl border-2 border-gray-300">
            <h3 className="text-base sm:text-lg font-bold text-gray-700 mb-2 sm:mb-3 flex items-center gap-2">
              <Brain className="w-4 sm:w-5 h-4 sm:h-5" />
              What You'll Learn
            </h3>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              {todaysTip.walkthrough_intro.length > 120 
                ? `${todaysTip.walkthrough_intro.substring(0, 120)}...`
                : todaysTip.walkthrough_intro
              }
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 sm:p-6 rounded-xl border border-green-200">
            <h3 className="text-base sm:text-lg font-bold text-green-900 mb-2 sm:mb-3 flex items-center gap-2">
              <Target className="w-4 sm:w-5 h-4 sm:h-5" />
              What You Need
            </h3>
            <p className="text-sm sm:text-base text-green-800 leading-relaxed">
              {todaysTip.what_you_need.length > 120 
                ? `${todaysTip.what_you_need.substring(0, 120)}...`
                : todaysTip.what_you_need
              }
            </p>
          </div>
        </div>

        <div className="relative bg-gray-900 rounded-xl sm:rounded-2xl overflow-hidden shadow-xl aspect-video mb-4 sm:mb-6 w-full max-w-full">
          <div className="absolute top-2 sm:top-4 right-2 sm:right-4 z-10 bg-[#60A875] text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold">
            DAY {todaysTip.day_number}
          </div>
          
          <video 
            className="w-full h-full object-cover"
            controls
            preload="metadata"
          >
            <source src={todaysTip.video_url} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>

        <div className="mb-6 sm:mb-8 px-4 sm:px-0">
          <Link
            href={`/day/${todaysTip.day_number}`}
            className="inline-flex items-center justify-center gap-3 bg-gradient-to-r from-[#60A875] to-green-600 text-white px-8 sm:px-12 py-4 sm:py-5 rounded-2xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 font-bold text-lg sm:text-xl w-full sm:w-auto shadow-lg border-2 border-green-700/20"
          >
            <span>Get Full Walkthrough</span>
            <ArrowRight className="w-6 h-6" />
          </Link>
        </div>
        
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-4 sm:mb-6 px-2" style={{ fontFamily: "'Playfair Display', serif" }}>
          {todaysTip.title}
        </h2>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 sm:p-6 rounded-xl border border-purple-200 mb-6 sm:mb-8">
          <h3 className="text-lg sm:text-xl font-bold text-purple-900 mb-3 sm:mb-4 flex items-center gap-2">
            <Users className="w-4 sm:w-5 h-4 sm:h-5" />
            Community Examples
          </h3>
          <div className="space-y-3">
            {mockCommunityPosts.map((post) => (
              <div key={post.id} className="bg-white/70 p-3 sm:p-4 rounded-lg border border-purple-200">
                <p className="text-sm sm:text-base text-gray-700 mb-2">{post.content}</p>
                <div className="text-xs sm:text-sm text-purple-600 font-medium">
                  — {post.author} • {post.created_at}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center px-4 sm:px-0">
          {todaysTip.bitboard_url && (
            <Link
              href={todaysTip.bitboard_url}
              className="inline-flex items-center justify-center gap-2 border-2 border-[#59B1E3] text-[#59B1E3] px-6 sm:px-8 py-3 sm:py-4 rounded-xl hover:bg-[#59B1E3] hover:text-white transition-all duration-200 font-semibold text-base sm:text-lg w-full sm:w-auto"
            >
              <Users className="w-4 sm:w-5 h-4 sm:h-5" />
              <span>See Community Examples</span>
              <ExternalLink className="w-3 sm:w-4 h-3 sm:h-4" />
            </Link>
          )}
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error fetching today\'s tidbit:', error)
    
    return (
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-red-50 rounded-xl sm:rounded-2xl p-8 sm:p-12 text-center border border-red-200">
          <div className="w-12 sm:w-16 h-12 sm:h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-red-700 mb-2">Unable to Load Today's Tidbit</h3>
          <p className="text-sm sm:text-base text-red-600 mb-4">
            We're having trouble loading the latest content. Please try refreshing the page.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }
}

export default async function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <main>
        <section className="py-12 sm:py-20 text-center relative">
          <div 
            className="absolute inset-0 opacity-60"
            style={{
              background: 'linear-gradient(to bottom right, #F3FCF8, #F0F9FD)',
              maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 100%)'
            }}
          />
          
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Logo section */}
            <div className="mb-8 sm:mb-12">
              <Image
                src="https://cdn.dailytidbit.org/Logo/herologo.png"
                alt="Daily Tidbit Logo"
                width={1200}
                height={300}
                className="w-full max-w-sm sm:max-w-md lg:max-w-lg mx-auto h-auto"
                priority
              />
            </div>

            {/* Today's Tidbit with Suspense for better loading */}
            <Suspense fallback={<TodaysTidbitSkeleton />}>
              <TodaysTidbit />
            </Suspense>
          </div>
        </section>

        {/* Quick Links Section - Simplified and faster */}
        <section className="py-12 sm:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              <Link href="/TidbitLibrary" className="group">
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 sm:p-8 rounded-2xl text-center hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-purple-200">
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 sm:p-4 rounded-xl w-12 sm:w-16 h-12 sm:h-16 mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                    <Target className="w-6 sm:w-8 h-6 sm:h-8 text-white" />
                  </div>
                  <h4 className="text-lg sm:text-xl font-bold text-purple-800 mb-2 sm:mb-3">Tidbit Library</h4>
                  <p className="text-purple-700 text-xs sm:text-sm leading-relaxed">
                    Explore all our daily AI tips and find exactly what you need
                  </p>
                </div>
              </Link>
              
              <Link href="/start-here" className="group">
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 sm:p-8 rounded-2xl text-center hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-orange-200">
                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-3 sm:p-4 rounded-xl w-12 sm:w-16 h-12 sm:h-16 mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                    <BookOpen className="w-6 sm:w-8 h-6 sm:h-8 text-white" />
                  </div>
                  <h4 className="text-lg sm:text-xl font-bold text-orange-800 mb-2 sm:mb-3">Learn More</h4>
                  <p className="text-orange-700 text-xs sm:text-sm leading-relaxed">
                    Understand what AI is and how it can help you every day
                  </p>
                </div>
              </Link>
              
              <Link href="/bitboard" className="group">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 sm:p-8 rounded-2xl text-center hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-blue-200">
                  <div className="bg-gradient-to-br from-[#59B1E3] to-blue-600 p-3 sm:p-4 rounded-xl w-12 sm:w-16 h-12 sm:h-16 mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                    <Users className="w-6 sm:w-8 h-6 sm:h-8 text-white" />
                  </div>
                  <h4 className="text-lg sm:text-xl font-bold text-blue-800 mb-2 sm:mb-3">Join Community</h4>
                  <p className="text-blue-700 text-xs sm:text-sm leading-relaxed">
                    Share your AI creations and see what others are building
                  </p>
                </div>
              </Link>
              
              <div className="group cursor-pointer">
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 sm:p-8 rounded-2xl text-center hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-green-200">
                  <div className="bg-gradient-to-br from-[#60A875] to-green-600 p-3 sm:p-4 rounded-xl w-12 sm:w-16 h-12 sm:h-16 mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                    <Brain className="w-6 sm:w-8 h-6 sm:h-8 text-white" />
                  </div>
                  <h4 className="text-lg sm:text-xl font-bold text-green-800 mb-2 sm:mb-3">Tidbit Tutor</h4>
                  <p className="text-green-700 text-xs sm:text-sm leading-relaxed">
                    Get personalized help with any AI tip from our custom assistant
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer - kept simple for faster loading */}
        <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              <div>
                <div className="mt-6">
                  <h5 className="text-sm font-bold text-[#60A875] mb-2">Get In Touch</h5>
                  <a href="mailto:mike@dailytidbit.org" className="text-gray-300 hover:text-white transition-colors text-sm sm:text-base">
                    mike@dailytidbit.org
                  </a>
                </div>
              </div>
              
              <div className="flex justify-center md:justify-center">
                <div className="flex items-center gap-3 sm:gap-4">
                  <a href="#" className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                    </svg>
                  </a>
                  <a href="#" className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </a>
                  <a href="#" className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </a>
                  <a href="#" className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.083.402-.09.402-.294 1.116-.334 1.272-.051.201-.402.244-.402.244-.402-.06-2.477-1.647-2.477-3.956 0-4.915 3.568-9.425 10.294-9.425 5.401 0 9.6 3.848 9.6 8.987 0 5.36-3.38 9.674-8.069 9.674-1.574 0-3.056-.818-3.56-1.797l-.969 3.691c-.351 1.35-1.302 3.04-1.939 4.078C8.69 23.81 10.316 24.029 12.017 24.029c6.624 0 11.99-5.367 11.99-11.987C24.007 5.367 18.641.001 12.017.001z"/>
                    </svg>
                  </a>
                </div>
              </div>
              
              <div className="text-center md:text-right">
                <div className="space-y-2 sm:space-y-3">
                  <div><Link href="/privacy" className="text-gray-300 hover:text-white transition-colors text-sm sm:text-base">Privacy Policy</Link></div>
                  <div><Link href="/accessibility" className="text-gray-300 hover:text-white transition-colors text-sm sm:text-base">Accessibility Statement</Link></div>
                  <div><Link href="/terms" className="text-gray-300 hover:text-white transition-colors text-sm sm:text-base">Terms & Conditions</Link></div>
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-700 mt-8 sm:mt-12 pt-6 sm:pt-8 text-center">
              <p className="text-gray-400 text-base sm:text-lg font-medium">
                Come for the tips. Stay for the community. ✨
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}