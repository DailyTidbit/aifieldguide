'use client'

import React, { useState, useEffect } from 'react'
import { Clock, Star, Tag, Play, Users, ArrowRight, CheckCircle, Lightbulb, Target, Camera } from 'lucide-react'
import TidbitTutor from '../../components/TidbitTutor'
import RotatingWord from '../../components/RotatingWord'
import TryOtherAITools from '../../components/TryOtherAITools'
import { supabase } from '../../lib/supabaseClient'

interface TidbitStep {
  id: string
  tidbit_day: number
  step_number: number
  icon?: string
  title: string
  content: string
  created_at: string
}

interface DayPageProps {
  params: Promise<{ day: string }>
}

interface TutorConversation {
  userInput: string
  aiOutput: string
  timestamp: Date
}

export default function DayPage({ params }: DayPageProps) {
  const [resolvedParams, setResolvedParams] = useState<{ day: string } | null>(null)
  const [tidbit, setTidbit] = useState<any>(null)
  const [tidbitSteps, setTidbitSteps] = useState<TidbitStep[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [latestConversation, setLatestConversation] = useState<TutorConversation | null>(null)
  const [user, setUser] = useState<any>(null)

  // Progress tracking functions
  const markTidbitViewed = async (tidbitNumber: number) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('user_tidbit_progress')
        .upsert({
          user_id: user.id,
          tidbit_number: tidbitNumber,
          viewed_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,tidbit_number'
        })

      if (error) {
        console.error('Error marking tidbit viewed:', error)
      }
    } catch (error) {
      console.error('Error updating progress:', error)
    }
  }

  const markTidbitCompleted = async (tidbitNumber: number) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('user_tidbit_progress')
        .upsert({
          user_id: user.id,
          tidbit_number: tidbitNumber,
          completed_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,tidbit_number'
        })

      if (error) {
        console.error('Error marking tidbit completed:', error)
      }
    } catch (error) {
      console.error('Error updating progress:', error)
    }
  }

  const markAIPracticed = async (tidbitNumber: number) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('user_tidbit_progress')
        .upsert({
          user_id: user.id,
          tidbit_number: tidbitNumber,
          practiced_with_ai: true
        }, {
          onConflict: 'user_id,tidbit_number'
        })

      if (error) {
        console.error('Error marking AI practiced:', error)
      }
    } catch (error) {
      console.error('Error updating progress:', error)
    }
  }

  // Resolve params and fetch data
  useEffect(() => {
    async function fetchData() {
      try {
        const resolvedParams = await params
        setResolvedParams(resolvedParams)
        
        const { day } = resolvedParams
        console.log('Day param:', day)

        // Fetch main tidbit data
        const { data, error } = await supabase
          .from('tidbits')
          .select('*')
          .eq('day_number', Number(day))
          .single()

        if (error || !data) {
          setError(error?.message || 'Tidbit not found')
          return
        }

        // Fetch tidbit steps
        const { data: stepsData, error: stepsError } = await supabase
          .from('tidbit_steps')
          .select('*')
          .eq('tidbit_day', Number(day))
          .order('step_number', { ascending: true })

        if (stepsError) {
          console.error('Error fetching steps:', stepsError)
          // Don't fail the whole page if steps can't be loaded
        } else {
          setTidbitSteps(stepsData || [])
        }

        const processedTidbit = {
          ...data,
          day_number: Number(day),
          tags: data.tags || [],
          difficulty_level: data.difficulty_level || 1,
          estimated_time: data.estimated_time || 5,
          seo_description: data.seo_description || data.title
        }

        setTidbit(processedTidbit)
      } catch (err) {
        setError('Failed to load tidbit')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params])

  // Check for user auth and mark tidbit as viewed
  useEffect(() => {
    const initializeUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      // Mark tidbit as viewed when page loads (if user is logged in and tidbit is loaded)
      if (user && tidbit) {
        await markTidbitViewed(tidbit.day_number)
      }
    }
    
    initializeUser()
  }, [tidbit]) // Depend on tidbit so it runs after tidbit is loaded

  // Handle conversation updates from TidbitTutor
  const handleConversationUpdate = async (userInput: string, aiOutput: string) => {
    setLatestConversation({
      userInput,
      aiOutput,
      timestamp: new Date()
    })

    // Mark AI as practiced when user has a conversation
    if (user && tidbit) {
      await markAIPracticed(tidbit.day_number)
    }
  }

  // Simulate completing the walkthrough (you can call this when user finishes reading)
  const handleWalkthroughComplete = async () => {
    if (user && tidbit) {
      await markTidbitCompleted(tidbit.day_number)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50/30 to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#60A875] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tidbit...</p>
        </div>
      </div>
    )
  }

  if (error || !tidbit) {
    return (
      <div className="p-8 text-red-600 text-center">
        <h1 className="text-2xl font-bold">Day {resolvedParams?.day} not found</h1>
        <p>{error}</p>
      </div>
    )
  }

  const getDifficultyLabel = (level: number) => {
    const labels = {
      1: "Beginner",
      2: "Easy", 
      3: "Medium",
      4: "Hard",
      5: "Advanced"
    }
    return labels[level as keyof typeof labels] || "Beginner"
  }

  const getDifficultyColor = (level: number) => {
    const colors = {
      1: "bg-green-100 text-green-800 border-green-200",
      2: "bg-blue-100 text-blue-800 border-blue-200",
      3: "bg-yellow-100 text-yellow-800 border-yellow-200", 
      4: "bg-orange-100 text-orange-800 border-orange-200",
      5: "bg-red-100 text-red-800 border-red-200"
    }
    return colors[level as keyof typeof colors] || colors[1]
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-200 via-emerald-100 to-cyan-200">
      {/* Hero Section */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-emerald-100">
        <div className="max-w-4xl mx-auto px-6 py-12">
          {/* Video as Hero */}
          {tidbit.video_url && (
            <div className="max-w-3xl mx-auto mb-8">
              <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl">
                <video 
                  controls 
                  className="w-full"
                  poster={tidbit.image_url}
                >
                  <source src={tidbit.video_url} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          )}

          {/* Short Description */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 max-w-2xl mx-auto leading-tight" style={{fontFamily: "'Playfair Display', serif"}}>
              {tidbit.title}
            </h1>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Single Column Layout */}
        <div className="space-y-12">
          
          {/* What You'll Learn & What You Need - Combined White Box */}
          <section className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 border border-emerald-200/50 shadow-lg">
            <div className="space-y-8">
              {/* What You'll Learn */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                    <Lightbulb className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900" style={{fontFamily: "'Playfair Display', serif"}}>
                    What You'll Learn
                  </h3>
                </div>
                <RichContent>{tidbit.walkthrough_intro}</RichContent>
              </div>

              {/* What You Need */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900" style={{fontFamily: "'Playfair Display', serif"}}>
                    What You Need
                  </h3>
                </div>
                <RichContent>{tidbit.what_you_need}</RichContent>
              </div>
            </div>
          </section>

          {/* Timeline Walkthrough Steps */}
          <section className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-emerald-200/50 shadow-lg overflow-hidden relative">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-400/20 to-cyan-400/20 rounded-full blur-xl"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-10">
                <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 text-white shadow-lg">
                  <Target className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent" style={{fontFamily: "'Playfair Display', serif"}}>
                    Day {tidbit.day_number}'s Walkthrough Steps
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">Follow this step-by-step journey to master today's skill</p>
                </div>
              </div>

              {/* Timeline Steps */}
              <div className="relative space-y-10 mb-12">
                {/* Animated Timeline Line */}
                <div className="absolute left-8 top-12 bottom-12 w-1 bg-gradient-to-b from-purple-400 via-pink-400 to-indigo-400 hidden sm:block rounded-full shadow-sm">
                  <div className="absolute inset-0 bg-gradient-to-b from-purple-300 via-pink-300 to-indigo-300 rounded-full animate-pulse opacity-60"></div>
                </div>
                
                {tidbitSteps.map((step, index) => (
                  <div key={step.id} className="relative group">
                    {/* Step Card with Enhanced Design */}
                    <div className={`
                      ${index % 2 === 0 
                        ? 'bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 border-purple-200/50' 
                        : 'bg-gradient-to-br from-white via-blue-50/30 to-cyan-50/30 border-blue-200/50'
                      } 
                      rounded-2xl p-8 border-2 shadow-lg hover:shadow-2xl transition-all duration-300
                      sm:ml-20 group-hover:scale-[1.02] transform
                      ${index % 2 === 0 ? 'hover:border-purple-300' : 'hover:border-blue-300'}
                    `}>
                      {/* Enhanced Step Number Badge */}
                      <div className={`
                        absolute -left-4 sm:-left-16 top-8 flex items-center justify-center w-16 h-16 
                        ${index % 2 === 0 
                          ? 'bg-gradient-to-br from-purple-500 via-pink-500 to-indigo-500' 
                          : 'bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500'
                        }
                        text-white rounded-2xl font-bold text-xl shadow-2xl border-4 border-white
                        transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3
                      `}>
                        {step.step_number}
                      </div>

                      {/* Step Content */}
                      <div className="ml-16 sm:ml-0">
                        {/* Title with Enhanced Icon */}
                        <div className="flex items-start gap-4 mb-6">
                          {step.icon && (
                            <div className={`
                              flex-shrink-0 text-4xl p-3 rounded-xl shadow-lg transform transition-transform duration-300 group-hover:scale-110
                              ${index % 2 === 0 
                                ? 'bg-gradient-to-br from-purple-100 to-pink-100' 
                                : 'bg-gradient-to-br from-blue-100 to-cyan-100'
                              }
                            `}>
                              {step.icon}
                            </div>
                          )}
                          <div className="flex-1">
                            <h4 className={`
                              text-2xl sm:text-3xl font-bold leading-tight mb-2 
                              ${index % 2 === 0 
                                ? 'bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent' 
                                : 'bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent'
                              }
                            `} style={{fontFamily: "'Playfair Display', serif"}}>
                              {step.title}
                            </h4>
                            
                            {/* Main Content with better typography */}
                            <div className="text-gray-700 leading-relaxed text-lg">
                              <RichContent>{step.content}</RichContent>
                            </div>
                          </div>
                        </div>

                        {/* Enhanced Step Check Button */}
                        <div className="mt-8 flex justify-end">
                          <button
                            onClick={() => {/* Handle individual step completion */}}
                            className={`
                              inline-flex items-center gap-3 px-6 py-3 rounded-xl font-semibold text-white
                              transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl
                              ${index % 2 === 0 
                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600' 
                                : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'
                              }
                            `}
                          >
                            <CheckCircle className="w-5 h-5" />
                            Complete Step
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Enhanced Final Completion Button */}
              <div className="mt-16 text-center">
                <div className="relative inline-block">
                  {/* Glowing background effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-2xl blur-lg opacity-60 animate-pulse"></div>
                  <button
                    onClick={handleWalkthroughComplete}
                    className="relative inline-flex items-center gap-4 px-12 py-6 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white rounded-2xl hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 transition-all duration-300 font-bold text-xl shadow-2xl hover:shadow-3xl transform hover:scale-110 border-2 border-white"
                  >
                    <CheckCircle className="w-8 h-8" />
                    <span>🎉 Amazing! Mark as Complete</span>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full animate-bounce shadow-lg">
                      ⭐
                    </div>
                  </button>
                </div>
                <p className="text-gray-600 mt-4 text-lg font-medium">You're doing great! Time to celebrate your progress!</p>
              </div>
            </div>
          </section>

          {/* Tidbit Tutor Section */}
          <section className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 border border-emerald-200/50 shadow-lg">
            <TidbitTutor 
              tidbitNumber={tidbit.day_number}
              tidbitTitle={tidbit.title}
              onConversationUpdate={handleConversationUpdate}
              embedded={true}
            />
          </section>

          {/* NEW: Dynamic Try Other AI Tools Component */}
          <TryOtherAITools />

        </div>
      </div>
    </main>
  )
}

function Section({ 
  title, 
  children, 
  icon, 
  gradient, 
  highlight = false 
}: { 
  title: string
  children: string
  icon: React.ReactElement
  gradient: string
  highlight?: boolean
}) {
  return (
    <section className={`${highlight ? 'bg-white/95 backdrop-blur-sm rounded-2xl p-8 border border-emerald-200/50 shadow-lg' : ''}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-2 rounded-lg bg-gradient-to-r ${gradient} text-white`}>
          {icon}
        </div>
        <h3 className="text-2xl font-bold text-gray-900" style={{fontFamily: "'Playfair Display', serif"}}>
          {title}
        </h3>
      </div>
      <RichContent>{children}</RichContent>
    </section>
  )
}

function RichContent({ children }: { children: string }) {
  // Clean up content - handle \r\n, multiple spaces, etc.
  const cleanContent = children
    .replace(/\\r\\n/g, '\n') // Convert escaped \r\n to actual newlines
    .replace(/\r\n/g, '\n')   // Convert actual \r\n to \n
    .replace(/\r/g, '\n')     // Convert lone \r to \n
    .trim()

  const lines = cleanContent.split('\n')
  const elements: React.ReactElement[] = []
  let listBuffer: string[] = []

  const flushList = (keyPrefix: string) => {
    if (listBuffer.length > 0) {
      elements.push(
        <ul key={`ul-${keyPrefix}`} className="list-none space-y-3 ml-0 my-6">
          {listBuffer.map((item, i) => (
            <li key={`li-${keyPrefix}-${i}`} className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-[#60A875] flex-shrink-0 mt-0.5" />
              <span className="text-gray-700 leading-relaxed text-lg">{parseInlineFormatting(item)}</span>
            </li>
          ))}
        </ul>
      )
      listBuffer = []
    }
  }

  // Parse inline formatting like **bold**, *italic*, <br> tags, and links
  const parseInlineFormatting = (text: string): React.ReactElement => {
    // First, split by <br> tags to handle line breaks
    const brParts = text.split('<br>')
    
    return (
      <>
        {brParts.map((brPart, brIndex) => (
          <React.Fragment key={brIndex}>
            {brIndex > 0 && <br />}
            {(() => {
              // Now handle other formatting within each part
              const parts = brPart.split(/(\*\*.*?\*\*|\*.*?\*|https?:\/\/[^\s]+)/g)
              
              return parts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>
                } else if (part.startsWith('*') && part.endsWith('*')) {
                  return <em key={i} className="italic">{part.slice(1, -1)}</em>
                } else if (part.startsWith('http')) {
                  return (
                    <a key={i} href={part} target="_blank" rel="noopener noreferrer" 
                       className="text-[#59B1E3] hover:text-blue-700 underline underline-offset-2">
                      {part}
                    </a>
                  )
                }
                return <span key={i}>{part}</span>
              })
            })()}
          </React.Fragment>
        ))}
      </>
    )
  }

  // Detect numbered circle steps (① ②③④⑤⑥⑦⑧⑨⑩)
  const isNumberedStep = (line: string): boolean => {
    return /^[①②③④⑤⑥⑦⑧⑨⑩]/.test(line.trim())
  }

  // Extract step number from circle
  const getStepNumber = (line: string): string => {
    const circles = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩']
    const match = line.trim().match(/^[①②③④⑤⑥⑦⑧⑨⑩]/)
    if (match) {
      const index = circles.indexOf(match[0])
      return (index + 1).toString()
    }
    return '1'
  }

  lines.forEach((line, i) => {
    const trimmed = line.trim()

    // Handle list items
    if (trimmed.startsWith('- ')) {
      listBuffer.push(trimmed.slice(2))
      return
    }

    // Flush any pending list before processing other content
    flushList(`line-${i}`)

    // Empty lines create spacing
    if (trimmed === '') {
      elements.push(<div key={`space-${i}`} className="h-4" />)
      return
    }

    // Handle images
    if (trimmed.startsWith('<img')) {
      const altMatch = trimmed.match(/alt="([^"]*)"/)
      const altText = altMatch ? altMatch[1] : 'Tidbit image'
      
      elements.push(
        <div key={`img-${i}`} className="my-8">
          <div 
            className="rounded-xl overflow-hidden shadow-lg border border-gray-200"
            dangerouslySetInnerHTML={{ __html: trimmed }}
          />
          <p className="text-sm text-gray-500 text-center mt-3 italic">{altText}</p>
        </div>
      )
      return
    }

    // Handle callout boxes
    if (trimmed.startsWith('✅')) {
      elements.push(
        <div key={`callout-${i}`} className="bg-green-50 border border-green-200 rounded-lg p-4 my-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-green-800 font-medium leading-relaxed">{parseInlineFormatting(trimmed.slice(2).trim())}</p>
          </div>
        </div>
      )
      return
    }

    if (trimmed.startsWith('🧠')) {
      elements.push(
        <div key={`callout-${i}`} className="bg-purple-50 border border-purple-200 rounded-lg p-4 my-6">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <p className="text-purple-800 font-medium leading-relaxed">{parseInlineFormatting(trimmed.slice(2).trim())}</p>
          </div>
        </div>
      )
      return
    }

    if (trimmed.startsWith('📸')) {
      elements.push(
        <div key={`callout-${i}`} className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-6">
          <div className="flex items-start gap-3">
            <Camera className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-blue-800 font-medium leading-relaxed">{parseInlineFormatting(trimmed.slice(2).trim())}</p>
          </div>
        </div>
      )
      return
    }

    // Handle numbered circle steps (① ②③④)
    if (isNumberedStep(trimmed)) {
      const stepNum = getStepNumber(trimmed)
      const stepText = trimmed.replace(/^[①②③④⑤⑥⑦⑧⑨⑩]\s*/, '')
      
      elements.push(
        <div key={`step-${i}`} className="bg-gradient-to-r from-[#60A875]/10 to-[#59B1E3]/10 rounded-xl p-6 border border-[#60A875]/20 my-6">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-8 h-8 bg-[#60A875] text-white rounded-full font-bold text-sm flex-shrink-0">
              {stepNum}
            </div>
            <div className="flex-1">
              <p className="text-gray-900 font-semibold text-lg leading-relaxed">{parseInlineFormatting(stepText)}</p>
            </div>
          </div>
        </div>
      )
      return
    }

    // Handle "Step" prefixed lines (fallback)
    if (trimmed.toLowerCase().startsWith('step ')) {
      elements.push(
        <div key={`step-${i}`} className="bg-gradient-to-r from-[#60A875]/10 to-[#59B1E3]/10 rounded-lg p-4 border border-[#60A875]/20 my-6">
          <div className="flex items-start gap-3">
            <Target className="w-5 h-5 text-[#60A875] flex-shrink-0 mt-0.5" />
            <p className="font-semibold text-[#60A875] text-lg leading-relaxed">{parseInlineFormatting(line)}</p>
          </div>
        </div>
      )
      return
    }

    // Handle example callouts
    if (trimmed.toLowerCase().startsWith('example:')) {
      const exampleText = trimmed.slice(8).trim()
      elements.push(
        <div key={`example-${i}`} className="bg-amber-50 border border-amber-200 rounded-lg p-4 my-6">
          <div className="flex items-start gap-3">
            <div className="text-xl">💡</div>
            <div>
              <p className="font-semibold text-amber-800 mb-2">Example:</p>
              {exampleText && (
                <p className="text-amber-700 leading-relaxed">{parseInlineFormatting(exampleText)}</p>
              )}
            </div>
          </div>
        </div>
      )
      return
    }

    // Handle subject lines and structured content
    if (trimmed.toLowerCase().startsWith('subject:')) {
      elements.push(
        <div key={`subject-${i}`} className="bg-gray-50 border border-gray-200 rounded-lg p-4 my-4">
          <p className="font-mono text-sm text-gray-700">{parseInlineFormatting(trimmed)}</p>
        </div>
      )
      return
    }

    // Handle website URLs
    if (trimmed.match(/^www\./)) {
      elements.push(
        <div key={`url-${i}`} className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center my-6">
          <p className="font-mono text-blue-700 font-semibold text-lg">{trimmed}</p>
          <p className="text-sm text-blue-600 mt-1">→ Open this in your browser</p>
        </div>
      )
      return
    }

    // Regular paragraphs
    elements.push(
      <p key={`p-${i}`} 
         className="text-gray-700 leading-relaxed text-lg my-4" 
         style={{fontFamily: "'Space Grotesk', sans-serif"}}>
        {parseInlineFormatting(line)}
      </p>
    )
  })

  // Flush any remaining list items
  flushList('final')

  return <div className="space-y-2">{elements}</div>
}