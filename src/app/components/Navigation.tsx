'use client'

import { useState, useEffect, useMemo } from 'react'
import { Search, User, Menu, X, Sparkles, Compass } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '../lib/supabaseClient'
import AuthModal from './AuthModal'
import UserProfile from './UserProfile'

export default function Navigation() {
  const [user, setUser] = useState<any>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [todaysTidbit, setTodaysTidbit] = useState<number | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showUserProfile, setShowUserProfile] = useState(false)

  // Send users back to the current page after OAuth
  const redirectTo = useMemo(() => (
    typeof window !== 'undefined' ? window.location.href : null
  ), [])

  useEffect(() => {
    // Get current user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        setUser(session?.user ?? null)
        setShowAuthModal(false)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
      }
    })

    // Get today's tidbit number (latest published)
    const fetchTodaysTidbit = async () => {
      try {
        const { data } = await supabase
          .from('tidbits')
          .select('day_number')
          .eq('status', 'published')
          .order('day_number', { ascending: false })
          .limit(1)
          .single()
        if (data) setTodaysTidbit(data.day_number)
      } catch (error) {
        console.error("Error fetching today's tidbit:", error)
      }
    }
    fetchTodaysTidbit()

    return () => subscription.unsubscribe()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    window.location.reload()
  }

  const openAuthModal = () => setShowAuthModal(true)

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left - Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center hover:scale-105 transition-transform duration-200">
                <Image
                  src="https://cdn.dailytidbit.org/Logo/logo224.png"
                  alt="Daily Tidbit Logo"
                  width={56}
                  height={56}
                  className="h-14 w-14"
                />
              </Link>
            </div>

            {/* Center - Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-8">
              <Link href="/start-here" className="transition-colors duration-300 font-medium text-gray-700 hover:text-[#60A875] relative group">
                AI FOR REAL PEOPLE
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#60A875] transition-all duration-300 group-hover:w-full"></span>
              </Link>

              <Link href="/field-guide" className="transition-colors duration-300 font-medium text-gray-700 hover:text-[#59B1E3] relative group flex items-center gap-2">
                <Compass className="w-4 h-4" />
                FIELD GUIDE
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#59B1E3] transition-all duration-300 group-hover:w-full"></span>
              </Link>
              
              <Link href="/TidbitLibrary" className="transition-colors duration-300 font-medium text-gray-700 hover:text-[#60A875] relative group">
                TIDBIT LIBRARY
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#60A875] transition-all duration-300 group-hover:w-full"></span>
              </Link>

              {todaysTidbit && (
                <Link href={`/day/${todaysTidbit}`} className="transition-all duration-300 hover:scale-105">
                  <div className="bg-gradient-to-r from-[#60A875] to-[#59B1E3] text-white px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300">
                    <Sparkles className="w-4 h-4" />
                    <span>TODAY'S TIDBIT</span>
                    <div className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">#{todaysTidbit}</div>
                  </div>
                </Link>
              )}

              <Link href="/bitboard" className="transition-colors duration-300 font-medium text-gray-700 hover:text-[#60A875] relative group" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                BITBOARD
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#60A875] transition-all duration-300 group-hover:w-full"></span>
              </Link>
            </nav>

            {/* Right - Search & Auth */}
            <div className="flex items-center gap-4">
              <div className="hidden md:block relative">
                <form onSubmit={handleSearch}>
                  <input
                    type="text"
                    placeholder="Search tips..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-48 px-4 py-2 pr-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#60A875]/20 focus:border-[#60A875] transition-colors"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <Search className="w-4 h-4 text-gray-400" />
                  </div>
                </form>
              </div>

              {user ? (
                <button
                  onClick={() => setShowUserProfile(true)}
                  className="flex items-center gap-2 text-gray-700 hover:text-[#60A875] transition-colors"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-300 rounded-full hover:ring-2 hover:ring-[#60A875]/20 transition-all flex items-center justify-center text-xs sm:text-sm font-medium">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline font-medium text-sm">{user.email?.split('@')[0]}</span>
                </button>
              ) : (
                <button onClick={openAuthModal} className="bg-[#60A875] text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors font-medium text-sm">LOGIN</button>
              )}

              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden p-2 text-gray-700 hover:text-[#60A875] transition-colors">
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {isMenuOpen && (
            <div className="lg:hidden border-t border-gray-200 py-4">
              <div className="flex flex-col space-y-4">
                <form onSubmit={handleSearch} className="md:hidden">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search tips..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-2 pr-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#60A875]/20 focus:border-[#60A875] transition-colors"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <Search className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </form>

                <Link href="/start-here" className="block py-2 text-gray-700 hover:text-[#60A875] font-medium transition-colors duration-300" onClick={() => setIsMenuOpen(false)}>AI FOR REAL PEOPLE</Link>

                <Link href="/field-guide" className="block py-2 text-gray-700 hover:text-[#59B1E3] font-medium transition-colors duration-300 flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
                  <Compass className="w-4 h-4" />
                  FIELD GUIDE
                </Link>
                
                <Link href="/TidbitLibrary" className="block py-2 text-gray-700 hover:text-[#60A875] font-medium transition-colors duration-300" onClick={() => setIsMenuOpen(false)}>TIDBIT LIBRARY</Link>

                {todaysTidbit && (
                  <Link href={`/day/${todaysTidbit}`} className="block py-2" onClick={() => setIsMenuOpen(false)}>
                    <div className="bg-gradient-to-r from-[#60A875] to-[#59B1E3] text-white px-4 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg">
                      <Sparkles className="w-4 h-4" />
                      <span>TODAY'S TIDBIT #{todaysTidbit}</span>
                    </div>
                  </Link>
                )}
                
                <Link href="/bitboard" className="block py-2 text-gray-700 hover:text-[#60A875] font-medium transition-colors duration-300" style={{ fontFamily: "'Space Grotesk', sans-serif" }} onClick={() => setIsMenuOpen(false)}>BITBOARD</Link>

                {!user && (
                  <button onClick={() => { openAuthModal(); setIsMenuOpen(false) }} className="w-full text-left py-2 text-gray-700 hover:text-[#60A875] font-medium transition-colors duration-300">LOGIN / SIGN UP</button>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Auth modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => setShowAuthModal(false)}
        title="Welcome to Daily Tidbit"
        subtitle="Sign in to save, post, and use the Tutor"
        redirectTo={redirectTo}
      />

      {/* User Profile Modal - Matching BitBoard Style */}
      {user && showUserProfile && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto relative">
            <div className="sticky top-0 bg-white flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 z-10">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Your Profile</h2>
              <button
                onClick={() => setShowUserProfile(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
            <div className="p-0">
              <UserProfile userId={user.id} isOwnProfile={true} />
            </div>
          </div>
        </div>
      )}
    </>
  )
}