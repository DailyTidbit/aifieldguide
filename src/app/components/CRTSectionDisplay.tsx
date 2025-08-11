// app/components/CRTSectionDisplay.tsx - COMPLETE FILE WITH GOLDENEYE EASTER EGG
'use client'

import React, { useState, useCallback, useEffect } from 'react'

interface FieldGuideSection {
  id: string
  section_number: number
  section_name: string
  slug: string
  intro?: string
  summary?: string
  use_cases?: string
  how_they_work?: string
  what_you_can_do?: string
  better_results?: string
  strengths?: string
  limitations?: string
  pro_tips?: string
}

interface CRTSectionDisplayProps {
  section: FieldGuideSection
  sectionColor: string
  sectionEmoji: string
  onChannelChange?: (channel: string) => void
}

export default function CRTSectionDisplay({ 
  section, 
  sectionColor, 
  sectionEmoji,
  onChannelChange 
}: CRTSectionDisplayProps) {
  // Safety check - if no section data, don't render
  if (!section) {
    return (
      <div className="max-w-6xl mx-auto text-center py-20">
        <div className="text-gray-600">Loading section data...</div>
      </div>
    )
  }

  const [activeChannel, setActiveChannel] = useState<string>('summary')
  const [isBooting, setIsBooting] = useState(true)
  const [tvOn, setTvOn] = useState(false)
  const [scanlines, setScanlines] = useState(true)
  const [volumeClickCount, setVolumeClickCount] = useState(0)
  const [showEasterEgg, setShowEasterEgg] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update time every second when easter egg is shown
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (showEasterEgg) {
      interval = setInterval(() => {
        setCurrentTime(new Date())
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [showEasterEgg])

  // CRT boot sequence
  useEffect(() => {
    const bootTimer = setTimeout(() => {
      setTvOn(true)
      const bootCompleteTimer = setTimeout(() => {
        setIsBooting(false)
      }, 1000)
      return () => clearTimeout(bootCompleteTimer)
    }, 300)
    return () => clearTimeout(bootTimer)
  }, [])

  // Easter egg volume functionality - fixed
  const handleVolumeClick = useCallback((direction: 'up' | 'down') => {
    if (!tvOn) return // Only work when TV is on
    
    setVolumeClickCount(prev => {
      const newCount = prev + 1
      console.log(`Volume ${direction} clicked! Count: ${newCount}/5`) // Debug log
      
      if (newCount >= 5) {
        setShowEasterEgg(true)
        
        // Hide easter egg after 5 seconds
        setTimeout(() => {
          setShowEasterEgg(false)
        }, 5000)
        
        return 0 // Reset counter
      }
      
      return newCount
    })
  }, [tvOn])

  // Reset volume counter when TV turns off
  useEffect(() => {
    if (!tvOn) {
      setVolumeClickCount(0)
      setShowEasterEgg(false)
    }
  }, [tvOn])

  const channels = [
    {
      id: 'how-they-work',
      label: 'How They Work',
      icon: '⚙️',
      content: section?.how_they_work || 'Technical details coming soon...'
    },
    {
      id: 'what-you-can-do',
      label: 'What You Can Do',
      icon: '🎯',
      content: section?.what_you_can_do || 'Use cases and applications...'
    },
    {
      id: 'better-results',
      label: 'Better Results',
      icon: '⚡',
      content: section?.better_results || 'Tips for optimization...'
    },
    {
      id: 'strengths',
      label: 'Strengths',
      icon: '💪',
      content: section?.strengths || 'Key advantages...'
    },
    {
      id: 'limitations',
      label: 'Limitations',
      icon: '📝',
      content: section?.limitations || 'Important considerations...'
    },
    {
      id: 'pro-tips',
      label: 'Pro Tips',
      icon: '💡',
      content: section?.pro_tips || 'Expert tips and insider knowledge...'
    }
  ]

  // Summary content for default/unselected state
  const summaryContent = section?.summary || section?.intro || `Welcome to ${section?.section_name || 'this section'}`
  const activeChannelData = activeChannel === 'summary' 
    ? { id: 'summary', label: 'Overview', icon: '📺', content: summaryContent }
    : channels.find(ch => ch.id === activeChannel) || { id: 'summary', label: 'Overview', icon: '📺', content: summaryContent }

  const handleChannelChange = useCallback((channelId: string) => {
    if (!tvOn || isBooting) return
    
    // Handle VHS navigation
    if (channelId === 'rewind') {
      const currentIndex = channels.findIndex(ch => ch.id === activeChannel)
      if (currentIndex > 0) {
        const prevChannel = channels[currentIndex - 1]
        setActiveChannel(prevChannel.id)
        onChannelChange?.(prevChannel.id)
      } else {
        setActiveChannel('summary')
        onChannelChange?.('summary')
      }
    } else if (channelId === 'forward') {
      const currentIndex = channels.findIndex(ch => ch.id === activeChannel)
      if (activeChannel === 'summary') {
        setActiveChannel(channels[0].id)
        onChannelChange?.(channels[0].id)
      } else if (currentIndex < channels.length - 1) {
        const nextChannel = channels[currentIndex + 1]
        setActiveChannel(nextChannel.id)
        onChannelChange?.(nextChannel.id)
      }
    } else {
      // Regular channel selection
      // If clicking the same channel, return to summary
      if (channelId === activeChannel) {
        setActiveChannel('summary')
        onChannelChange?.('summary')
      } else {
        setActiveChannel(channelId)
        onChannelChange?.(channelId)
      }
    }
    
    // Brief static effect when changing channels
    setScanlines(false)
    setTimeout(() => setScanlines(true), 100)
  }, [activeChannel, tvOn, isBooting, onChannelChange, channels])

  return (
    <div className="max-w-6xl mx-auto">
      {/* Channel Selection Buttons - Normal Site Style */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12 max-w-4xl mx-auto">
        {channels.map((channel) => (
          <button
            key={channel.id}
            onClick={() => handleChannelChange(channel.id)}
            disabled={!tvOn || isBooting}
            className={`
              px-6 py-4 rounded-xl font-semibold transition-all duration-300 hover:scale-[1.02] shadow-lg
              ${activeChannel === channel.id 
                ? 'text-white shadow-xl' 
                : 'bg-white/80 hover:bg-white text-gray-700 hover:shadow-xl'
              }
            `}
            style={{
              backgroundColor: activeChannel === channel.id ? sectionColor : undefined,
              fontFamily: "var(--font-space-grotesk, 'Space Grotesk'), sans-serif"
            }}
          >
            <div className="flex items-center justify-center gap-3">
              <span className="text-xl">{channel.icon}</span>
              <span className="text-sm font-bold">{channel.label}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Large CRT TV - Subtle 90s Element */}
      <div className="flex justify-center mb-8">
        <div className="relative">
          {/* TV Main Body - Larger and More Readable */}
          <div className="relative bg-gradient-to-b from-gray-400 via-gray-500 to-gray-600 rounded-lg shadow-2xl border border-gray-400" style={{ width: '1000px', height: '700px' }}>
            
            {/* Subtle Speaker Grilles */}
            <div className="absolute left-8 top-24 bottom-56 w-20 bg-gray-800 rounded-sm overflow-hidden opacity-80">
              <div className="h-full w-full" style={{
                backgroundImage: `repeating-linear-gradient(0deg, #374151 0px, #374151 3px, #4b5563 3px, #4b5563 6px)`,
                backgroundSize: '100% 6px'
              }}></div>
            </div>
            <div className="absolute right-8 top-24 bottom-56 w-20 bg-gray-800 rounded-sm overflow-hidden opacity-80">
              <div className="h-full w-full" style={{
                backgroundImage: `repeating-linear-gradient(0deg, #374151 0px, #374151 3px, #4b5563 3px, #4b5563 6px)`,
                backgroundSize: '100% 6px'
              }}></div>
            </div>

            {/* Daily Tidbitron Branding */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2">
              <span className="text-xl font-bold text-gray-700 tracking-wider opacity-80">
                DAILY TIDBITRON
              </span>
            </div>

            {/* Subtle Power LED */}
            <div className="absolute top-8 right-12">
              <div className={`w-3 h-3 rounded-full ${tvOn ? 'bg-green-400' : 'bg-red-600'} opacity-80 transition-all duration-300`}></div>
            </div>

            {/* Large Screen - adjusted for taller VHS deck */}
            <div className="absolute left-32 right-32 top-20 bottom-56 bg-black rounded-sm border-2 border-gray-700">
              <div className="relative w-full h-full bg-black rounded-sm overflow-hidden border border-gray-800">
                
                {/* Boot sequence */}
                {isBooting && tvOn && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black">
                    <div className="text-center">
                      <div className="text-green-400 text-2xl mb-6 animate-pulse" style={{fontFamily: "var(--font-playfair, 'Playfair Display'), serif"}}>
                        DAILY TIDBITRON v2.0
                      </div>
                      <div className="text-green-300 text-lg mb-4" style={{fontFamily: "var(--font-space-grotesk, 'Space Grotesk'), sans-serif"}}>
                        Loading {section?.section_name || 'Content'}...
                      </div>
                      <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden mx-auto">
                        <div className="h-full bg-green-400 animate-pulse w-full"></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TV Off State */}
                {!tvOn && (
                  <div className="absolute inset-0 bg-black flex items-center justify-center">
                    <div className="text-gray-600 text-xl opacity-60">
                      [NO SIGNAL]
                    </div>
                  </div>
                )}

                {/* Easter Egg Screen - GoldenEye Watch */}
                {showEasterEgg && tvOn && !isBooting && (
                  <div className="absolute inset-0 bg-black flex items-center justify-center z-20">
                    <div className="relative">
                      {/* GoldenEye Watch Image */}
                      <img 
                        src="https://cdn.dailytidbit.org/watch.png" 
                        alt="GoldenEye Watch"
                        className="w-96 h-96 object-contain"
                      />
                      
                      {/* Real Time Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-green-400 text-center mt-8" style={{fontFamily: 'monospace'}}>
                          {/* Main Time Display */}
                          <div className="text-5xl font-bold mb-1 tracking-wider">
                            {currentTime.toLocaleTimeString('en-US', { 
                              hour12: false, 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                          
                          {/* AM/PM */}
                          <div className="text-xl mb-6">
                            {currentTime.toLocaleTimeString('en-US', { 
                              hour12: true 
                            }).split(' ')[1]}
                          </div>
                          
                          {/* Date */}
                          <div className="text-xl font-bold">
                            {currentTime.toLocaleDateString('en-US', { 
                              month: 'numeric', 
                              day: '2-digit' 
                            })} {currentTime.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
                          </div>
                        </div>
                      </div>
                      
                      {/* Dismiss instruction */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-green-400 text-sm opacity-60" style={{fontFamily: 'monospace'}}>
                        CHEAT ACTIVATED - PRESS ANY BUTTON TO CONTINUE
                      </div>
                    </div>
                  </div>
                )}

                {/* Main Content */}
                {tvOn && !isBooting && !showEasterEgg && (
                  <div className="relative h-full overflow-hidden">
                    {/* Subtle Scanlines */}
                    {scanlines && (
                      <div className="absolute inset-0 pointer-events-none z-10 opacity-10">
                        <div className="h-full w-full" style={{
                          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,255,0,0.1) 3px, rgba(0,255,0,0.1) 6px)',
                          animation: 'scanlines 0.2s linear infinite'
                        }}></div>
                      </div>
                    )}

                    {/* Content Area - Gray Background like ToolModal */}
                    <div className="h-full bg-gray-50 text-gray-900 p-12 overflow-y-auto border border-gray-200 rounded-sm">
                      {/* Channel Info Header */}
                      <div className="flex items-center justify-between mb-10 border-b border-gray-200 pb-8">
                        <div className="flex items-center gap-6">
                          <span className="text-5xl">{activeChannelData.icon}</span>
                          <div>
                            <h3 className="text-3xl font-bold text-gray-900" style={{fontFamily: "var(--font-playfair, 'Playfair Display'), serif"}}>
                              {activeChannelData.label}
                            </h3>
                            <p className="text-xl text-gray-600 mt-2" style={{fontFamily: "var(--font-space-grotesk, 'Space Grotesk'), sans-serif"}}>
                              {section?.section_name || 'AI Tools Guide'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Content - Dark Text on Gray Background */}
                      <div className="space-y-8 leading-relaxed">
                        <div 
                          className="text-gray-800 text-xl leading-relaxed"
                          style={{fontFamily: "var(--font-space-grotesk, 'Space Grotesk'), sans-serif"}}
                          dangerouslySetInnerHTML={{
                            __html: activeChannelData.content
                              .replace(/\n\n/g, '</p><p class="mt-8">')
                              .replace(/\n/g, '<br />')
                              .replace(/^/, '<p>')
                              .replace(/$/, '</p>')
                              .replace(/- (.*?)(?=<br|<\/p>)/g, '<span class="flex items-start gap-4 my-4"><span class="text-gray-600 mt-2 text-2xl">▶</span><span class="text-lg">$1</span></span>')
                          }}
                        />
                      </div>
                    </div>

                    {/* Subtle Screen Glare */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/2 to-transparent pointer-events-none"></div>
                  </div>
                )}
              </div>
            </div>

            {/* VHS Deck - Front Panel (Realistic) */}
            <div className="absolute left-32 right-32 bottom-8 h-44 bg-gradient-to-b from-gray-500 to-gray-600 rounded-sm border border-gray-500 shadow-lg">
              
              {/* VHS Slot - More Realistic */}
              <div className="absolute left-1/2 -translate-x-1/2 top-8 w-80 h-8 border-2 border-black rounded-sm">
                <div className="w-full h-full bg-gradient-to-b from-gray-500 to-gray-600"></div>
              </div>

              {/* VHS Label */}
              <div className="absolute left-1/2 -translate-x-1/2 top-18 text-xs text-gray-700 font-semibold">
                VHS
              </div>

              {/* Control Panel Row */}
              <div className="absolute left-8 right-8 bottom-10 flex items-center justify-between">
                
                {/* Left Side - VHS Transport Controls */}
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleChannelChange('rewind')}
                    className="w-10 h-6 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-sm flex items-center justify-center transition-colors text-white text-sm font-bold"
                    title="Previous Section"
                  >
                    ⏪
                  </button>
                  
                  <button 
                    onClick={() => setTvOn(!tvOn)}
                    className="w-10 h-6 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-sm flex items-center justify-center transition-colors text-white text-sm font-bold"
                    title="Play/Stop"
                  >
                    {tvOn ? '⏹️' : '▶️'}
                  </button>
                  
                  <button 
                    onClick={() => handleChannelChange('forward')}
                    className="w-10 h-6 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-sm flex items-center justify-center transition-colors text-white text-sm font-bold"
                    title="Next Section"
                  >
                    ⏩
                  </button>
                  
                  <button 
                    onClick={() => setActiveChannel('summary')}
                    className="w-10 h-6 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-sm flex items-center justify-center transition-colors text-white text-sm font-bold ml-2"
                    title="Eject (Return to Overview)"
                  >
                    ⏏️
                  </button>
                </div>

                {/* Center - VHS Display */}
                <div className="flex items-center gap-3 bg-black px-3 py-1 rounded border border-gray-700">
                  <div className="text-xs text-gray-300">CH</div>
                  <div className="text-sm text-green-400 font-mono min-w-[20px] text-center">
                    {activeChannel === 'summary' ? '00' : String(channels.findIndex(ch => ch.id === activeChannel) + 1).padStart(2, '0')}
                  </div>
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                </div>

                {/* Right Side - TV Controls */}
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-1">
                    <div className="text-xs text-gray-300 text-center">VOL</div>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => handleVolumeClick('down')}
                        className={`w-8 h-6 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-sm flex items-center justify-center text-white text-sm transition-colors ${volumeClickCount > 0 ? 'ring-1 ring-yellow-400' : ''}`}
                        title={`Volume Down ${volumeClickCount > 0 ? `(${volumeClickCount}/5)` : ''}`}
                      >
                        -
                      </button>
                      <button 
                        onClick={() => handleVolumeClick('up')}
                        className={`w-8 h-6 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-sm flex items-center justify-center text-white text-sm transition-colors ${volumeClickCount > 0 ? 'ring-1 ring-yellow-400' : ''}`}
                        title={`Volume Up ${volumeClickCount > 0 ? `(${volumeClickCount}/5)` : ''}`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => {
                      setTvOn(!tvOn)
                      if (!tvOn) {
                        setIsBooting(true)
                        setTimeout(() => setIsBooting(false), 1000)
                      }
                    }}
                    className="w-10 h-10 bg-gray-900 hover:bg-gray-800 border border-gray-600 rounded-full flex items-center justify-center transition-colors relative ml-2"
                    title="Power"
                  >
                    <div className={`absolute inset-2 rounded-full transition-colors ${tvOn ? 'bg-green-400' : 'bg-red-600'}`}></div>
                  </button>
                </div>
              </div>

              {/* Realistic Details */}
              <div className="absolute left-4 top-6 text-xs text-gray-400 opacity-50">
                VHS/TV COMBO
              </div>
              <div className="absolute right-4 top-6 text-xs text-gray-400 opacity-50">
                STEREO
              </div>
            </div>

            {/* Remove the old minimal control panel since we have VHS controls now */}
          </div>

          {/* Subtle TV Glow */}
          {tvOn && (
            <div className="absolute inset-0 bg-blue-400/5 rounded-lg blur-3xl scale-110 pointer-events-none"></div>
          )}
        </div>
      </div>

      {/* Custom CSS */}
      <style jsx>{`
        @keyframes scanlines {
          0% { transform: translateY(0); }
          100% { transform: translateY(6px); }
        }
      `}</style>
    </div>
  )
}