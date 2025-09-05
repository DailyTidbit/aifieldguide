// src/app/components/ToolModal.tsx - FIXED CUT-OFF ISSUES
'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { AITool } from '../lib/field-guide-types'

interface ToolModalProps {
  tool: AITool | null
  sectionColor: string
  isOpen: boolean
  onClose: () => void
  isLoading?: boolean
}

// Loading skeleton component
function ToolModalSkeleton({ sectionColor }: { sectionColor: string }) {
  return (
    <div className="bg-white rounded-t-3xl md:rounded-3xl shadow-2xl w-full max-w-6xl mx-auto relative animate-pulse h-full flex flex-col">
      {/* Header Skeleton */}
      <div 
        className="px-6 md:px-8 py-6 border-b border-gray-200 relative flex-shrink-0"
        style={{ backgroundColor: `${sectionColor}10` }}
      >
        <div 
          className="absolute top-0 left-0 w-full h-2"
          style={{ backgroundColor: sectionColor }}
        />
        
        <div className="flex items-start justify-between">
          <div className="flex-1 pr-4">
            <div className="h-8 md:h-10 bg-gray-200 rounded-lg w-3/4 mb-3" />
            <div className="h-5 bg-gray-200 rounded w-1/2 mb-4" />
            <div className="flex gap-2">
              <div className="h-6 bg-gray-200 rounded-full w-20" />
              <div className="h-6 bg-gray-200 rounded-full w-24" />
            </div>
          </div>
          <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="p-6 md:p-8 flex-1 overflow-auto">
        <div className="grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-4">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
            <div className="h-4 bg-gray-200 rounded w-4/5" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
          </div>
          <div className="lg:col-span-1 space-y-6">
            <div className="h-12 bg-gray-200 rounded-xl" />
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="h-5 bg-gray-200 rounded w-1/2 mb-4" />
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ToolModal({ 
  tool, 
  sectionColor, 
  isOpen, 
  onClose,
  isLoading = false
}: ToolModalProps) {
  const [mounted, setMounted] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const [isClosing, setIsClosing] = useState(false)

  // Mount detection
  useEffect(() => {
    setMounted(true)
  }, [])

  // Enhanced close with animation
  const handleClose = useCallback(() => {
    if (!mounted) return
    setIsClosing(true)
    setTimeout(() => {
      onClose()
      setIsClosing(false)
    }, 200)
  }, [onClose, mounted])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen || !mounted) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleClose, mounted])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (!mounted || !isOpen) return
    
    if (typeof document === 'undefined') return
    
    const originalStyle = window.getComputedStyle(document.body).overflow
    document.body.style.overflow = 'hidden'
    
    return () => {
      document.body.style.overflow = originalStyle
    }
  }, [isOpen, mounted])

  // don't render until mounted
  if (!mounted) return null
  if (!isOpen) return null

  return (
    <div 
      className={`
        fixed inset-0 z-50 bg-black/50 backdrop-blur-sm
        transition-all duration-300 ease-out
        ${isClosing ? 'opacity-0' : 'opacity-100'}
      `}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose()
        }
      }}
    >
      {/* FIXED: Simplified container with proper height constraints */}
      <div className="h-full w-full flex items-center justify-center p-2 sm:p-4">
        <div 
          ref={modalRef}
          className={`
            bg-white w-full max-w-6xl rounded-3xl shadow-2xl
            flex flex-col relative overflow-hidden
            transition-all duration-300 ease-out
            ${isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}
          `}
          style={{
            maxHeight: 'calc(100vh - 1rem)', // Leave 0.5rem top and bottom
            height: 'auto',
            minHeight: '400px'
          }}
          onClick={(e) => e.stopPropagation()}
        >

          {/* Loading or actual content */}
          {(isLoading || !tool) ? (
            <ToolModalSkeleton sectionColor={sectionColor} />
          ) : (
            <>
              {/* Header - Fixed height */}
              <div 
                className="px-6 md:px-8 py-6 border-b border-gray-200 relative flex-shrink-0"
                style={{ backgroundColor: `${sectionColor}10` }}
              >
                <div 
                  className="absolute top-0 left-0 w-full h-2"
                  style={{ backgroundColor: sectionColor }}
                />
                
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-4">
                    <div className="flex items-center gap-4 mb-3 flex-wrap">
                      <h2 
                        className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight"
                        style={{ 
                          color: sectionColor,
                          fontFamily: "var(--font-playfair, 'Playfair Display'), serif" 
                        }}
                      >
                        {tool.name}
                      </h2>
                      <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-semibold">
                        {tool.category}
                      </span>
                    </div>
                    
                    {tool.company && (
                      <p className="text-gray-600 text-base md:text-lg mb-4">by {tool.company}</p>
                    )}
                    
                    <div className="flex items-center gap-3 flex-wrap">
                      {tool.free_tier ? (
                        <span className="inline-flex items-center bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Free Tier
                        </span>
                      ) : (
                        <span className="inline-flex items-center bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-semibold">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                          Paid Only
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Close button */}
                  <button
                    onClick={handleClose}
                    className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
                    aria-label="Close modal"
                  >
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* FIXED: Scrollable Content with proper overflow */}
              <div className="flex-1 overflow-y-auto min-h-0">
                <div className="p-6 md:p-8">
                  <div className="grid lg:grid-cols-4 gap-8">
                    
                    {/* Main Content */}
                    <div className="lg:col-span-3">
                      {tool.detailed_description ? (
                        <div className="prose prose-lg max-w-none">
                          <div 
                            className="text-gray-800 leading-relaxed"
                            style={{
                              fontFamily: "var(--font-space-grotesk, 'Space Grotesk'), sans-serif",
                              fontSize: "1.125rem",
                              lineHeight: "1.7"
                            }}
                            dangerouslySetInnerHTML={{
                              __html: tool.detailed_description
                                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                                .replace(/\n\*/g, '<br/>• ')
                                .replace(/^\*/g, '• ')
                                .replace(/\n(Pricing|Login & Model|Features|Enterprise|Overview):/g, '<br/><strong>$1:</strong>')
                                .replace(/\n/g, '<br/>')
                            }}
                          />
                        </div>
                      ) : (
                        <div className="prose prose-lg max-w-none">
                          <div 
                            className="text-gray-700 leading-relaxed text-lg"
                            style={{fontFamily: "var(--font-space-grotesk, 'Space Grotesk'), sans-serif"}}
                          >
                            <p className="mb-6">{tool.description}</p>
                            
                            {tool.use_cases && (
                              <div className="mt-8">
                                <h4 
                                  className="text-xl font-bold mb-3"
                                  style={{ 
                                    color: sectionColor,
                                    fontFamily: "var(--font-playfair, 'Playfair Display'), serif"
                                  }}
                                >
                                  Use Cases
                                </h4>
                                <p className="text-gray-700 leading-relaxed bg-blue-50 p-4 rounded-xl border border-blue-200">
                                  {tool.use_cases}
                                </p>
                              </div>
                            )}

                            <div className="mt-8 text-center py-8 bg-gray-50 rounded-xl">
                              <div className="text-4xl mb-2">📋</div>
                              <p className="text-gray-600">
                                Detailed information coming soon for this tool.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                      
                      {/* CTA Button */}
                      {tool.website && (
                        <div>
                          <a
                            href={tool.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full text-white px-6 py-4 rounded-xl font-bold text-center transition-all duration-300 hover:scale-105 flex items-center justify-center gap-3 group shadow-lg hover:shadow-xl"
                            style={{
                              background: `linear-gradient(135deg, ${sectionColor}, ${sectionColor}dd)`,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = `linear-gradient(135deg, ${sectionColor}ee, ${sectionColor}cc)`
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = `linear-gradient(135deg, ${sectionColor}, ${sectionColor}dd)`
                            }}
                          >
                            <span>Try {tool.name}</span>
                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                      )}

                      {/* Quick Facts */}
                      <div className="bg-gray-50 rounded-xl p-6">
                        <h4 className="text-lg font-bold mb-4 text-gray-800">Quick Facts</h4>
                        <div className="space-y-4">
                          <div className="flex flex-col space-y-1">
                            <span className="text-sm text-gray-600">Category</span>
                            <span className="text-sm font-medium text-gray-800">{tool.category}</span>
                          </div>
                          {tool.company && (
                            <div className="flex flex-col space-y-1">
                              <span className="text-sm text-gray-600">Company</span>
                              <span className="text-sm font-medium text-gray-800">{tool.company}</span>
                            </div>
                          )}
                          <div className="flex flex-col space-y-1">
                            <span className="text-sm text-gray-600">Pricing</span>
                            <span className={`text-sm font-medium ${tool.free_tier ? 'text-brand-greenDark' : 'text-orange-600'}`}>
                              {tool.free_tier ? 'Free tier available' : 'Paid only'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}