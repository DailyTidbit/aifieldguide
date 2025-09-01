// app/day/[day]/metadata.ts
import { Metadata } from 'next'
import { createServerSupabaseClient } from '../../lib/supabaseServer'

interface GenerateMetadataProps {
  params: Promise<{ day: string }>
}

export async function generateMetadata({ params }: GenerateMetadataProps): Promise<Metadata> {
  try {
    const { day } = await params
    const dayNumber = Number(day)
    
    // Validate day number
    if (isNaN(dayNumber) || dayNumber < 1) {
      return {
        title: 'Daily Tidbit - AI for Real People',
        description: 'Learn practical AI skills one day at a time.',
        robots: { index: false, follow: false }
      }
    }
    
    // Use server client for metadata generation
    const supabase = await createServerSupabaseClient()
    
    // Fetch tidbit data
    const { data: tidbit, error } = await supabase
      .from('tidbits')
      .select(`
        day_number,
        title,
        seo_description,
        tags,
        difficulty_level,
        estimated_time,
        image_url,
        video_url,
        created_at,
        updated_at
      `)
      .eq('day_number', dayNumber)
      .single()

    if (error || !tidbit) {
      console.error('Metadata fetch error:', error)
      return {
        title: `Day ${day} - Daily Tidbit`,
        description: 'Learn practical AI skills one day at a time.',
        robots: { index: false, follow: false }
      }
    }

    // Enhanced title with difficulty and time
    const enhancedTitle = `Day ${tidbit.day_number}: ${tidbit.title} | ${getDifficultyLabel(tidbit.difficulty_level)} (${tidbit.estimated_time} min)`
    
    // Rich description with structured info
    const enhancedDescription = tidbit.seo_description || 
      `${tidbit.title} - A ${getDifficultyLabel(tidbit.difficulty_level).toLowerCase()} ${tidbit.estimated_time}-minute AI lesson. ${tidbit.tags?.join(', ') || 'AI skills'} | Daily Tidbit`

    // Generate structured data
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "LearningResource",
      "@id": `https://dailytidbit.org/day/${tidbit.day_number}`,
      "name": tidbit.title,
      "description": enhancedDescription,
      "url": `https://dailytidbit.org/day/${tidbit.day_number}`,
      "image": tidbit.image_url || "https://cdn.dailytidbit.org/og-default.png",
      "educationalLevel": getDifficultyLabel(tidbit.difficulty_level),
      "timeRequired": `PT${tidbit.estimated_time}M`,
      "learningResourceType": "Tutorial",
      "inLanguage": "en-US",
      "isPartOf": {
        "@type": "Course",
        "name": "Daily Tidbit - AI for Real People",
        "url": "https://dailytidbit.org"
      },
      "author": {
        "@type": "Organization",
        "name": "Daily Tidbit",
        "url": "https://dailytidbit.org"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Daily Tidbit",
        "url": "https://dailytidbit.org",
        "logo": {
          "@type": "ImageObject",
          "url": "https://cdn.dailytidbit.org/logo.png"
        }
      },
      "datePublished": tidbit.created_at,
      "dateModified": tidbit.updated_at,
      "keywords": tidbit.tags?.join(', ') || 'AI, artificial intelligence, tutorial, learning',
      ...(tidbit.video_url && {
        "video": {
          "@type": "VideoObject",
          "name": tidbit.title,
          "description": enhancedDescription,
          "thumbnailUrl": tidbit.image_url,
          "contentUrl": tidbit.video_url,
          "uploadDate": tidbit.created_at,
          "duration": `PT${tidbit.estimated_time}M`
        }
      })
    }

    return {
      metadataBase: new URL('https://dailytidbit.org'),
      title: enhancedTitle,
      description: enhancedDescription,
      
      keywords: [
        tidbit.title.split(' ').slice(0, 3).join(' '), // First few words of title
        ...(tidbit.tags || []),
        'AI tutorial',
        'artificial intelligence',
        'daily learning',
        getDifficultyLabel(tidbit.difficulty_level),
        `${tidbit.estimated_time} minute lesson`,
        'practical AI',
        'AI skills'
      ],

      authors: [{ name: 'Daily Tidbit', url: 'https://dailytidbit.org' }],
      creator: 'Daily Tidbit',
      publisher: 'Daily Tidbit',

      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': tidbit.video_url ? -1 : 0,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },

      openGraph: {
        title: enhancedTitle,
        description: enhancedDescription,
        type: 'article',
        url: `https://dailytidbit.org/day/${tidbit.day_number}`,
        siteName: 'Daily Tidbit',
        locale: 'en_US',
        
        images: [
          {
            url: tidbit.image_url || 'https://cdn.dailytidbit.org/og-default.png',
            width: 1200,
            height: 630,
            alt: `${tidbit.title} - Day ${tidbit.day_number} AI Tutorial`,
            type: 'image/png',
          },
          // Add a fallback image
          {
            url: 'https://cdn.dailytidbit.org/og-image.png',
            width: 1200,
            height: 630,
            alt: 'Daily Tidbit - AI for Real People',
            type: 'image/png',
          }
        ],

        article: {
          publishedTime: tidbit.created_at,
          modifiedTime: tidbit.updated_at,
          section: 'AI Education',
          tags: tidbit.tags || ['AI', 'Tutorial', 'Learning'],
          authors: ['Daily Tidbit']
        },

        ...(tidbit.video_url && {
          videos: [
            {
              url: tidbit.video_url,
              type: 'video/mp4',
              width: 1280,
              height: 720,
            }
          ]
        })
      },

      twitter: {
        card: tidbit.video_url ? 'player' : 'summary_large_image',
        title: enhancedTitle,
        description: enhancedDescription,
        images: [tidbit.image_url || 'https://cdn.dailytidbit.org/og-default.png'],
        creator: '@dailytidbit',
        site: '@dailytidbit',
        
        ...(tidbit.video_url && {
          players: [
            {
              playerUrl: `https://dailytidbit.org/day/${tidbit.day_number}`,
              streamUrl: tidbit.video_url,
              width: 1280,
              height: 720,
            }
          ]
        })
      },

      alternates: {
        canonical: `https://dailytidbit.org/day/${tidbit.day_number}`,
        types: {
          'application/rss+xml': 'https://dailytidbit.org/feed.xml',
          'application/atom+xml': 'https://dailytidbit.org/feed.atom'
        }
      },

      category: 'Education',
      classification: 'AI Education Tutorial',

      other: {
        'article:section': 'AI Education',
        'article:tag': tidbit.tags?.join(', ') || 'AI, Tutorial',
        'educational-level': getDifficultyLabel(tidbit.difficulty_level),
        'time-required': `${tidbit.estimated_time} minutes`,
        'content-type': 'educational-tutorial',
        
        // Breadcrumb structured data
        'breadcrumb': JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": "https://dailytidbit.org"
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "Daily Lessons",
              "item": "https://dailytidbit.org/lessons"
            },
            {
              "@type": "ListItem",
              "position": 3,
              "name": `Day ${tidbit.day_number}`,
              "item": `https://dailytidbit.org/day/${tidbit.day_number}`
            }
          ]
        }),

        // Main structured data
        'structured-data': JSON.stringify(structuredData)
      },

      // Verification tokens (add when you get them)
      verification: {
        // google: 'your-google-verification-token',
        // yandex: 'your-yandex-verification-token',
        // yahoo: 'your-yahoo-verification-token',
      },

      // App-specific metadata
      appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: `Day ${tidbit.day_number} - Daily Tidbit`,
      },

      applicationName: 'Daily Tidbit',
      
      // Performance hints
      viewport: {
        width: 'device-width',
        initialScale: 1,
        viewportFit: 'cover'
      }
    }

  } catch (error) {
    console.error('Error generating metadata:', error)
    
    // Fallback metadata
    return {
      title: `Day ${await params.then(p => p.day)} - Daily Tidbit`,
      description: 'Learn practical AI skills one day at a time with Daily Tidbit.',
      robots: { index: false, follow: true }
    }
  }
}

// Helper function to get difficulty label
function getDifficultyLabel(level: number): string {
  const labels = {
    1: "Beginner",
    2: "Easy", 
    3: "Intermediate",
    4: "Advanced",
    5: "Expert"
  }
  return labels[level as keyof typeof labels] || "Beginner"
}

// Analytics tracking helper for metadata (server-side safe)
export async function trackMetadataView(dayNumber: number, userAgent?: string) {
  try {
    const supabase = await createServerSupabaseClient()
    
    await supabase
      .from('user_analytics_events')
      .insert({
        event_type: 'page_metadata_generated',
        event_data: { 
          day_number: dayNumber,
          user_agent: userAgent 
        },
        tidbit_number: dayNumber,
        created_at: new Date().toISOString()
      })
  } catch (error) {
    // Silently fail for analytics
    console.error('Analytics tracking failed:', error)
  }
}