"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { Users, Share2, Sparkles, Copy, Check, ExternalLink, MessageCircle, AlertCircle, Loader2, CheckCircle2, X, Settings, Zap, Brain, Globe, Search, Code, MessageSquare, Cpu, Calendar, Clock, Tag, ArrowRight } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
  provider?: string;
}

interface TidbitData {
  id: number;
  day_number: number;
  title: string;
  hero_heading: string;
  walkthrough_intro: string;
  what_is_ai: string;
  what_you_need: string;
  tutor_intro: string;
  tutor_placeholder?: string;  // Placeholder text for empty input
  tutor_prefill?: string;      // NEW: Pre-filled text in the input box
  video_url?: string;
  image_url?: string;
  bitboard_url?: string;
  chatbot_embed?: string;
  status: string;
  tags?: string;
  difficulty_level?: number;
  estimated_time?: number;
  seo_description?: string;
  explore_more?: string;
  created_at: string;
  updated_at?: string;
  default_ai_provider?: string;
}

interface TidbitTutorProps {
  tidbitNumber?: number;
  tidbitTitle?: string;
  onConversationUpdate?: (userInput: string, aiOutput: string) => void;
  // NEW: Allow auto-loading from Supabase
  autoLoadFromSupabase?: boolean;
  dayNumber?: number;
}

// API Provider Configuration
interface APIProvider {
  id: string;
  name: string;
  company: string;
  model: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
  free?: boolean;
}

const API_PROVIDERS: APIProvider[] = [
  {
    id: 'openai',
    name: 'GPT-4o',
    company: 'OpenAI',
    model: 'gpt-4o',
    icon: Brain,
    color: 'bg-green-500',
    description: 'Most capable OpenAI model',
    free: true
  },
  {
    id: 'anthropic',
    name: 'Claude Sonnet 4', // Updated name
    company: 'Anthropic',
    model: 'claude-sonnet-4-20250514', // Updated model identifier
    icon: MessageSquare,
    color: 'bg-orange-500',
    description: 'Anthropic\'s latest and most intelligent model' // Updated description
  },
  {
    id: 'google',
    name: 'Gemini 1.5',
    company: 'Google',
    model: 'gemini-1.5-pro',
    icon: Globe,
    color: 'bg-blue-500',
    description: 'Google\'s most advanced model'
  },
  {
    id: 'perplexity',
    name: 'Perplexity Sonar', // Updated name
    company: 'Perplexity',
    model: 'sonar', // Updated model identifier  
    icon: Search,
    color: 'bg-purple-500',
    description: 'Real-time web search with enhanced accuracy' // Updated description
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

// Enhanced loading and error states
type LoadingState = 'idle' | 'sending' | 'posting' | 'copying' | 'loading_tidbit';
type ErrorType = 'chat' | 'post' | 'auth' | 'network' | 'provider' | 'tidbit_load' | null;

interface ErrorState {
  type: ErrorType;
  message: string;
  retryAction?: () => void;
}

export default function TidbitTutor({
  tidbitNumber,
  tidbitTitle,
  onConversationUpdate,
  autoLoadFromSupabase = true,
  dayNumber,
  embedded = false // NEW: Add embedded prop to control styling
}: TidbitTutorProps & { embedded?: boolean }) {
  // Existing state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [error, setError] = useState<ErrorState | null>(null);
  const [user, setUser] = useState<any>(null);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [lastSharedIndex, setLastSharedIndex] = useState<number | null>(null);
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);
  const [showQuickPost, setShowQuickPost] = useState(false);
  const [customPostContent, setCustomPostContent] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>('openai');
  const [showProviderMenu, setShowProviderMenu] = useState(false);

  // NEW: Supabase integration state
  const [tidbitData, setTidbitData] = useState<TidbitData | null>(null);
  const [loadingTidbit, setLoadingTidbit] = useState(false);

  // NEW: Auto-load tidbit data from Supabase
  useEffect(() => {
    const loadTidbitData = async () => {
      if (!autoLoadFromSupabase) return;

      setLoadingTidbit(true);
      setLoadingState('loading_tidbit');

      try {
        let query = supabase
          .from('tidbits')
          .select('*')
          .eq('status', 'published');

        // Use provided dayNumber, tidbitNumber, or get the latest
        if (dayNumber) {
          query = query.eq('day_number', dayNumber);
        } else if (tidbitNumber) {
          query = query.eq('day_number', tidbitNumber);
        } else {
          query = query.order('day_number', { ascending: false }).limit(1);
        }

        const { data, error } = await query.single();

        if (error) {
          console.error('Error loading tidbit:', error);
          // If specific day not found, try to get the latest
          if (error.code === 'PGRST116') {
            const { data: latestData, error: latestError } = await supabase
              .from('tidbits')
              .select('*')
              .eq('status', 'published')
              .order('day_number', { ascending: false })
              .limit(1)
              .single();

            if (latestError) throw latestError;
            setTidbitData(latestData);
          } else {
            throw error;
          }
        } else {
          setTidbitData(data);
        }

        console.log('Loaded tidbit data:', data);

      } catch (err) {
        console.error('Failed to load tidbit:', err);
        setError({
          type: 'tidbit_load',
          message: 'Failed to load tidbit information. Using default settings.',
          retryAction: loadTidbitData
        });
      } finally {
        setLoadingTidbit(false);
        setLoadingState('idle');
      }
    };

    loadTidbitData();
  }, [autoLoadFromSupabase, dayNumber, tidbitNumber]);

  // Set initial message based on tidbit data
  useEffect(() => {
    if (tidbitData && messages.length === 0) {
      // Don't set any initial welcome message - start with empty chat

      // Pre-fill input with template text if provided
      if (tidbitData.tutor_prefill && !input) {
        setInput(tidbitData.tutor_prefill);
      }

      // NEW: Set default AI provider from tidbit data
      if (tidbitData.default_ai_provider) {
        // Validate the provider exists in our list
        const validProvider = API_PROVIDERS.find(p => p.id === tidbitData.default_ai_provider);
        if (validProvider) {
          setSelectedProvider(tidbitData.default_ai_provider);
          console.log(`Setting default AI provider to: ${validProvider.name} for Tidbit #${tidbitData.day_number}`);
        }
      }
    } else if (!autoLoadFromSupabase && messages.length === 0) {
      // Don't set any initial message for non-Supabase mode either
    }
  }, [tidbitData, autoLoadFromSupabase, messages.length, input]);

  // Update custom post content when tidbit data loads
  useEffect(() => {
    if (tidbitData) {
      setCustomPostContent(
        `Just used AI to transform my writing with Daily Tidbit #${tidbitData.day_number}! "${tidbitData.title}"`
      );
    } else if (tidbitNumber && tidbitTitle) {
      setCustomPostContent(
        `Just used AI to transform my writing with Daily Tidbit #${tidbitNumber}! "${tidbitTitle}"`
      );
    }
  }, [tidbitData, tidbitNumber, tidbitTitle]);

  // Check for user auth
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        setUser(user);
      } catch (err) {
        console.error('Auth check failed:', err);
        setError({
          type: 'auth',
          message: 'Failed to check authentication status',
        });
      }
    };

    checkUser();
  }, []);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleError = (type: ErrorType, message: string, retryAction?: () => void) => {
    setError({ type, message, retryAction });
    setLoadingState('idle');
  };

  const clearError = () => setError(null);

  const getCurrentProvider = () => API_PROVIDERS.find(p => p.id === selectedProvider) || API_PROVIDERS[0];

  // Get current tidbit info (prioritize loaded data)
  const currentTidbitNumber = tidbitData?.day_number || tidbitNumber || 1;
  const currentTidbitTitle = tidbitData?.title || tidbitTitle || 'Unknown Tidbit';
  const currentPlaceholder = tidbitData?.tutor_placeholder ||
    (loadingState === 'sending' ? `${getCurrentProvider().name} is processing...` : "Type your message...");

  // Calculate input height based on pre-filled text length
  const calculateInputRows = (text: string) => {
    if (!text) return 1;
    const lines = text.split('\n').length;
    const estimatedLines = Math.max(lines, Math.ceil(text.length / 80)); // ~80 chars per line
    return Math.min(Math.max(estimatedLines, 2), 6); // Between 2-6 rows
  };

  async function sendMessage() {
    if (!input.trim() || loadingState === 'sending') return;

    const currentProvider = getCurrentProvider();
    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
      provider: currentProvider.id
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoadingState('sending');
    clearError();

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          provider: selectedProvider
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data?.assistant) {
        throw new Error('Invalid response from AI service');
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: data.assistant,
        timestamp: new Date(),
        provider: currentProvider.id
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Notify parent component about the new conversation
      if (onConversationUpdate) {
        onConversationUpdate(userMessage.content, data.assistant);
      }

      // Show share options after getting a good response
      if (messages.length >= 2) {
        setShowShareOptions(true);
      }

      setSuccessMessage(`✨ ${currentProvider.name} responded successfully!`);

    } catch (err) {
      console.error("Chat error:", err);

      // Determine error type
      let errorMessage = "Failed to send message. Please try again.";
      let errorType: ErrorType = 'chat';

      if (err instanceof Error) {
        if (err.message.includes('fetch') || err.message.includes('network')) {
          errorType = 'network';
          errorMessage = "Network error. Check your connection and try again.";
        } else if (err.message.includes('Server error: 5')) {
          errorMessage = "Server is temporarily unavailable. Please try again in a moment.";
        } else if (err.message.includes('provider') || err.message.includes('API')) {
          errorType = 'provider';
          errorMessage = `${currentProvider.name} is currently unavailable. Try switching providers.`;
        } else {
          errorMessage = err.message;
        }
      }

      handleError(errorType, errorMessage, () => sendMessage());

      // Add error message to chat
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: `Sorry, I encountered an error with ${currentProvider.name}. Please try again or switch to a different AI provider.`,
        timestamp: new Date(),
        provider: currentProvider.id
      }]);
    } finally {
      setLoadingState('idle');
    }
  }

  // Enhanced copy with better error handling
  const copyMessage = async (content: string, index: number) => {
    if (loadingState === 'copying') return;

    setLoadingState('copying');
    clearError();

    try {
      if (!navigator.clipboard) {
        throw new Error('Clipboard not supported in this browser');
      }

      await navigator.clipboard.writeText(content);
      setCopiedMessageIndex(index);
      setSuccessMessage("Message copied to clipboard!");
      setTimeout(() => setCopiedMessageIndex(null), 2000);

    } catch (err) {
      console.error("Copy failed:", err);
      handleError('network', 'Failed to copy to clipboard. You can manually select and copy the text.');

      // Fallback: try to select the text
      try {
        const textArea = document.createElement('textarea');
        textArea.value = content;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setSuccessMessage("Message copied to clipboard!");
      } catch (fallbackErr) {
        console.error("Fallback copy failed:", fallbackErr);
      }
    } finally {
      setLoadingState('idle');
    }
  };

  // Format conversation for BitBoard post
  const formatConversationForPost = () => {
    const recentMessages = messages.slice(-2);
    const userInput = recentMessages.find(m => m.role === "user")?.content;
    const aiOutput = recentMessages.find(m => m.role === "assistant")?.content;
    const provider = recentMessages.find(m => m.role === "assistant")?.provider;

    if (!userInput || !aiOutput) {
      return null;
    }

    const providerInfo = API_PROVIDERS.find(p => p.id === provider);

    return {
      beforeText: userInput,
      afterText: aiOutput,
      content: customPostContent || `Used ${providerInfo?.name || 'AI'} to improve my writing with Daily Tidbit #${currentTidbitNumber}! "${currentTidbitTitle}"`
    };
  };

  // Enhanced post to BitBoard with comprehensive error handling
  const postToBitBoard = async (useCustomContent: boolean = false) => {
    if (loadingState === 'posting') return;

    if (!user) {
      handleError('auth', 'Please sign in to post to BitBoard!');
      return;
    }

    const formattedPost = formatConversationForPost();
    if (!formattedPost) {
      handleError('post', 'Need at least one conversation to share!');
      return;
    }

    setLoadingState('posting');
    clearError();

    try {
      const postData = {
        user_id: user.id,
        content: useCustomContent ? customPostContent : formattedPost.content,
        before_text: formattedPost.beforeText,
        after_text: formattedPost.afterText,
        tidbit: currentTidbitNumber,
        type: 'tidbit_tutor_conversation',
        description: `AI writing improvement from Tidbit Tutor - Day ${currentTidbitNumber}`,
        // NEW: Include tidbit reference if available
        ...(tidbitData && { tidbit_id: tidbitData.id })
      };

      const { error: supabaseError } = await supabase.from('posts').insert(postData);

      if (supabaseError) {
        console.error('Supabase error:', supabaseError);
        throw new Error(`Failed to post: ${supabaseError.message}`);
      }

      // Success state
      setLastSharedIndex(messages.length - 1);
      setShowQuickPost(false);
      setSuccessMessage("🎉 Posted successfully to BitBoard!");

      setTimeout(() => setLastSharedIndex(null), 3000);

      // Optional: Show confirmation for viewing post
      setTimeout(() => {
        const viewPost = confirm("Would you like to view your post on BitBoard?");
        if (viewPost) {
          window.open('/bitboard', '_blank');
        }
      }, 1000);

    } catch (error) {
      console.error("Post error:", error);

      let errorMessage = "Failed to post to BitBoard. Please try again.";
      let errorType: ErrorType = 'post';

      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          errorType = 'network';
          errorMessage = "Network error. Check your connection and try again.";
        } else if (error.message.includes('permission') || error.message.includes('auth')) {
          errorType = 'auth';
          errorMessage = "Authentication error. Please sign in again.";
        } else {
          errorMessage = error.message;
        }
      }

      handleError(errorType, errorMessage, () => postToBitBoard(useCustomContent));
    } finally {
      setLoadingState('idle');
    }
  };

  // Enhanced share specific conversation
  const shareSpecificConversation = async (userMsgIndex: number) => {
    if (loadingState === 'posting') return;

    if (!user) {
      handleError('auth', 'Please sign in to post to BitBoard!');
      return;
    }

    const userMsg = messages[userMsgIndex];
    const assistantMsg = messages[userMsgIndex + 1];

    if (!userMsg || !assistantMsg || userMsg.role !== "user" || assistantMsg.role !== "assistant") {
      handleError('post', 'Invalid conversation pair selected.');
      return;
    }

    setLoadingState('posting');
    clearError();

    try {
      const { error: supabaseError } = await supabase.from('posts').insert({
        user_id: user.id,
        content: customPostContent || `Used AI to improve my writing with Daily Tidbit #${currentTidbitNumber}! "${currentTidbitTitle}"`,
        before_text: userMsg.content,
        after_text: assistantMsg.content,
        tidbit: currentTidbitNumber,
        type: 'tidbit_tutor_conversation',
        description: `AI writing improvement from Tidbit Tutor - Day ${currentTidbitNumber}`,
        ...(tidbitData && { tidbit_id: tidbitData.id })
      });

      if (supabaseError) throw supabaseError;

      setLastSharedIndex(userMsgIndex + 1);
      setSuccessMessage("🎉 Conversation posted successfully!");

      setTimeout(() => setLastSharedIndex(null), 3000);

      setTimeout(() => {
        const viewPost = confirm("Would you like to view your post on BitBoard?");
        if (viewPost) {
          window.open('/bitboard', '_blank');
        }
      }, 1000);

    } catch (error) {
      console.error("Share error:", error);
      handleError('post', 'Failed to share conversation. Please try again.', () => shareSpecificConversation(userMsgIndex));
    } finally {
      setLoadingState('idle');
    }
  };

  const currentProvider = getCurrentProvider();

  return (
    <div className={embedded ? "w-full" : "max-w-xl mx-auto p-6 border border-gray-200 rounded-xl bg-white shadow-sm"}>
      {/* Enhanced Header with Tidbit Info - Only show when not embedded */}
      {!embedded && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#59B1E3] rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">#{currentTidbitNumber}</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
                Tidbit Tutor
              </h2>
            </div>
          </div>

          {/* AI Provider Selector */}
          <div className="relative">
            <button
              onClick={() => setShowProviderMenu(!showProviderMenu)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
              disabled={loadingState === 'loading_tidbit'}
            >
              <div className={`w-3 h-3 rounded-full ${currentProvider.color}`}></div>
              <span className="text-sm font-medium">{currentProvider.name}</span>
              {currentProvider.free && (
                <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">FREE</span>
              )}
              <Settings className="w-4 h-4 text-gray-400" />
            </button>

            {/* Provider Dropdown Menu */}
            {showProviderMenu && (
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
                          setSelectedProvider(provider.id);
                          setShowProviderMenu(false);
                        }}
                        className={`w-full p-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0 ${selectedProvider === provider.id ? 'bg-blue-50 border-blue-200' : ''
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
                            <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header for embedded mode - title + AI provider selector on same line */}
      {embedded && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#59B1E3] rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">#{currentTidbitNumber}</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
              Tidbit Tutor
            </h2>
          </div>

          {/* AI Provider Selector inline with title */}
          <div className="relative">
            <button
              onClick={() => setShowProviderMenu(!showProviderMenu)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
              disabled={loadingState === 'loading_tidbit'}
            >
              <div className={`w-3 h-3 rounded-full ${currentProvider.color}`}></div>
              <span className="text-sm font-medium">{currentProvider.name}</span>
              {currentProvider.free && (
                <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">FREE</span>
              )}
              <Settings className="w-4 h-4 text-gray-400" />
            </button>

            {/* Provider Dropdown Menu */}
            {showProviderMenu && (
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
                          setSelectedProvider(provider.id);
                          setShowProviderMenu(false);
                        }}
                        className={`w-full p-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0 ${selectedProvider === provider.id ? 'bg-blue-50 border-blue-200' : ''
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
                            <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tidbit Context Display - No box, just text on white background */}
      {tidbitData && (
        <div className="mb-4">
          <div className="flex items-start gap-2">
            <Calendar className="w-4 h-4 text-[#60A875] mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 text-sm">{tidbitData.title}</h3>
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">{tidbitData.seo_description || tidbitData.walkthrough_intro}</p>
              {tidbitData.tags && typeof tidbitData.tags === 'string' && tidbitData.tags.trim() && (
                <div className="flex gap-1 mt-2">
                  {tidbitData.tags.split(',').slice(0, 3).map((tag, i) => (
                    <span key={i} className="text-xs bg-[#60A875]/10 text-[#60A875] px-2 py-0.5 rounded">
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Loading state for tidbit data */}
      {loadingState === 'loading_tidbit' && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-[#59B1E3] animate-spin" />
            <span className="text-sm text-gray-600">Loading tidbit information...</span>
          </div>
        </div>
      )}

      {/* Enhanced Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-red-800">
                  {error.type === 'auth' && 'Authentication Error'}
                  {error.type === 'network' && 'Connection Error'}
                  {error.type === 'chat' && 'Chat Error'}
                  {error.type === 'post' && 'Posting Error'}
                  {error.type === 'provider' && 'Provider Error'}
                  {error.type === 'tidbit_load' && 'Loading Error'}
                </p>
                <button
                  onClick={clearError}
                  className="text-red-400 hover:text-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-red-700 mt-1">{error.message}</p>
              {error.retryAction && (
                <button
                  onClick={error.retryAction}
                  className="mt-2 text-sm bg-red-100 text-red-800 px-3 py-1 rounded-md hover:bg-red-200 transition-colors"
                >
                  Try Again
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Success Display */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <p className="text-sm font-medium text-green-800">{successMessage}</p>
            <button
              onClick={() => setSuccessMessage(null)}
              className="ml-auto text-green-400 hover:text-green-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Chat area with enhanced message display and provider indicators - Only show if there are messages */}
      {messages.length > 0 && (
        <div className="space-y-3 max-h-[400px] overflow-y-auto mb-4 p-3 bg-gray-50 rounded-lg">
          {messages.map((msg, i) => {
            const msgProvider = API_PROVIDERS.find(p => p.id === msg.provider);
            return (
              <div key={i} className="group relative">
                <div
                  className={`p-3 rounded-lg max-w-[85%] relative ${msg.role === "user"
                    ? "bg-[#60A875] text-white ml-auto"
                    : "bg-white text-gray-800 border border-gray-200"
                    }`}
                >
                  {/* Provider indicator for assistant messages */}
                  {msg.role === "assistant" && msgProvider && (
                    <div className="flex items-center gap-2 mb-2 text-xs">
                      <div className={`w-2 h-2 rounded-full ${msgProvider.color}`}></div>
                      <span className="text-gray-500">{msgProvider.name}</span>
                    </div>
                  )}

                  <p className="text-sm leading-relaxed">{msg.content}</p>

                  {/* Enhanced action buttons with loading states */}
                  <div className="absolute -right-2 top-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                    {/* Copy button with enhanced feedback */}
                    <button
                      onClick={() => copyMessage(msg.content, i)}
                      className="p-1 bg-white rounded shadow-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                      title="Copy message"
                      disabled={loadingState === 'copying'}
                    >
                      {copiedMessageIndex === i ? (
                        <Check className="w-3 h-3 text-green-600" />
                      ) : loadingState === 'copying' ? (
                        <Loader2 className="w-3 h-3 text-gray-600 animate-spin" />
                      ) : (
                        <Copy className="w-3 h-3 text-gray-600" />
                      )}
                    </button>

                    {/* Enhanced share conversation button */}
                    {msg.role === "assistant" && i > 0 && user && (
                      <button
                        onClick={() => shareSpecificConversation(i - 1)}
                        className={`p-1 rounded shadow-md transition-colors disabled:opacity-50 ${lastSharedIndex === i
                          ? 'bg-green-500 hover:bg-green-600'
                          : 'bg-[#59B1E3] hover:bg-blue-600'
                          }`}
                        title="Share this conversation to BitBoard"
                        disabled={loadingState === 'posting'}
                      >
                        {lastSharedIndex === i ? (
                          <Check className="w-3 h-3 text-white" />
                        ) : loadingState === 'posting' ? (
                          <Loader2 className="w-3 h-3 text-white animate-spin" />
                        ) : (
                          <Share2 className="w-3 h-3 text-white" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Enhanced loading indicator with provider info */}
          {loadingState === 'sending' && (
            <div className="bg-white text-gray-800 border border-gray-200 p-3 rounded-lg max-w-[85%]">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${currentProvider.color}`}></div>
                <Loader2 className="w-4 h-4 text-[#59B1E3] animate-spin" />
                <span className="text-sm text-gray-600">{currentProvider.name} is thinking...</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Show loading indicator even when no messages */}
      {messages.length === 0 && loadingState === 'sending' && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="bg-white text-gray-800 border border-gray-200 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${currentProvider.color}`}></div>
              <Loader2 className="w-4 h-4 text-[#59B1E3] animate-spin" />
              <span className="text-sm text-gray-600">{currentProvider.name} is thinking...</span>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced input area with provider indicator - More inviting layout */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <div className={`w-2 h-2 rounded-full ${currentProvider.color}`}></div>
          <span>Powered by {currentProvider.name}</span>
          {currentProvider.free && <span className="text-green-600">• Free</span>}
        </div>

        {/* Large textarea for maximum interaction invitation */}
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && e.shiftKey && sendMessage()}
            rows={6}
            className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#59B1E3]/30 focus:border-[#59B1E3] transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed resize-none text-base leading-relaxed"
            placeholder={currentPlaceholder}
            disabled={loadingState === 'sending' || loadingState === 'loading_tidbit'}
          />
          {/* Clear button for pre-filled text */}
          {tidbitData?.tutor_prefill && input === tidbitData.tutor_prefill && (
            <button
              onClick={() => setInput("")}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors p-1 bg-white rounded-full shadow-sm"
              title="Clear template text"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Send button below textarea for maximum space */}
        <div className="flex justify-end">
          <button
            onClick={sendMessage}
            disabled={loadingState === 'sending' || loadingState === 'loading_tidbit' || !input.trim()}
            className="bg-[#59B1E3] text-white px-8 py-3 rounded-xl hover:bg-blue-600 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md hover:shadow-lg transform hover:scale-105"
          >
            {loadingState === 'sending' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <span className="text-lg">Send</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Enhanced Share to BitBoard section with provider info */}
      {showShareOptions && messages.length >= 4 && (
        <div className="mt-4 p-4 bg-gradient-to-r from-[#60A875]/10 to-[#59B1E3]/10 rounded-lg border border-[#60A875]/20">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-[#60A875]" />
            <h3 className="font-semibold text-gray-900">Love your result?</h3>
          </div>
          <p className="text-sm text-gray-700 mb-3">
            Share your before & after to inspire others on BitBoard!
          </p>

          {user ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  onClick={() => postToBitBoard(false)}
                  disabled={loadingState === 'posting'}
                  className="flex items-center gap-2 bg-[#60A875] text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingState === 'posting' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4" />
                      Quick Post
                    </>
                  )}
                </button>

                <button
                  onClick={() => setShowQuickPost(!showQuickPost)}
                  className="flex items-center gap-2 border border-[#60A875] text-[#60A875] px-4 py-2 rounded-lg hover:bg-[#60A875] hover:text-white transition-colors font-medium disabled:opacity-50"
                  disabled={loadingState === 'posting'}
                >
                  <MessageCircle className="w-4 h-4" />
                  Customize
                </button>
              </div>

              {/* Enhanced custom post content editor */}
              {showQuickPost && (
                <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customize your post message:
                  </label>
                  <textarea
                    value={customPostContent}
                    onChange={(e) => setCustomPostContent(e.target.value)}
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#60A875] focus:border-[#60A875] resize-none text-sm disabled:bg-gray-100"
                    placeholder="Share what you learned..."
                    disabled={loadingState === 'posting'}
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => postToBitBoard(true)}
                      disabled={loadingState === 'posting' || !customPostContent.trim()}
                      className="flex-1 bg-[#60A875] text-white px-3 py-2 rounded-lg hover:bg-green-600 transition-colors font-medium disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                    >
                      {loadingState === 'posting' ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Posting...
                        </>
                      ) : (
                        "Post Custom Message"
                      )}
                    </button>
                    <button
                      onClick={() => setShowQuickPost(false)}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm disabled:opacity-50"
                      disabled={loadingState === 'posting'}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Enhanced preview with provider info */}
              {formatConversationForPost() && (
                <div className="mt-3 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                  <p className="font-medium mb-1">Preview:</p>
                  <div className="space-y-1">
                    <p><span className="text-red-700">Before:</span> {formatConversationForPost()?.beforeText.slice(0, 50)}...</p>
                    <p><span className="text-green-700">After:</span> {formatConversationForPost()?.afterText.slice(0, 50)}...</p>
                    <p><span className="text-blue-700">AI Provider:</span> {currentProvider.name}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Sign in to share your results!</span>
              <button className="text-sm text-[#59B1E3] hover:text-blue-700 transition-colors flex items-center gap-1">
                Sign In <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Enhanced success message for sharing */}
      {lastSharedIndex !== null && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle2 className="w-5 h-5" />
            <div className="flex-1">
              <span className="font-medium">Successfully posted to BitBoard! 🎉</span>
              <p className="text-sm text-green-700 mt-1">Your AI transformation is now live for the community to see.</p>
            </div>
            <a
              href="/bitboard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-green-700 hover:text-green-900 transition-colors flex items-center gap-1"
            >
              View <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* Click outside to close provider menu */}
      {showProviderMenu && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowProviderMenu(false)}
        />
      )}
    </div>
  );
}