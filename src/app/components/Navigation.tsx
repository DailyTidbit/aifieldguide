'use client'

import { useState, useEffect } from 'react'
import { Search, User, Menu, X, Bell, Sparkles, Compass } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '../lib/supabaseClient'

export default function Navigation() {
  const [user, setUser] = useState<any>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [todaysTidbit, setTodaysTidbit] = useState<number | null>(null)

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
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
        
        if (data) {
          setTodaysTidbit(data.day_number)
        }
      } catch (error) {
        console.error('Error fetching today\'s tidbit:', error)
      }
    }

    fetchTodaysTidbit()
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

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left - Logo (repositioned and larger) */}
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
            <Link 
              href="/start-here" 
              className="transition-colors duration-300 font-medium text-gray-700 hover:text-[#60A875] relative group"
            >
              AI FOR REAL PEOPLE
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#60A875] transition-all duration-300 group-hover:w-full"></span>
            </Link>

            {/* 🆕 NEW: Field Guide Link */}
            <Link 
              href="/field-guide" 
              className="transition-colors duration-300 font-medium text-gray-700 hover:text-[#59B1E3] relative group flex items-center gap-2"
            >
              <Compass className="w-4 h-4" />
              FIELD GUIDE
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#59B1E3] transition-all duration-300 group-hover:w-full"></span>
            </Link>
            
            <Link 
              href="/TidbitLibrary" 
              className="transition-colors duration-300 font-medium text-gray-700 hover:text-[#60A875] relative group"
            >
              TIDBIT LIBRARY
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#60A875] transition-all duration-300 group-hover:w-full"></span>
            </Link>
            
            {/* ✨ Today's Tidbit - Eye-catching */}
            {todaysTidbit && (
              <Link 
                href={`/day/${todaysTidbit}`}
                className="transition-all duration-300 hover:scale-105"
              >
                <div className="bg-gradient-to-r from-[#60A875] to-[#59B1E3] text-white px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300">
                  <Sparkles className="w-4 h-4" />
                  <span>TODAY'S TIDBIT</span>
                  <div className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
                    #{todaysTidbit}
                  </div>
                </div>
              </Link>
            )}
            
            {/* BitBoard */}
            <Link 
              href="/bitboard" 
              className="transition-colors duration-300 font-medium text-gray-700 hover:text-[#60A875] relative group"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              BITBOARD
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#60A875] transition-all duration-300 group-hover:w-full"></span>
            </Link>
          </nav>

          {/* Right Side - Search & Auth */}
          <div className="flex items-center gap-4">
            {/* Search Bar - Desktop */}
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
              <div className="relative group">
                <button className="flex items-center gap-2 text-gray-700 hover:text-[#60A875] transition-colors">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <span className="hidden sm:inline font-medium text-sm">
                    {user.email?.split('@')[0]}
                  </span>
                </button>
                
                {/* Dropdown */}
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <Link 
                    href="/profile" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg"
                  >
                    Your Profile
                  </Link>
                  <Link 
                    href="/settings" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Settings
                  </Link>
                  <hr className="my-1" />
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 last:rounded-b-lg"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href="/auth"
                className="bg-[#60A875] text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors font-medium text-sm"
              >
                LOGIN
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 text-gray-700 hover:text-[#60A875] transition-colors"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col space-y-4">
              {/* Mobile Search */}
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

              {/* Mobile Navigation Links */}
              <Link 
                href="/start-here" 
                className="block py-2 text-gray-700 hover:text-[#60A875] font-medium transition-colors duration-300"
                onClick={() => setIsMenuOpen(false)}
              >
                AI FOR REAL PEOPLE
              </Link>

              {/* 🆕 NEW: Mobile Field Guide Link */}
              <Link 
                href="/field-guide" 
                className="block py-2 text-gray-700 hover:text-[#59B1E3] font-medium transition-colors duration-300 flex items-center gap-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <Compass className="w-4 h-4" />
                FIELD GUIDE
              </Link>
              
              <Link 
                href="/TidbitLibrary" 
                className="block py-2 text-gray-700 hover:text-[#60A875] font-medium transition-colors duration-300"
                onClick={() => setIsMenuOpen(false)}
              >
                TIDBIT LIBRARY
              </Link>

              {/* ✨ Mobile Today's Tidbit */}
              {todaysTidbit && (
                <Link 
                  href={`/day/${todaysTidbit}`}
                  className="block py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="bg-gradient-to-r from-[#60A875] to-[#59B1E3] text-white px-4 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg">
                    <Sparkles className="w-4 h-4" />
                    <span>TODAY'S TIDBIT #{todaysTidbit}</span>
                  </div>
                </Link>
              )}
              
              {/* Mobile BitBoard */}
              <Link 
                href="/bitboard" 
                className="block py-2 text-gray-700 hover:text-[#60A875] font-medium transition-colors duration-300"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                onClick={() => setIsMenuOpen(false)}
              >
                BITBOARD
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}