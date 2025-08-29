// src/app/components/Navigation.tsx - Enhanced with animations and improvements
'use client'

import { useState, useEffect, useMemo } from 'react'
import { Search, User, Menu, X, Sparkles, Compass, Building2, ChevronDown } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '../hooks/useAuth'
import AuthModal from './AuthModal'
import UserProfile from './UserProfile'
import PartnerProfileModal from './PartnerProfileModal'
import type { PartnerInfo } from './types/partner'

// Analytics helper function
const trackEvent = (eventName: string, parameters: Record<string, any> = {}) => {
  if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
    ;(window as any).gtag('event', eventName, {
      event_category: 'navigation',
      ...parameters
    })
  }
}

export default function Navigation() {
  const { user, authState, company, isCompanyAdmin, signOut } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [todaysTidbit, setTodaysTidbit] = useState<number | null>(null)
  const [todaysTidbitLoading, setTodaysTidbitLoading] = useState(true)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showUserProfile, setShowUserProfile] = useState(false)
  const [showPartnerProfile, setShowPartnerProfile] = useState(false)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)

  const pathname = usePathname()

  // Send users back to the current page after OAuth
  const redirectTo = useMemo(() => (
    typeof window !== 'undefined' ? window.location.href : null
  ), [])

  // Convert company data to PartnerInfo format for compatibility
  const partnerInfo: PartnerInfo | null = useMemo(() => {
    if (!user?.companyMembership || !company) return null
    
    return {
      companyId: company.id,
      companyName: company.name || '',
      role: user.companyMembership.role,
      memberSince: user.companyMembership.created_at || new Date().toISOString()
    }
  }, [user?.companyMembership, company])

  // Check if current path is active
  const isActiveRoute = (route: string) => {
    if (route === '/' && pathname === '/') return true
    if (route !== '/' && pathname.startsWith(route)) return true
    if (route === `/day/${todaysTidbit}` && pathname === `/day/${todaysTidbit}`) return true
    return false
  }

  // Track auth loading state
  useEffect(() => {
    if (authState !== 'loading') {
      setAuthLoading(false)
    }
  }, [authState])

  useEffect(() => {
    // Get today's tidbit number via API route
    let cancelled = false
    ;(async () => {
      try {
        setTodaysTidbitLoading(true)
        console.log('Fetching today\'s tidbit via API...')
        const res = await fetch('/api/today', { cache: 'no-store' })
        const json = await res.json()
        console.log('API /today response:', json)
        if (!cancelled) {
          const dayNumber = json?.day_number ?? null
          setTodaysTidbit(dayNumber)
          console.log('Set today\'s tidbit to:', dayNumber)
        }
      } catch (e) {
        console.error('fetch /api/today failed:', e)
        if (!cancelled) setTodaysTidbit(null)
      } finally {
        if (!cancelled) setTodaysTidbitLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  // Close auth modal when user signs in
  useEffect(() => {
    if (user && showAuthModal) {
      setShowAuthModal(false)
    }
  }, [user, showAuthModal])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    const queryTrimmed = searchQuery.trim()
    
    // Smart detection for day-specific queries in navigation
    const dayMatch = queryTrimmed.match(/^(?:(?:day|tidbit)\s+)?(\d+)$/i)
    if (dayMatch) {
      const dayNum = parseInt(dayMatch[1], 10)
      // Navigate directly to the day page instead of search
      window.location.href = `/day/${dayNum}`
      return
    }

    // Regular search - go to search page
    window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`
  }

  const handleSignOut = async () => {
    await signOut()
    window.location.reload()
  }

  const openAuthModal = () => {
    trackEvent('auth_modal_opened', {
      trigger: 'login_button'
    })
    setShowAuthModal(true)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowProfileDropdown(false)
    if (showProfileDropdown) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showProfileDropdown])

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  // Get display name from user - improved logic
  const getDisplayName = () => {
    if (!user) return ''
    
    // Try different sources for the user's name
    const sources = [
      user.user_metadata?.full_name,
      user.user_metadata?.name,
      user.profile?.full_name,
      user.email?.split('@')[0]
    ]
    
    const name = sources.find(source => source && source.trim() && source !== 'DAILY TIDBIT')
    return name || 'User'
  }

  // Get user initial
  const getUserInitial = () => {
    const name = getDisplayName()
    return name.charAt(0).toUpperCase()
  }

  // Get avatar color based on user ID - using brand colors only
  const getAvatarColor = () => {
    if (!user) return 'from-gray-400 to-gray-500'
    
    const colors = [
      'from-[#60A875] to-[#4a8660]',  // Brand green
      'from-[#59B1E3] to-[#4a94c7]',  // Brand blue
      'from-[#60A875] to-[#59B1E3]',  // Brand gradient
      'from-[#59B1E3] to-[#60A875]'   // Reverse brand gradient
    ]
    
    // Use user ID to consistently pick a color
    const index = user.id.charCodeAt(0) % colors.length
    return colors[index]
  }

  // Show partner links only if user has company access
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
                />
              </Link>
            </div>

            {/* Center - Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-8">
              <Link 
                href="/start-here" 
                className="transition-colors duration-300 font-medium text-gray-700 hover:text-[#60A875] relative group"
                onClick={() => trackEvent('nav_link_clicked', { link: 'start_here', section: 'desktop' })}
              >
                AI FOR REAL PEOPLE
                <span className={`absolute bottom-0 left-0 h-0.5 bg-[#60A875] transition-all duration-300 ${
                  isActiveRoute('/start-here') ? 'w-full' : 'w-0 group-hover:w-full'
                }`}></span>
              </Link>

              <Link 
                href="/field-guide" 
                className="transition-colors duration-300 font-medium text-gray-700 hover:text-[#59B1E3] relative group flex items-center gap-2"
                onClick={() => trackEvent('nav_link_clicked', { link: 'field_guide', section: 'desktop' })}
              >
                <Compass className="w-4 h-4" />
                FIELD GUIDE
                <span className={`absolute bottom-0 left-0 h-0.5 bg-[#59B1E3] transition-all duration-300 ${
                  isActiveRoute('/field-guide') ? 'w-full' : 'w-0 group-hover:w-full'
                }`}></span>
              </Link>

              {/* Today's Tidbit with loading state */}
              {todaysTidbitLoading ? (
                <div className="bg-gray-200 animate-pulse rounded-full px-6 py-2 h-10 w-48"></div>
              ) : (
                (todaysTidbit ?? 0) > 0 && (
                  <Link 
                    href={`/day/${todaysTidbit}`} 
                    className="transition-all duration-300 hover:scale-105"
                    onClick={() => trackEvent('todays_tidbit_clicked', { 
                      day_number: todaysTidbit,
                      source: 'navigation' 
                    })}
                  >
                    <div className={`bg-gradient-to-r from-[#60A875] to-[#59B1E3] text-white px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 ${
                      isActiveRoute(`/day/${todaysTidbit}`) ? 'ring-2 ring-white/30' : ''
                    }`}>
                      <Sparkles className="w-4 h-4" />
                      <span>TODAY'S TIDBIT</span>
                      <div className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">#{todaysTidbit}</div>
                    </div>
                  </Link>
                )
              )}
              
              <Link 
                href="/TidbitLibrary" 
                className="transition-colors duration-300 font-medium text-gray-700 hover:text-[#60A875] relative group"
                onClick={() => trackEvent('nav_link_clicked', { link: 'tidbit_library', section: 'desktop' })}
              >
                TIDBIT LIBRARY
                <span className={`absolute bottom-0 left-0 h-0.5 bg-[#60A875] transition-all duration-300 ${
                  isActiveRoute('/TidbitLibrary') ? 'w-full' : 'w-0 group-hover:w-full'
                }`}></span>
              </Link>

              <Link 
                href="/bitboard" 
                className="transition-colors duration-300 font-medium text-gray-700 hover:text-[#60A875] relative group" 
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                onClick={() => trackEvent('nav_link_clicked', { link: 'bitboard', section: 'desktop' })}
              >
                BITBOARD
                <span className={`absolute bottom-0 left-0 h-0.5 bg-[#60A875] transition-all duration-300 ${
                  isActiveRoute('/bitboard') ? 'w-full' : 'w-0 group-hover:w-full'
                }`}></span>
              </Link>

              {/* Partner Dashboard Link (only if has company access) */}
              {showPartnerLinks && company && (
                <Link 
                  href="/partners/dashboard" 
                  className="transition-colors duration-300 font-medium text-gray-700 hover:text-[#59B1E3] relative group flex items-center gap-2"
                  onClick={() => trackEvent('nav_link_clicked', { link: 'partner_hub', section: 'desktop' })}
                >
                  <Building2 className="w-4 h-4" />
                  PARTNER HUB
                  <span className={`absolute bottom-0 left-0 h-0.5 bg-[#59B1E3] transition-all duration-300 ${
                    isActiveRoute('/partners') ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}></span>
                </Link>
              )}
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
                    className="w-48 px-4 py-2 pr-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#60A875]/20 focus:border-[#60A875] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A875]"
                    aria-label="Search tips"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <Search className="w-4 h-4 text-gray-400" />
                  </div>
                </form>
              </div>

              {authLoading ? (
                <div className="w-8 h-8 bg-gray-200 animate-pulse rounded-full"></div>
              ) : user ? (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      trackEvent('profile_dropdown_opened', {
                        user_type: showPartnerLinks ? 'partner' : 'regular'
                      })
                      setShowProfileDropdown(!showProfileDropdown)
                    }}
                    className="flex items-center gap-2 text-gray-700 hover:text-[#60A875] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A875] rounded-lg p-1"
                    aria-expanded={showProfileDropdown}
                    aria-haspopup="menu"
                  >
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br ${getAvatarColor()} rounded-full hover:ring-2 hover:ring-[#60A875]/20 transition-all flex items-center justify-center text-xs sm:text-sm font-medium text-white shadow-sm`}>
                      {getUserInitial()}
                    </div>
                    <div className="hidden sm:flex items-center gap-1">
                      <span className="font-medium text-sm">{getDisplayName()}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showProfileDropdown ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {/* Enhanced Profile Dropdown */}
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
                        {/* Show auth state for debugging/info */}
                        {authState === 'needs-password-setup' && (
                          <div className="text-xs text-amber-600 mt-1">
                            Complete setup required
                          </div>
                        )}
                      </div>
                      
                      <div className="py-2">
                        <button
                          onClick={() => {
                            trackEvent('profile_action', {
                              action: 'personal_profile_opened',
                              source: 'dropdown'
                            })
                            setShowUserProfile(true)
                            setShowProfileDropdown(false)
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#60A875] transition-colors flex items-center gap-3"
                        >
                          <User className="w-4 h-4" />
                          <div>
                            <div className="font-medium">Personal Profile</div>
                            <div className="text-xs text-gray-500">Your Daily Tidbit profile</div>
                          </div>
                        </button>

                        {/* Partner profile option only if has company access */}
                        {showPartnerLinks && partnerInfo && (
                          <button
                            onClick={() => {
                              trackEvent('profile_action', {
                                action: 'partner_profile_opened',
                                source: 'dropdown',
                                company_name: partnerInfo.companyName
                              })
                              setShowPartnerProfile(true)
                              setShowProfileDropdown(false)
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#59B1E3] transition-colors flex items-center gap-3"
                          >
                            <Building2 className="w-4 h-4" />
                            <div>
                              <div className="font-medium">Partner Profile</div>
                              <div className="text-xs text-gray-500">{partnerInfo.companyName} business profile</div>
                            </div>
                          </button>
                        )}

                        {/* Partner dashboard links only if has company access */}
                        {showPartnerLinks && (
                          <>
                            <div className="border-t border-gray-100 my-2"></div>
                            <Link
                              href="/partners/dashboard"
                              onClick={() => setShowProfileDropdown(false)}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#59B1E3] transition-colors"
                            >
                              Partner Dashboard
                            </Link>
                            <Link
                              href="/partners/settings"
                              onClick={() => setShowProfileDropdown(false)}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#59B1E3] transition-colors"
                            >
                              Partner Settings
                            </Link>
                          </>
                        )}

                        {/* Show setup/access links for non-full-access users */}
                        {user && authState === 'needs-password-setup' && (
                          <>
                            <div className="border-t border-gray-100 my-2"></div>
                            <Link
                              href="/partners/setup"
                              onClick={() => setShowProfileDropdown(false)}
                              className="block px-4 py-2 text-sm text-amber-600 hover:bg-amber-50 transition-colors"
                            >
                              Complete Setup
                            </Link>
                          </>
                        )}
                      </div>

                      <div className="border-t border-gray-100 p-2">
                        <button
                          onClick={() => {
                            trackEvent('user_action', {
                              action: 'sign_out',
                              source: 'profile_dropdown'
                            })
                            handleSignOut()
                            setShowProfileDropdown(false)
                          }}
                          className="w-full text-left px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors rounded"
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button 
                  onClick={openAuthModal} 
                  className="bg-[#60A875] text-black px-4 py-2 rounded-lg hover:bg-[#5a9a6f] transition-colors font-medium text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A875] focus-visible:ring-offset-2"
                >
                  LOGIN
                </button>
              )}

              <button 
                onClick={() => {
                  trackEvent('mobile_menu_toggled', {
                    action: isMenuOpen ? 'closed' : 'opened'
                  })
                  setIsMenuOpen(!isMenuOpen)
                }} 
                className="lg:hidden p-2 text-gray-700 hover:text-[#60A875] transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A875]"
                aria-expanded={isMenuOpen}
                aria-label="Toggle mobile menu"
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Enhanced Mobile Menu with animations */}
          <div className={`lg:hidden overflow-hidden transition-all duration-300 ease-out ${
            isMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
          }`}>
            {/* Backdrop blur overlay */}
            {isMenuOpen && (
              <div className="fixed inset-0 bg-black/10 backdrop-blur-sm z-[-1] animate-fade-in" 
                   onClick={() => setIsMenuOpen(false)} />
            )}
            
            <div className="border-t border-gray-200 py-4 bg-white/95 backdrop-blur-sm">
              <div className="flex flex-col space-y-4">
                <form onSubmit={handleSearch} className="md:hidden animate-slide-up nav-delay-100">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search tips..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-3 pr-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#60A875]/20 focus:border-[#60A875] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A875]"
                      aria-label="Search tips"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <Search className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </form>

                <Link 
                  href="/start-here" 
                  className={`block py-3 font-medium transition-colors duration-300 animate-slide-up nav-delay-200 rounded-lg px-2 ${
                    isActiveRoute('/start-here') 
                      ? 'bg-[#60A875]/5 text-gray-700' 
                      : 'text-gray-700 hover:text-[#60A875] hover:bg-gray-50'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  AI FOR REAL PEOPLE
                </Link>

                <Link 
                  href="/field-guide" 
                  className={`block py-3 font-medium transition-colors duration-300 flex items-center gap-2 animate-slide-up nav-delay-300 rounded-lg px-2 ${
                    isActiveRoute('/field-guide') 
                      ? 'bg-[#59B1E3]/5 text-gray-700' 
                      : 'text-gray-700 hover:text-[#59B1E3] hover:bg-gray-50'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Compass className="w-4 h-4" />
                  FIELD GUIDE
                </Link>

                {/* Today's Tidbit with loading state */}
                {todaysTidbitLoading ? (
                  <div className="bg-gray-200 animate-pulse rounded-lg px-4 py-3 h-12 animate-slide-up nav-delay-400"></div>
                ) : (
                  (todaysTidbit ?? 0) > 0 && (
                    <Link href={`/day/${todaysTidbit}`} className="block py-2 animate-slide-up nav-delay-400" onClick={() => setIsMenuOpen(false)}>
                      <div className={`bg-gradient-to-r from-[#60A875] to-[#59B1E3] text-white px-4 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg transition-all duration-300 hover:shadow-xl ${
                        isActiveRoute(`/day/${todaysTidbit}`) ? 'ring-2 ring-white/30' : ''
                      }`}>
                        <Sparkles className="w-4 h-4" />
                        <span>TODAY'S TIDBIT #{todaysTidbit}</span>
                      </div>
                    </Link>
                  )
                )}
                
                <Link 
                  href="/TidbitLibrary" 
                  className={`block py-3 font-medium transition-colors duration-300 animate-slide-up nav-delay-500 rounded-lg px-2 ${
                    isActiveRoute('/TidbitLibrary') 
                      ? 'bg-[#60A875]/5 text-gray-700' 
                      : 'text-gray-700 hover:text-[#60A875] hover:bg-gray-50'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  TIDBIT LIBRARY
                </Link>
                
                <Link 
                  href="/bitboard" 
                  className={`block py-3 font-medium transition-colors duration-300 animate-slide-up nav-delay-600 rounded-lg px-2 ${
                    isActiveRoute('/bitboard') 
                      ? 'bg-[#60A875]/5 text-gray-700' 
                      : 'text-gray-700 hover:text-[#60A875] hover:bg-gray-50'
                  }`}
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }} 
                  onClick={() => setIsMenuOpen(false)}
                >
                  BITBOARD
                </Link>

                {/* Partner hub link only if has company access */}
                {showPartnerLinks && company && (
                  <Link 
                    href="/partners/dashboard" 
                    className={`block py-3 font-medium transition-colors duration-300 flex items-center gap-2 animate-slide-up nav-delay-700 rounded-lg px-2 ${
                      isActiveRoute('/partners') 
                        ? 'bg-[#59B1E3]/5 text-gray-700' 
                        : 'text-gray-700 hover:text-[#59B1E3] hover:bg-gray-50'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Building2 className="w-4 h-4" />
                    PARTNER HUB
                  </Link>
                )}

                {user && (
                  <div className="border-t border-gray-200 pt-4 space-y-2 animate-slide-up nav-delay-800">
                    <button 
                      onClick={() => { 
                        setShowUserProfile(true)
                        setIsMenuOpen(false) 
                      }} 
                      className="w-full text-left py-3 text-gray-700 hover:text-[#60A875] hover:bg-gray-50 font-medium transition-colors duration-300 flex items-center gap-2 rounded-lg px-2"
                    >
                      <User className="w-4 h-4" />
                      Personal Profile
                    </button>
                    
                    {/* Partner profile only if has company access */}
                    {showPartnerLinks && partnerInfo && (
                      <button 
                        onClick={() => { 
                          setShowPartnerProfile(true)
                          setIsMenuOpen(false) 
                        }} 
                        className="w-full text-left py-3 text-gray-700 hover:text-[#60A875] hover:bg-gray-50 font-medium transition-colors duration-300 flex items-center gap-2 rounded-lg px-2"
                      >
                        <Building2 className="w-4 h-4" />
                        Partner Profile ({partnerInfo.companyName})
                      </button>
                    )}

                    {/* Show setup/access links for non-full-access users */}
                    {user && authState === 'needs-password-setup' && (
                      <>
                        <div className="border-t border-gray-100 my-2"></div>
                        <Link
                          href="/partners/setup"
                          onClick={() => setIsMenuOpen(false)}
                          className="block py-3 text-amber-600 hover:text-amber-700 hover:bg-amber-50 font-medium transition-colors duration-300 rounded-lg px-2"
                        >
                          Complete Setup Required
                        </Link>
                      </>
                    )}
                  </div>
                )}

                {!user && (
                  <button 
                    onClick={() => { openAuthModal(); setIsMenuOpen(false) }} 
                    className="w-full text-left py-3 text-gray-700 hover:text-[#60A875] hover:bg-gray-50 font-medium transition-colors duration-300 animate-slide-up nav-delay-900 rounded-lg px-2"
                  >
                    LOGIN / SIGN UP
                  </button>
                )}
              </div>
            </div>
          </div>
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

      {/* Personal User Profile Modal - Fixed z-index */}
      {user && showUserProfile && (
        <div className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto relative">
            <div className="sticky top-0 bg-white flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 z-10">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Personal Profile</h2>
              <button
                onClick={() => setShowUserProfile(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A875]"
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

      {/* Partner Profile Modal */}
      {user && partnerInfo && showPartnerProfile && (
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