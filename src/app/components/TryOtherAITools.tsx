'use client'

import React, { useState } from 'react';
import { Brain, Image, Video, Mic, Code, Music, Search, Sparkles, ExternalLink, Target } from 'lucide-react';

interface AITool {
  name: string;
  url: string;
  description: string;
  free?: boolean;
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
      { name: 'Perplexity AI', url: 'https://www.perplexity.ai/', description: 'AI search with real-time web access' },
      { name: 'Microsoft Copilot', url: 'https://copilot.microsoft.com/', description: 'Integrated with Microsoft ecosystem' },
      { name: 'You.com', url: 'https://you.com/', description: 'Privacy-focused AI search assistant' },
      { name: 'Poe by Quora', url: 'https://poe.com/', description: 'Access multiple AI models in one place' },
      { name: 'Character.AI', url: 'https://character.ai/', description: 'Chat with AI characters and personalities' },
      { name: 'Pi (Inflection)', url: 'https://pi.ai/', description: 'Personal intelligence assistant' },
      { name: 'Mistral Chat', url: 'https://chat.mistral.ai/', description: 'European open-source AI model' }
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
      { name: 'Listnr', url: 'https://www.listnr.ai/', description: 'Text to speech for content creators' }
    ]
  },
  {
    id: 'coding',
    name: 'Coding',
    icon: Code,
    color: 'from-indigo-500 to-blue-500',
    tools: [
      { name: 'GitHub Copilot', url: 'https://github.com/features/copilot', description: 'Most popular AI pair programmer' },
      { name: 'Cursor', url: 'https://cursor.sh/', description: 'AI-powered code editor taking over VS Code' },
      { name: 'Claude Dev (VSCode)', url: 'https://marketplace.visualstudio.com/items?itemName=saoudrizwan.claude-dev', description: 'Claude AI directly in your editor' },
      { name: 'Codeium', url: 'https://codeium.com/', description: 'Free alternative to GitHub Copilot' },
      { name: 'v0 by Vercel', url: 'https://v0.dev/', description: 'Generate UI components from text' },
      { name: 'Replit AI', url: 'https://replit.com/', description: 'AI coding directly in browser' },
      { name: 'Tabnine', url: 'https://www.tabnine.com/', description: 'AI code completion and chat' },
      { name: 'CodeWhisperer', url: 'https://aws.amazon.com/codewhisperer/', description: 'Amazon\'s coding AI assistant' },
      { name: 'Sourcegraph Cody', url: 'https://sourcegraph.com/cody', description: 'AI coding assistant with codebase context' },
      { name: 'Continue', url: 'https://continue.dev/', description: 'Open-source AI code assistant' },
      { name: 'Aider', url: 'https://aider.chat/', description: 'AI pair programming in terminal' },
      { name: 'Windsurf Editor', url: 'https://codeium.com/windsurf', description: 'New AI-first code editor by Codeium' }
    ]
  },
  {
    id: 'music',
    name: 'Music',
    icon: Music,
    color: 'from-yellow-500 to-orange-500',
    tools: [
      { name: 'Suno', url: 'https://suno.com/', description: 'Most popular AI song generation from text' },
      { name: 'Udio', url: 'https://udio.com/', description: 'High-quality AI music creation platform' },
      { name: 'AIVA', url: 'https://www.aiva.ai/', description: 'AI composer for soundtracks and classical' },
      { name: 'Boomy', url: 'https://boomy.com/', description: 'Create and release AI music easily' },
      { name: 'Soundful', url: 'https://soundful.com/', description: 'Royalty-free AI background music' },
      { name: 'Mubert', url: 'https://mubert.com/', description: 'Real-time AI music generation' },
      { name: 'LALAL.AI', url: 'https://www.lalal.ai/', description: 'AI audio source separation and isolation' },
      { name: 'Beatoven.ai', url: 'https://www.beatoven.ai/', description: 'Custom music for videos and podcasts' },
      { name: 'Loudly', url: 'https://www.loudly.com/', description: 'AI music for content creators' },
      { name: 'Splash', url: 'https://www.splashmusic.com/', description: 'AI music creation and performance' }
    ]
  },
  {
    id: 'search',
    name: 'AI Search',
    icon: Search,
    color: 'from-teal-500 to-cyan-500',
    tools: [
      { name: 'Perplexity AI', url: 'https://www.perplexity.ai/', description: 'Leading AI-powered search engine' },
      { name: 'You.com', url: 'https://you.com/', description: 'AI search with privacy focus and multiple sources' },
      { name: 'Phind', url: 'https://www.phind.com/', description: 'AI search specifically for developers' },
      { name: 'Bing Copilot', url: 'https://www.bing.com/chat', description: 'Microsoft\'s AI-enhanced search' },
      { name: 'SearchGPT (OpenAI)', url: 'https://openai.com/index/searchgpt-prototype/', description: 'OpenAI\'s search prototype (limited access)' },
      { name: 'Brave Search AI', url: 'https://search.brave.com/', description: 'Privacy-focused search with AI answers' },
      { name: 'Kagi', url: 'https://kagi.com/', description: 'Premium AI search with no ads' },
      { name: 'Metaphor', url: 'https://metaphor.systems/', description: 'AI-native search for finding similar content' },
      { name: 'Exa', url: 'https://exa.ai/', description: 'Neural search designed for AI agents' },
      { name: 'Tavily', url: 'https://tavily.com/', description: 'Search API optimized for AI applications' }
    ]
  },
  {
    id: 'productivity',
    name: 'Productivity',
    icon: Sparkles,
    color: 'from-violet-500 to-purple-500',
    tools: [
      { name: 'Notion AI', url: 'https://www.notion.so/product/ai', description: 'AI-powered workspace and note-taking' },
      { name: 'Grammarly', url: 'https://www.grammarly.com/', description: 'AI writing assistant and grammar checker' },
      { name: 'Jasper', url: 'https://www.jasper.ai/', description: 'AI content creation for marketing teams' },
      { name: 'Copy.ai', url: 'https://www.copy.ai/', description: 'AI copywriting and content generation' },
      { name: 'Otter.ai', url: 'https://otter.ai/', description: 'AI meeting transcription and notes' },
      { name: 'Gamma', url: 'https://gamma.app/', description: 'AI presentation and document maker' },
      { name: 'Tome', url: 'https://tome.app/', description: 'AI-powered storytelling and presentations' },
      { name: 'Superhuman', url: 'https://superhuman.com/', description: 'AI-enhanced email management' },
      { name: 'Mem', url: 'https://mem.ai/', description: 'AI-powered note-taking and knowledge base' },
      { name: 'Reclaim.ai', url: 'https://reclaim.ai/', description: 'AI calendar scheduling and time blocking' },
      { name: 'Zapier', url: 'https://zapier.com/ai', description: 'AI automation for workflows and apps' },
      { name: 'Monday.com AI', url: 'https://monday.com/ai/', description: 'AI project management and collaboration' }
    ]
  }
];

export default function TryOtherAITools() {
  const [activeCategory, setActiveCategory] = useState('language');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleShowAll = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
  };

  const currentCategory = AI_CATEGORIES.find(cat => cat.id === activeCategory) || AI_CATEGORIES[0];
  const isExpanded = expandedCategories.has(activeCategory);
  
  // Force the slice to always happen
  const allTools = currentCategory.tools;
  const limitedTools = allTools.slice(0, 4);
  const toolsToShow = isExpanded ? allTools : limitedTools;

  // TEMPORARY DEBUG - Remove this after we figure out the issue
  console.log('=== DEBUG INFO ===');
  console.log('Active Category:', activeCategory);
  console.log('Is Expanded:', isExpanded);
  console.log('All Tools Length:', allTools.length);
  console.log('Limited Tools Length:', limitedTools.length);
  console.log('Tools To Show Length:', toolsToShow.length);
  console.log('First 4 tool names:', toolsToShow.slice(0, 4).map(t => t.name));
  console.log('=================');

  return (
    <section className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 border border-emerald-200/50 shadow-lg">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
          <Target className="w-6 h-6" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900" style={{fontFamily: "'Playfair Display', serif"}}>
          Try Other AI Tools
        </h3>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {AI_CATEGORIES.map((category) => {
          const IconComponent = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                activeCategory === category.id
                  ? 'bg-gradient-to-r ' + category.color + ' text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <IconComponent className="w-4 h-4" />
              {category.name}
            </button>
          );
        })}
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentCategory.tools.map((tool, index) => (
          <a
            key={index}
            href={tool.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-md transition-all duration-200"
          >
                          <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-2">
                  <h4 className="font-semibold text-gray-900 group-hover:text-[#60A875] transition-colors">
                    {tool.name}
                  </h4>
                </div>
                <p className="text-sm text-gray-600 mb-2">{tool.description}</p>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-[#60A875] transition-colors flex-shrink-0 ml-2" />
            </div>
          </a>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-8 p-4 bg-gradient-to-r from-[#60A875]/10 to-[#59B1E3]/10 rounded-lg border border-[#60A875]/20">
        <p className="text-sm text-gray-700 text-center">
          <span className="font-semibold">Want help picking the right tool?</span> Check out our{' '}
          <span className="text-[#60A875] font-semibold">AI Overview</span> section.
        </p>
      </div>
    </section>
  );
}