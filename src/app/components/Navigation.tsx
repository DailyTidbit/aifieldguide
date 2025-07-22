'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

export default function Navigation() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(path)
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left - Navigation Links */}
          <nav className="flex items-center space-x-8">
            <Link 
              href="/" 
              className={`transition-colors font-medium ${
                isActive('/') 
                  ? 'text-[#59B1E3]' 
                  : 'text-gray-700 hover:text-[#60A875]'
              }`}
            >
              HOME
            </Link>
            <Link 
              href="/start-here" 
              className={`transition-colors font-medium ${
                isActive('/start-here') 
                  ? 'text-[#59B1E3]' 
                  : 'text-gray-700 hover:text-[#60A875]'
              }`}
            >
              AI FOR REAL PEOPLE
            </Link>
            <Link 
              href="/TidbitLibrary" 
              className={`transition-colors font-medium ${
                isActive('/TidbitLibrary') 
                  ? 'text-[#59B1E3]' 
                  : 'text-gray-700 hover:text-[#60A875]'
              }`}
            >
              TIDBIT LIBRARY
            </Link>
            <Link 
              href="/bitboard" 
              className={`transition-colors font-medium ${
                isActive('/bitboard') 
                  ? 'text-[#59B1E3]' 
                  : 'text-gray-700 hover:text-[#60A875]'
              }`}
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              TIDBIT CREATORS BOARD
            </Link>
          </nav>

          {/* Right Side - Logo, Search & Login */}
          <div className="flex items-center gap-4">
            {/* Logo */}
            <Image
              src="https://cdn.dailytidbit.org/Logo/logoheader40.png"
              alt="Daily Tidbit Logo"
              width={40}
              height={40}
              className="h-10 w-10"
            />

            {/* Search Box */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search tips..."
                className="w-48 px-4 py-2 pr-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#60A875]/20 focus:border-[#60A875] transition-colors"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Login Button */}
            <button className="bg-[#60A875] text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors font-medium text-sm">
              LOGIN
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}