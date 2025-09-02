// ============================================================================
// 2. AIProviderSelector.tsx - Extract AI provider selection logic
// ============================================================================

import React from 'react';
import { Settings, Check, Brain, MessageSquare, Globe, Search, Zap, Code, Cpu } from 'lucide-react';

export interface APIProvider {
  id: string;
  name: string;
  company: string;
  model: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
  free?: boolean;
}

export const API_PROVIDERS: APIProvider[] = [
  {
    id: 'openai',
    name: 'GPT-4o',
    company: 'OpenAI',
    model: 'gpt-4o',
    icon: Brain,
    color: 'bg-brand-green',
    description: 'Most capable OpenAI model',
    free: true
  },
  {
    id: 'anthropic',
    name: 'Claude Sonnet 4',
    company: 'Anthropic',
    model: 'claude-sonnet-4-20250514',
    icon: MessageSquare,
    color: 'bg-orange-500',
    description: 'Anthropic\'s latest and most intelligent model'
  },
  {
    id: 'google',
    name: 'Gemini 1.5',
    company: 'Google',
    model: 'gemini-1.5-pro',
    icon: Globe,
    color: 'bg-brand-blue',
    description: 'Google\'s most advanced model'
  },
  {
    id: 'perplexity',
    name: 'Perplexity Sonar',
    company: 'Perplexity',
    model: 'sonar',
    icon: Search,
    color: 'bg-purple-500',
    description: 'Real-time web search with enhanced accuracy'
  },
  {
    id: 'mistral',
    name: 'Mistral Large',
    company: 'Mistral',
    model: 'mistral-large-latest',
    icon: Zap,
    color: 'bg-red-500',
    description: 'Fast and efficient European AI'
  },
  {
    id: 'cohere',
    name: 'Command R+',
    company: 'Cohere',
    model: 'command-r-plus',
    icon: Code,
    color: 'bg-teal-500',
    description: 'Optimized for business tasks'
  },
  {
    id: 'together',
    name: 'LLaMA 3.1',
    company: 'Together.ai',
    model: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
    icon: Cpu,
    color: 'bg-indigo-500',
    description: 'Open source powerhouse'
  }
];

interface AIProviderSelectorProps {
  selectedProvider: string;
  onProviderChange: (providerId: string) => void;
  showMenu: boolean;
  onToggleMenu: (show: boolean) => void;
  disabled?: boolean;
}

export function AIProviderSelector({
  selectedProvider,
  onProviderChange,
  showMenu,
  onToggleMenu,
  disabled = false
}: AIProviderSelectorProps) {
  const currentProvider = API_PROVIDERS.find(p => p.id === selectedProvider) || API_PROVIDERS[0];

  return (
    <div className="relative">
      <button
        onClick={() => onToggleMenu(!showMenu)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
        disabled={disabled}
      >
        <div className={`w-3 h-3 rounded-full ${currentProvider.color}`}></div>
        <span className="text-sm font-medium">{currentProvider.name}</span>
        {currentProvider.free && (
          <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">FREE</span>
        )}
        <Settings className="w-4 h-4 text-gray-400" />
      </button>

      {/* Provider Dropdown Menu */}
      {showMenu && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          <div className="p-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm">Choose AI Provider</h3>
            <p className="text-xs text-gray-600 mt-1">Each AI has different strengths and styles</p>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {API_PROVIDERS.map((provider) => {
              const IconComponent = provider.icon;
              return (
                <button
                  key={provider.id}
                  onClick={() => {
                    onProviderChange(provider.id);
                    onToggleMenu(false);
                  }}
                  className={`w-full p-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0 ${
                    selectedProvider === provider.id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg ${provider.color} flex items-center justify-center flex-shrink-0`}>
                      <IconComponent className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 text-sm">{provider.name}</span>
                        <span className="text-xs text-gray-500">{provider.company}</span>
                        {provider.free && (
                          <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">FREE</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{provider.description}</p>
                    </div>
                    {selectedProvider === provider.id && (
                      <Check className="w-4 h-4 text-brand-blueDark flex-shrink-0" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
