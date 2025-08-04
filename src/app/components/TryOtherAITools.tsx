'use client'

import React, { useState, useMemo } from 'react';
import { Brain, Image, Video, Mic, Code, Music, Search, Sparkles, Target, ChevronDown, ChevronUp, Bot, ImageIcon } from 'lucide-react';

interface AITool {
  name: string;
  url: string;
  description: string;
  popular?: boolean;
}

interface AICategory {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  tools: AITool[];
}

const AI_CATEGORIES: AICategory[] = [
  {
    id: 'language',
    name: 'Language Models',
    icon: Brain,
    color: 'from-blue-500 to-cyan-500',
    tools: [
      { name: 'ChatGPT (OpenAI)', url: 'https://chat.openai.com/', description: 'Most popular AI assistant worldwide' },
      { name: 'Claude (Anthropic)', url: 'https://claude.ai/', description: 'Advanced reasoning and helpful responses' },
      { name: 'Gemini (Google)', url: 'https://gemini.google.com/', description: 'Google\'s multimodal AI assistant' },
      { name: 'Microsoft Copilot', url: 'https://copilot.microsoft.com/', description: 'Integrated with Microsoft ecosystem' },
      { name: 'Poe by Quora', url: 'https://poe.com/', description: 'Access multiple AI models in one place' },
      { name: 'Pi (Inflection)', url: 'https://pi.ai/', description: 'Personal intelligence assistant' },
      { name: 'Mistral Chat', url: 'https://chat.mistral.ai/', description: 'European open-source AI model' },
      { name: 'Grok (xAI)', url: 'https://grok.x.ai/', description: 'Elon Musk\'s AI assistant with real-time edge' },
      { name: 'Meta AI (Llama)', url: 'https://www.meta.ai/', description: 'LLaMA-based model by Meta' }
    ]
  },
  {
    id: 'image',
    name: 'Image Generation',
    icon: Image,
    color: 'from-purple-500 to-pink-500',
    tools: [
      { name: 'DALL·E 3 (OpenAI)', url: 'https://chat.openai.com/', description: 'High-quality image generation from text' },
      { name: 'Midjourney', url: 'https://www.midjourney.com/', description: 'Artistic AI image creation platform' },
      { name: 'Adobe Firefly', url: 'https://firefly.adobe.com/', description: 'Commercially safe AI art generation' },
      { name: 'Stable Diffusion XL', url: 'https://stability.ai/', description: 'Open-source image generation' },
      { name: 'Leonardo AI', url: 'https://leonardo.ai/', description: 'Game and content creation focused' },
      { name: 'Ideogram', url: 'https://ideogram.ai/', description: 'Excellent at text rendering in images' },
      { name: 'Flux.1', url: 'https://replicate.com/black-forest-labs/flux-schnell', description: 'Latest open-source model' },
      { name: 'Canva AI', url: 'https://www.canva.com/ai-image-generator/', description: 'AI images with design tools' },
      { name: 'Playground AI', url: 'https://playground.ai/', description: 'User-friendly image generation' },
      { name: 'DreamStudio', url: 'https://dreamstudio.ai/', description: 'Stability AI\'s official platform' }
    ]
  },
  {
    id: 'video',
    name: 'Video Generation',
    icon: Video,
    color: 'from-red-500 to-orange-500',
    tools: [
      { name: 'Runway ML', url: 'https://runwayml.com/', description: 'Professional AI video editing and generation' },
      { name: 'Pika Labs', url: 'https://pika.art/', description: 'Text and image to video generation' },
      { name: 'Stable Video Diffusion', url: 'https://stability.ai/stable-video', description: 'Open-source video generation' },
      { name: 'LumaLabs Dream Machine', url: 'https://lumalabs.ai/', description: '3D and realistic video generation' },
      { name: 'Sora (OpenAI)', url: 'https://openai.com/sora/', description: 'High-quality text-to-video (limited access)' },
      { name: 'Synthesia', url: 'https://www.synthesia.io/', description: 'AI avatar video creation for business' },
      { name: 'HeyGen', url: 'https://www.heygen.com/', description: 'AI spokesperson and avatar videos' },
      { name: 'Invideo AI', url: 'https://invideo.io/', description: 'Script to video generation' },
      { name: 'Pictory', url: 'https://pictory.ai/', description: 'Article to video conversion' },
      { name: 'Fliki', url: 'https://fliki.ai/', description: 'Text to video with AI voices' }
    ]
  },
  {
    id: 'voice',
    name: 'Voice Synthesis',
    icon: Mic,
    color: 'from-green-500 to-emerald-500',
    tools: [
      { name: 'ElevenLabs', url: 'https://elevenlabs.io/', description: 'Most realistic voice cloning and synthesis' },
      { name: 'Murf AI', url: 'https://murf.ai/', description: 'Professional voiceovers and narration' },
      { name: 'Speechify', url: 'https://speechify.com/', description: 'Text-to-speech reader and converter' },
      { name: 'PlayHT', url: 'https://play.ht/', description: 'High-quality AI voice generator' },
      { name: 'Resemble AI', url: 'https://www.resemble.ai/', description: 'Custom voice creation for brands' },
      { name: 'Lovo AI', url: 'https://lovo.ai/', description: 'Voice generator with emotion control' },
      { name: 'Descript', url: 'https://www.descript.com/', description: 'Audio/video editing with AI voices' },
      { name: 'WellSaid Labs', url: 'https://wellsaidlabs.com/', description: 'Enterprise-grade voice solutions' },
      { name: 'Replica Studios', url: 'https://replicastudios.com/', description: 'AI voice actors for games and media' },
      { name: 'Listnr', url: 'https://www.listnr.ai/', description: 'Text-to-speech for content creators' }
    ]
  },
  {
    id: 'music',
    name: 'Music',
    icon: Music,
    color: 'from-yellow-500 to-orange-500',
    tools: [
      { name: 'Suno', url: 'https://suno.com/', description: 'AI song generation from text' },
      { name: 'Udio', url: 'https://udio.com/', description: 'High-quality music creation' },
      { name: 'AIVA', url: 'https://www.aiva.ai/', description: 'AI composer for classical/soundtrack music' },
      { name: 'Boomy', url: 'https://boomy.com/', description: 'Create and release songs with AI' },
      { name: 'Soundful', url: 'https://soundful.com/', description: 'Royalty-free background music' },
      { name: 'Mubert', url: 'https://mubert.com/', description: 'Real-time generative music' },
      { name: 'LALAL.AI', url: 'https://www.lalal.ai/', description: 'Audio source separation' },
      { name: 'Beatoven.ai', url: 'https://www.beatoven.ai/', description: 'Custom music for video and podcasts' },
      { name: 'Loudly', url: 'https://www.loudly.com/', description: 'Music for content creators' },
      { name: 'Splash', url: 'https://www.splashmusic.com/', description: 'Music creation for live or interactive use' }
    ]
  },
  {
    id: 'coding',
    name: 'Coding Assistants',
    icon: Code,
    color: 'from-indigo-500 to-blue-500',
    tools: [
      { name: 'GitHub Copilot', url: 'https://github.com/features/copilot', description: 'Most popular AI pair programmer' },
      { name: 'Cursor', url: 'https://cursor.sh/', description: 'AI-powered code editor built on VS Code' },
      { name: 'Claude Dev (VSCode)', url: 'https://marketplace.visualstudio.com/items?itemName=saoudrizwan.claude-dev', description: 'Claude in your code editor' },
      { name: 'Codeium', url: 'https://codeium.com/', description: 'Free alternative to GitHub Copilot' },
      { name: 'Replit AI', url: 'https://replit.com/', description: 'Browser-based AI coding' },
      { name: 'Tabnine', url: 'https://www.tabnine.com/', description: 'AI code completion and chat' },
      { name: 'CodeWhisperer', url: 'https://aws.amazon.com/codewhisperer/', description: 'Amazon\'s coding AI' },
      { name: 'Sourcegraph Cody', url: 'https://sourcegraph.com/cody', description: 'AI with deep codebase context' },
      { name: 'Continue', url: 'https://continue.dev/', description: 'Open-source AI code assistant' },
      { name: 'Aider', url: 'https://aider.chat/', description: 'AI pair programming in terminal' },
      { name: 'v0 by Vercel', url: 'https://v0.dev/', description: 'Generate UI components from text' }
    ]
  },
  {
    id: 'productivity',
    name: 'Productivity',
    icon: Sparkles,
    color: 'from-violet-500 to-purple-500',
    tools: [
      { name: 'Notion AI', url: 'https://www.notion.so/product/ai', description: 'AI for workspace, docs, and notes' },
      { name: 'Grammarly', url: 'https://www.grammarly.com/', description: 'AI-powered writing and grammar help' },
      { name: 'Jasper', url: 'https://www.jasper.ai/', description: 'Content marketing and copywriting' },
      { name: 'Copy.ai', url: 'https://www.copy.ai/', description: 'AI writing for marketing' },
      { name: 'Otter.ai', url: 'https://otter.ai/', description: 'Meeting transcription and note taking' },
      { name: 'Gamma', url: 'https://gamma.app/', description: 'AI-powered presentations' },
      { name: 'Tome', url: 'https://tome.app/', description: 'Visual storytelling and slides' },
      { name: 'Superhuman', url: 'https://superhuman.com/', description: 'Fast, AI-enhanced email' },
      { name: 'Mem', url: 'https://mem.ai/', description: 'AI-powered note-taking app' },
      { name: 'Reclaim.ai', url: 'https://reclaim.ai/', description: 'AI calendar and time blocking' },
      { name: 'Zapier AI', url: 'https://zapier.com/ai', description: 'AI-powered automation flows' },
      { name: 'Monday.com AI', url: 'https://monday.com/ai/', description: 'Smart project management' }
    ]
  },
  {
    id: 'agents',
    name: 'AI Agents & Automation',
    icon: Bot,
    color: 'from-emerald-500 to-teal-500',
    tools: [
      { name: 'AutoGPT', url: 'https://github.com/Significant-Gravitas/AutoGPT', description: 'Autonomous task-solving LLM agent' },
      { name: 'AgentGPT', url: 'https://agentgpt.reworkd.ai/', description: 'Browser-based multi-step agent' },
      { name: 'HyperWrite Personal Agent', url: 'https://www.hyperwriteai.com/', description: 'AI that completes tasks for you' },
      { name: 'Smol Developer', url: 'https://github.com/smol-ai/developer', description: 'Lightweight AI agents that code' },
      { name: 'MultiOn', url: 'https://www.multion.ai/', description: 'AI browser agent' },
      { name: 'Devika', url: 'https://github.com/stitionai/devika', description: 'Agent that understands tasks and builds software' },
      { name: 'Sweep.dev', url: 'https://sweep.dev/', description: 'Writes PRs automatically from natural language' },
      { name: 'OpenDevin', url: 'https://github.com/OpenDevin/OpenDevin', description: 'Open-source dev agent (early stage)' }
    ]
  },
  {
    id: 'search',
    name: 'AI Search',
    icon: Search,
    color: 'from-teal-500 to-cyan-500',
    tools: [
      { name: 'Perplexity AI', url: 'https://www.perplexity.ai/', description: 'AI-powered search with web access' },
      { name: 'Phind', url: 'https://www.phind.com/', description: 'AI search for developers' },
      { name: 'Bing Copilot', url: 'https://www.bing.com/chat', description: 'Microsoft\'s AI-enhanced search' },
      { name: 'Brave Search AI', url: 'https://search.brave.com/', description: 'Private search with AI results' },
      { name: 'Kagi', url: 'https://kagi.com/', description: 'Premium search with no ads' },
      { name: 'Metaphor', url: 'https://metaphor.systems/', description: 'AI-native search engine' },
      { name: 'Exa', url: 'https://exa.ai/', description: 'Neural search for agents and apps' },
      { name: 'Tavily', url: 'https://tavily.com/', description: 'Search API for AI applications' }
    ]
  },
  {
    id: 'photo',
    name: 'Photo Editing & Utility',
    icon: ImageIcon,
    color: 'from-pink-500 to-rose-500',
    tools: [
      { name: 'Remove.bg', url: 'https://www.remove.bg/', description: 'Remove backgrounds from images' },
      { name: 'Cleanup.pictures', url: 'https://cleanup.pictures/', description: 'Remove objects from photos' },
      { name: 'Remini', url: 'https://remini.ai/', description: 'Enhance and upscale low-res photos' },
      { name: 'Let\'s Enhance', url: 'https://letsenhance.io/', description: 'Improve photo quality for printing/web' },
      { name: 'Magic Eraser', url: 'https://magicstudio.com/magiceraser/', description: 'Quick background/object removal' }
    ]
  }
];

const TOOLS_PER_PAGE = 6;

export default function TryOtherAITools() {
  const [activeCategory, setActiveCategory] = useState('language');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const currentCategory = useMemo(() => 
    AI_CATEGORIES.find(cat => cat.id === activeCategory) || AI_CATEGORIES[0],
    [activeCategory]
  );

  const isExpanded = expandedCategories.has(activeCategory);
  const hasMoreTools = currentCategory.tools.length > TOOLS_PER_PAGE;
  
  const toolsToShow = useMemo(() => {
    if (isExpanded || !hasMoreTools) {
      return currentCategory.tools;
    }
    return currentCategory.tools.slice(0, TOOLS_PER_PAGE);
  }, [currentCategory.tools, isExpanded, hasMoreTools]);

  const toggleShowAll = () => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(activeCategory)) {
        newSet.delete(activeCategory);
      } else {
        newSet.add(activeCategory);
      }
      return newSet;
    });
  };

  return (
    <section className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-emerald-200/50 shadow-lg">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 sm:mb-8">
        <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
          <Target className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900" style={{fontFamily: "'Playfair Display', serif"}}>
          Try Other AI Tools
        </h3>
      </div>

      {/* Mobile: Horizontal Scrollable Categories */}
      <div className="block md:hidden mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {AI_CATEGORIES.map((category) => {
            const IconComponent = category.icon;
            const isActive = activeCategory === category.id;
            
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all duration-200 text-sm whitespace-nowrap flex-shrink-0 ${
                  isActive
                    ? `bg-gradient-to-r ${category.color} text-white shadow-md`
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                {category.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop: All Categories */}
      <div className="hidden md:flex mb-8">
        <div className="flex flex-wrap gap-2">
          {/* All Categories */}
          {AI_CATEGORIES.map((category) => {
            const IconComponent = category.icon;
            const isActive = activeCategory === category.id;
            
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex flex-col items-center gap-1 px-3 py-3 rounded-lg font-medium transition-all duration-200 text-sm min-w-0 ${
                  isActive
                    ? `bg-gradient-to-r ${category.color} text-white shadow-md transform scale-105`
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
                }`}
              >
                <IconComponent className="w-4 h-4 flex-shrink-0" />
                <span className="text-center leading-tight max-w-16 text-xs">
                  {category.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>



      {/* Tools List */}
      <div className="mb-6">
        {toolsToShow.map((tool, index) => (
          <div key={`${tool.name}-${index}`} className="mb-1">
            <span className="text-gray-700">• </span>
            <div className="inline-block relative group">
              <a 
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[#59B1E3] hover:text-[#60A875] transition-colors underline"
              >
                {tool.name}
              </a>
              {/* Tooltip */}
              <div className="absolute top-full left-0 mt-1 px-3 py-2 bg-white border border-gray-300 text-gray-900 text-sm rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                {tool.url}
                {/* Arrow */}
                <div className="absolute bottom-full left-4 w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-white"></div>
              </div>
            </div>
            <span className="text-gray-600"> – </span>
            <span className="text-gray-700">{tool.description}</span>
          </div>
        ))}
      </div>

      {/* Show More/Less Button */}
      {hasMoreTools && (
        <div className="text-center mb-6">
          <button
            onClick={toggleShowAll}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors duration-200"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show More
              </>
            )}
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="p-4 bg-gradient-to-r from-[#60A875]/10 to-[#59B1E3]/10 rounded-lg border border-[#60A875]/20">
        <p className="text-sm text-gray-700 text-center">
          <span className="font-semibold">Want help picking the right tool?</span> Check out our{' '}
          <span className="text-[#60A875] font-semibold">AI Overview</span> section for detailed comparisons.
        </p>
      </div>
    </section>
  );
}