// src/app/components/Navigation.tsx - COMPLETE HYDRATION FIX + ENHANCED SEARCH
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Search, User, Menu, X, Sparkles, Compass, Building2, ChevronDown } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '../hooks/useAuth'
import { useMounted } from '../lib/clientUtils'
import AuthModal from './AuthModal'
import UserProfile from './UserProfile'
import PartnerProfileModal from './PartnerProfileModal'
import type { PartnerInfo } from '../types/partner'

// Analytics helper with proper guards
const trackEvent = (eventName: string, parameters: Record<string, any> = {}) => {
  if (
    typeof window === 'undefined' || 
    typeof (window as any).gtag !== 'function' ||
    !window.document?.readyState
  ) {
    return
  }

  try {
    ;(window as any).gtag('event', eventName, {
      event_category: 'navigation',
      ...parameters
    })
  } catch (error) {
    console.warn('Analytics tracking failed:', error)
  }
}

// ✅ ENHANCED: Day/Tidbit detection with comprehensive patterns
const detectDayNumber = (query: string): number | null => {
  if (!query) return null
  
  const trimmed = query.trim().toLowerCase()
  
  // Pattern matching for various day/tidbit formats
  const patterns = [
    /^(?:day|tidbit)\s*(\d+)$/,           // "day 1", "tidbit 1"
    /^(?:day|tidbit)(\d+)$/,             // "day1", "tidbit1"
    /^(\d+)$/,                           // Just numbers: "1", "42"
    /^day\s+(\d+)$/,                     // "day 1" with spaces
    /^tidbit\s+(\d+)$/,                  // "tidbit 1" with spaces
  ]
  
  for (const pattern of patterns) {
    const match = trimmed.match(pattern)
    if (match) {
      const dayNum = parseInt(match[1], 10)
      if (isFinite(dayNum) && dayNum > 0 && dayNum <= 1000) { // reasonable bounds
        return dayNum
      }
    }
  }
  
  return null
}

// Helper function to normalize role types
const normalizePartnerRole = (role: string): 'company_admin' | 'company_editor' => {
  const normalizedRole = role?.toLowerCase?.() || ''
  
  if (normalizedRole.includes('admin') || normalizedRole === 'admin') {
    return 'company_admin'
  }
  
  return 'company_editor'
}

export default function Navigation() {
  const { user, authState, company, isCompanyAdmin, signOut } = useAuth()
  const mounted = useMounted() // Use the clientUtils hook
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [todaysTidbit, setTodaysTidbit] = useState<number | null>(null)
  const [todaysTidbitLoading, setTodaysTidbitLoading] = useState(true)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showUserProfile, setShowUserProfile] = useState(false)
  const [showPartnerProfile, setShowPartnerProfile] = useState(false)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)

  const pathname = usePathname()
  const router = useRouter()

  // HYDRATION SAFE: Redirect URL with additional guards
  const redirectTo = useMemo(() => {
    if (!mounted || typeof window === 'undefined') {
      return null
    }
    
    try {
      return window.location.href
    } catch (error) {
      console.warn('Error accessing window.location:', error)
      return null
    }
  }, [mounted])

  // HYDRATION SAFE: Enhanced company data conversion
  const partnerInfo: PartnerInfo | null = useMemo(() => {
    if (!mounted || !user?.companyMembership || !company) {
      return null
    }
    
    try {
      return {
        companyId: company.id,
        companyName: company.name || '',
        role: normalizePartnerRole(user.companyMembership.role),
        memberSince: user.companyMembership.created_at || new Date().toISOString()
      }
    } catch (error) {
      console.warn('Error creating partner info:', error)
      return null
    }
  }, [user?.companyMembership, company, mounted])

  // HYDRATION SAFE: Active route checking
  const isActiveRoute = useCallback((route: string) => {
    if (!mounted) return false
    
    try {
      if (route === '/' && pathname === '/') return true
      if (route !== '/' && pathname.startsWith(route)) return true
      if (todaysTidbit && route === `/day/${todaysTidbit}` && pathname === `/day/${todaysTidbit}`) return true
      return false
    } catch (error) {
      console.warn('Error checking active route:', error)
      return false
    }
  }, [pathname, todaysTidbit, mounted])

  // HYDRATION SAFE: Today's tidbit fetching - ONLY after mounted
  useEffect(() => {
    if (!mounted) return

    let cancelled = false
    const controller = new AbortController()

    const fetchTodaysTidbit = async () => {
      try {
        console.log('Fetching today\'s tidbit via API...')
        setTodaysTidbitLoading(true)
        
        const res = await fetch('/api/today', { 
          cache: 'no-store',
          signal: controller.signal
        })
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }
        
        const json = await res.json()
        console.log('API /today response:', json)
        
        if (!cancelled) {
          const dayNumber = json?.day_number ?? null
          console.log('Set today\'s tidbit to:', dayNumber)
          setTodaysTidbit(dayNumber)
        }
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') {
          return
        }
        console.error('fetch /api/today failed:', e)
        if (!cancelled) setTodaysTidbit(null)
      } finally {
        if (!cancelled) setTodaysTidbitLoading(false)
      }
    }

    fetchTodaysTidbit()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [mounted])

  // Close auth modal when user signs in
  useEffect(() => {
    if (user && showAuthModal) {
      setShowAuthModal(false)
    }
  }, [user, showAuthModal])

  // ✅ ENHANCED SEARCH: Handle day/tidbit detection and general search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!mounted || !searchQuery.trim()) return

    try {
      const queryTrimmed = searchQuery.trim()
      
      // First check for day/tidbit patterns
      const dayNumber = detectDayNumber(queryTrimmed)
      if (dayNumber !== null) {
        // Direct navigation to day page
        router.push(`/day/${dayNumber}`)
        trackEvent('search_day_redirect', {
          query: queryTrimmed,
          day_number: dayNumber,
          source: 'navigation'
        })
        setSearchQuery('') // Clear search after redirect
        return
      }

      // For general search terms, go to search page
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
      trackEvent('search_general', {
        query: queryTrimmed,
        source: 'navigation'
      })
      setSearchQuery('') // Clear search after redirect
    } catch (error) {
      console.error('Search navigation failed:', error)
    }
  }

  // ✅ HYDRATION SAFE: Sign out handler
  const handleSignOut = async () => {
    if (!mounted) return
    
    try {
      await signOut()
      router.refresh()
    } catch (error) {
      console.error('Sign out failed:', error)
      router.push('/')
    }
  }

  const openAuthModal = () => {
    trackEvent('auth_modal_opened', {
      trigger: 'login_button'
    })
    setShowAuthModal(true)
  }

  // HYDRATION SAFE: Outside click handler
  useEffect(() => {
    if (!mounted) return
    
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (target && !target.closest('[data-profile-dropdown]')) {
        setShowProfileDropdown(false)
      }
    }

    if (showProfileDropdown) {
      document.addEventListener('click', handleClickOutside, true)
      return () => document.removeEventListener('click', handleClickOutside, true)
    }
  }, [showProfileDropdown, mounted])

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  // HYDRATION SAFE: Display name with better fallbacks
  const getDisplayName = () => {
    if (!mounted || !user) return ''
    
    try {
      const sources = [
        user.user_metadata?.full_name,
        user.user_metadata?.name,
        user.profile?.full_name,
        user.email?.split('@')[0]
      ].filter(Boolean)
      
      const name = sources.find(source => 
        source && 
        typeof source === 'string' && 
        source.trim() && 
        source.toLowerCase() !== 'daily tidbit'
      )
      
      return name || 'User'
    } catch (error) {
      console.warn('Error getting display name:', error)
      return 'User'
    }
  }

  // HYDRATION SAFE: User initial
  const getUserInitial = () => {
    try {
      const name = getDisplayName()
      return name.charAt(0).toUpperCase() || 'U'
    } catch (error) {
      return 'U'
    }
  }

  // CRITICAL FIX: Deterministic avatar color to prevent hydration mismatch
  const getAvatarColor = () => {
    // ALWAYS return same fallback during SSR and when user not loaded
    if (!mounted || !user?.id) {
      return 'from-gray-400 to-gray-500'
    }
    
    try {
      // Use deterministic hash of user ID
      const userId = user.id
      let hash = 0
      for (let i = 0; i < userId.length; i++) {
        hash = ((hash << 5) - hash + userId.charCodeAt(i)) & 0xffffffff
      }
      
      const colors = [
        'from-brand-green to-brand-green-dark',
        'from-brand-blue to-brand-blue-dark',
        'from-brand-green to-brand-blue',
        'from-brand-blue to-brand-green'
      ]
      
      const index = Math.abs(hash) % colors.length
      return colors[index]
    } catch (error) {
      console.warn('Error getting avatar color:', error)
      return 'from-gray-400 to-gray-500'
    }
  }

  // CRITICAL FIX: Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Left - Logo - CONSISTENT */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center hover:scale-105 transition-transform duration-200">
                <Image
                  src="https://cdn.dailytidbit.org/Logo/logo224.png"
                  alt="Daily Tidbit Logo"
                  width={56}
                  height={56}
                  className="h-14 w-14"
                  priority={true}
                  loading="eager"
                />
              </Link>
            </div>

            {/* Center - Navigation Links - CONSISTENT SKELETON */}
            <nav className="hidden lg:flex items-center space-x-8">
              <Link 
                href="/start-here" 
                className="transition-colors duration-300 font-medium text-gray-700 hover:text-brand-green relative group"
              >
                AI FOR REAL PEOPLE
              </Link>

              <Link 
                href="/field-guide" 
                className="transition-colors duration-300 font-medium text-gray-700 hover:text-brand-blue relative group flex items-center gap-2"
              >
                <Compass className="w-4 h-4" />
                FIELD GUIDE
              </Link>

              {/* Today's Tidbit - CONSISTENT SKELETON */}
              <div className="bg-gray-200 animate-pulse rounded-full px-6 py-2 h-10 w-48"></div>
              
              <Link 
                href="/TidbitLibrary" 
                className="transition-colors duration-300 font-medium text-gray-700 hover:text-brand-green relative group"
              >
                TIDBIT LIBRARY
              </Link>

              <Link 
                href="/bitboard" 
                className="transition-colors duration-300 font-medium text-gray-700 hover:text-brand-green relative group font-sans"
              >
                BITBOARD
              </Link>
            </nav>

            {/* Right - Search & Auth - CONSISTENT SKELETON */}
            <div className="flex items-center gap-4">
              <div className="hidden md:block w-48 h-10 bg-gray-200 animate-pulse rounded-lg"></div>
              <div className="w-16 h-9 bg-gray-200 animate-pulse rounded-lg"></div>
              <button className="lg:hidden p-2 text-gray-700 hover:text-brand-green transition-colors rounded-lg">
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>
    )
  }

  // HYDRATION SAFE: Computed rendering states
  const shouldShowUserUI = user
  const shouldShowGuestUI = !user
  const showPartnerLinks = authState === 'has-company-access'

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
                  priority={true}
                  loading="eager"
                />
              </Link>
            </div>

            {/* Center - Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-8">
              <Link 
                href="/start-here" 
                className="transition-colors duration-300 font-medium text-gray-700 hover:text-brand-green relative group"
                onClick={() => trackEvent('nav_link_clicked', { link: 'start_here', section: 'desktop' })}
              >
                AI FOR REAL PEOPLE
                <span className={`absolute bottom-0 left-0 h-0.5 bg-brand-green transition-all duration-300 ${
                  isActiveRoute('/start-here') ? 'w-full' : 'w-0 group-hover:w-full'
                }`}></span>
              </Link>

              <Link 
                href="/field-guide" 
                className="transition-colors duration-300 font-medium text-gray-700 hover:text-brand-blue relative group flex items-center gap-2"
                onClick={() => trackEvent('nav_link_clicked', { link: 'field_guide', section: 'desktop' })}
              >
                <Compass className="w-4 h-4" />
                FIELD GUIDE
                <span className={`absolute bottom-0 left-0 h-0.5 bg-brand-blue transition-all duration-300 ${
                  isActiveRoute('/field-guide') ? 'w-full' : 'w-0 group-hover:w-full'
                }`}></span>
              </Link>

              {/* Today's Tidbit - NOW PROPERLY HYDRATION SAFE */}
              {todaysTidbitLoading || !todaysTidbit ? (
                <div className="bg-gray-200 animate-pulse rounded-full px-6 py-2 h-10 w-48"></div>
              ) : (
                <Link 
                  href={`/day/${todaysTidbit}`}
                  className="transition-all duration-300 hover:scale-105"
                  onClick={() => trackEvent('todays_tidbit_clicked', { 
                    day_number: todaysTidbit,
                    source: 'navigation' 
                  })}
                  aria-label={`Today's tidbit - Day ${todaysTidbit}`}
                >
                  <div className={`bg-gradient-to-r from-brand-green to-brand-blue text-white px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 ${
                    isActiveRoute(`/day/${todaysTidbit}`) ? 'ring-2 ring-white/30' : ''
                  }`}>
                    <Sparkles className="w-4 h-4" />
                    <span>TODAY'S TIDBIT</span>
                    <div className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">#{todaysTidbit}</div>
                  </div>
                </Link>
              )}
              
              <Link 
                href="/TidbitLibrary" 
                className="transition-colors duration-300 font-medium text-gray-700 hover:text-brand-green relative group"
                onClick={() => trackEvent('nav_link_clicked', { link: 'tidbit_library', section: 'desktop' })}
              >
                TIDBIT LIBRARY
                <span className={`absolute bottom-0 left-0 h-0.5 bg-brand-green transition-all duration-300 ${
                  isActiveRoute('/TidbitLibrary') ? 'w-full' : 'w-0 group-hover:w-full'
                }`}></span>
              </Link>

              <Link 
                href="/bitboard" 
                className="transition-colors duration-300 font-medium text-gray-700 hover:text-brand-green relative group font-sans"
                onClick={() => trackEvent('nav_link_clicked', { link: 'bitboard', section: 'desktop' })}
              >
                BITBOARD
                <span className={`absolute bottom-0 left-0 h-0.5 bg-brand-green transition-all duration-300 ${
                  isActiveRoute('/bitboard') ? 'w-full' : 'w-0 group-hover:w-full'
                }`}></span>
              </Link>

              {/* Partner Dashboard Link */}
              {showPartnerLinks && company && (
                <Link 
                  href="/partners/dashboard" 
                  className="transition-colors duration-300 font-medium text-gray-700 hover:text-brand-blue relative group flex items-center gap-2"
                  onClick={() => trackEvent('nav_link_clicked', { link: 'partner_hub', section: 'desktop' })}
                >
                  <Building2 className="w-4 h-4" />
                  PARTNER HUB
                  <span className={`absolute bottom-0 left-0 h-0.5 bg-brand-blue transition-all duration-300 ${
                    isActiveRoute('/partners') ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}></span>
                </Link>
              )}
            </nav>

            {/* Right - Search & Auth */}
            <div className="flex items-center gap-4">
              {/* ✅ ENHANCED SEARCH */}
              <div className="hidden md:block relative">
                <form onSubmit={handleSearch}>
                  <input
                    type="text"
                    placeholder="search tidbits"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-48 px-4 py-2 pr-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green"
                    aria-label="Search tips or navigate to specific day"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <Search className="w-4 h-4 text-gray-400" />
                  </div>
                </form>
              </div>

              {/* Auth section */}
              {shouldShowUserUI ? (
                <div className="relative" data-profile-dropdown>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      trackEvent('profile_dropdown_opened', {
                        user_type: showPartnerLinks ? 'partner' : 'regular'
                      })
                      setShowProfileDropdown(!showProfileDropdown)
                    }}
                    className="flex items-center gap-2 text-gray-700 hover:text-brand-green transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green rounded-lg p-1"
                    aria-expanded={showProfileDropdown}
                    aria-haspopup="menu"
                    aria-label={`User menu for ${getDisplayName()}`}
                  >
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br ${getAvatarColor()} rounded-full hover:ring-2 hover:ring-brand-green/20 transition-all flex items-center justify-center text-xs sm:text-sm font-medium text-white shadow-sm`}>
                      {getUserInitial()}
                    </div>
                    <div className="hidden sm:flex items-center gap-1">
                      <span className="font-medium text-sm">{getDisplayName()}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showProfileDropdown ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {/* Profile Dropdown */}
                  {showProfileDropdown && (
                    <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-[9999] animate-fade-in">
                      <div className="p-3 border-b border-gray-100">
                        <div className="text-sm font-medium text-gray-900">{user.email}</div>
                        {showPartnerLinks && company && (
                          <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {company.name} • {isCompanyAdmin ? 'Admin' : 'Member'}
                          </div>
                        )}
                      </div>
                      
                      <div className="py-2">
                        <button
                          onClick={() => {
                            setShowUserProfile(true)
                            setShowProfileDropdown(false)
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-brand-green transition-colors flex items-center gap-3"
                        >
                          <User className="w-4 h-4" />
                          <div>
                            <div className="font-medium">Personal Profile</div>
                            <div className="text-xs text-gray-500">Your Daily Tidbit profile</div>
                          </div>
                        </button>

                        {showPartnerLinks && partnerInfo && (
                          <button
                            onClick={() => {
                              setShowPartnerProfile(true)
                              setShowProfileDropdown(false)
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-brand-blue transition-colors flex items-center gap-3"
                          >
                            <Building2 className="w-4 h-4" />
                            <div>
                              <div className="font-medium">Partner Profile</div>
                              <div className="text-xs text-gray-500">{partnerInfo.companyName} business profile</div>
                            </div>
                          </button>
                        )}
                      </div>

                      <div className="border-t border-gray-100 p-2">
                        <button
                          onClick={handleSignOut}
                          className="w-full text-left px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors rounded"
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : shouldShowGuestUI ? (
                <button 
                  onClick={openAuthModal} 
                  className="bg-brand-green text-white px-4 py-2 rounded-lg hover:bg-brand-green-dark transition-colors font-medium text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2"
                >
                  LOGIN
                </button>
              ) : (
                <div 
                  className="w-16 h-9 bg-gray-200 animate-pulse rounded-lg" 
                  aria-label="Loading authentication state"
                ></div>
              )}

              {/* Mobile menu toggle */}
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)} 
                className="lg:hidden p-2 text-gray-700 hover:text-brand-green transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green"
                aria-expanded={isMenuOpen}
                aria-label="Toggle mobile menu"
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="lg:hidden border-t border-gray-200 py-4 bg-white/95 backdrop-blur-sm">
              <div className="flex flex-col space-y-4">
                {/* ✅ ENHANCED MOBILE SEARCH */}
                <form onSubmit={handleSearch} className="md:hidden">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="search tidbits"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-3 pr-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-colors"
                      aria-label="Search tips or navigate to specific day"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <Search className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </form>

                <Link href="/start-here" className="block py-3 font-medium text-gray-700 hover:text-brand-green transition-colors" onClick={() => setIsMenuOpen(false)}>
                  AI FOR REAL PEOPLE
                </Link>
                <Link href="/field-guide" className="block py-3 font-medium text-gray-700 hover:text-brand-blue transition-colors" onClick={() => setIsMenuOpen(false)}>
                  FIELD GUIDE
                </Link>
                <Link href="/TidbitLibrary" className="block py-3 font-medium text-gray-700 hover:text-brand-green transition-colors" onClick={() => setIsMenuOpen(false)}>
                  TIDBIT LIBRARY  
                </Link>
                <Link href="/bitboard" className="block py-3 font-medium text-gray-700 hover:text-brand-green transition-colors font-sans" onClick={() => setIsMenuOpen(false)}>
                  BITBOARD
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Modals */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => setShowAuthModal(false)}
        title="Welcome to Daily Tidbit"
        subtitle="Sign in to save, post, and use the Tutor"
        redirectTo={redirectTo}
      />

      {shouldShowUserUI && showUserProfile && (
        <div className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto relative">
            <div className="sticky top-0 bg-white flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 z-10">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Personal Profile</h2>
              <button
                onClick={() => setShowUserProfile(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                aria-label="Close profile"
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

      {shouldShowUserUI && partnerInfo && showPartnerProfile && (
        <PartnerProfileModal
          isOpen={showPartnerProfile}
          onClose={() => setShowPartnerProfile(false)}
          userId={user.id}
          partnerInfo={partnerInfo}
        />
      )}
    </>
  )
}