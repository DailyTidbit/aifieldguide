// src/app/components/ToolModal.tsx - COMPLETELY FIXED SCROLLING
'use client'

import { useEffect } from 'react'
import { AITool } from '../lib/field-guide-types'

interface ToolModalProps {
  tool: AITool
  sectionColor: string
  isOpen: boolean
  onClose: () => void
}

export default function ToolModal({ tool, sectionColor, isOpen, onClose }: ToolModalProps) {
  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Don't prevent body scrolling - let the modal handle its own scrolling
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      {/* Simple scrollable container */}
      <div className="h-full overflow-y-auto">
        <div className="min-h-full flex items-center justify-center py-8">
          <div 
            className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Header */}
            <div 
              className="px-8 py-6 border-b border-gray-200 relative"
              style={{ backgroundColor: `${sectionColor}10` }}
            >
              <div 
                className="absolute top-0 left-0 w-full h-2"
                style={{ backgroundColor: sectionColor }}
              ></div>
              
              <div className="flex items-start justify-between">
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-4 mb-3 flex-wrap">
                    <h2 
                      className="text-3xl md:text-4xl font-bold"
                      style={{ 
                        color: sectionColor,
                        fontFamily: "var(--font-playfair, 'Playfair Display'), serif" 
                      }}
                    >
                      {tool.name}
                    </h2>
                    <span className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm font-semibold">
                      {tool.category}
                    </span>
                  </div>
                  
                  {tool.company && (
                    <p className="text-gray-600 text-lg mb-4">by {tool.company}</p>
                  )}
                  
                  <div className="flex items-center gap-4 flex-wrap">
                    {tool.free_tier && (
                      <span className="inline-flex items-center bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Free Tier
                      </span>
                    )}
                    {tool.login_required && (
                      <span className="inline-flex items-center bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-semibold">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        Login Required
                      </span>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={onClose}
                  className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
                >
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-8">
              <div className="grid lg:grid-cols-4 gap-8">
                
                {/* Main Article Content */}
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
                      >
                        <div 
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
                        <span className="text-sm text-gray-600">Free Tier</span>
                        <span className={`text-sm font-medium ${tool.free_tier ? 'text-green-600' : 'text-orange-600'}`}>
                          {tool.free_tier ? 'Available' : 'Not Available'}
                        </span>
                      </div>
                      <div className="flex flex-col space-y-1">
                        <span className="text-sm text-gray-600">Login Required</span>
                        <span className={`text-sm font-medium ${tool.login_required ? 'text-orange-600' : 'text-green-600'}`}>
                          {tool.login_required ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}