"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { Calendar, Loader2 } from "lucide-react";

// Import our new modular components
import { FormattedMessage } from "./tutor/FormattedMessage";
import { AIProviderSelector, API_PROVIDERS, type APIProvider } from "./tutor/AIProviderSelector";
import { TutorErrorDisplay, type ErrorState, type ErrorType } from "./tutor/TutorErrorDisplay";
import { TutorSuccessDisplay } from "./tutor/TutorSuccessDisplay";
import { TutorChatArea, type Message } from "./tutor/TutorChatArea";
import { TutorInputArea } from "./tutor/TutorInputArea";
import { ShareToBitBoard } from "./tutor/ShareToBitBoard"; 

interface TidbitData {
  id: number;
  day_number: number;
  title: string;
  hero_heading: string;
  walkthrough_intro: string;
  what_is_ai: string;
  what_you_need: string;
  tutor_intro: string;
  tutor_placeholder?: string;
  tutor_prefill?: string;
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
  autoLoadFromSupabase?: boolean;
  dayNumber?: number;
  embedded?: boolean;
}

type LoadingState = 'idle' | 'sending' | 'posting' | 'copying' | 'loading_tidbit';

export default function TidbitTutor({
  tidbitNumber,
  tidbitTitle,
  onConversationUpdate,
  autoLoadFromSupabase = true,
  dayNumber,
  embedded = false
}: TidbitTutorProps) {
  // Core state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [error, setError] = useState<ErrorState | null>(null);
  const [user, setUser] = useState<any>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>('openai');
  const [showProviderMenu, setShowProviderMenu] = useState(false);

  // UI state
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);
  const [lastSharedIndex, setLastSharedIndex] = useState<number | null>(null);
  const [showShareOptions, setShowShareOptions] = useState(false);

  // Supabase integration state
  const [tidbitData, setTidbitData] = useState<TidbitData | null>(null);
  const [loadingTidbit, setLoadingTidbit] = useState(false);

  // NEW: Smart starter text state
  const [hasUsedProvider, setHasUsedProvider] = useState<Set<string>>(new Set());
  const [shouldShowStarterText, setShouldShowStarterText] = useState(true);

  // Get current provider info
  const getCurrentProvider = () => API_PROVIDERS.find(p => p.id === selectedProvider) || API_PROVIDERS[0];

  // Get current tidbit info (prioritize loaded data)
  const currentTidbitNumber = tidbitData?.day_number || tidbitNumber || 1;
  const currentTidbitTitle = tidbitData?.title || tidbitTitle || 'Unknown Tidbit';
  const currentPlaceholder = tidbitData?.tutor_placeholder ||
    (loadingState === 'sending' ? `${getCurrentProvider().name} is processing...` : "Type your message...");

  // Auto-load tidbit data from Supabase
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

  // Set initial message and provider based on tidbit data
  useEffect(() => {
    if (tidbitData && messages.length === 0) {
      // Pre-fill input with template text if provided and should show starter text
      if (tidbitData.tutor_prefill && shouldShowStarterText) {
        setInput(tidbitData.tutor_prefill);
      }

      // Set default AI provider from tidbit data
      if (tidbitData.default_ai_provider) {
        const validProvider = API_PROVIDERS.find(p => p.id === tidbitData.default_ai_provider);
        if (validProvider) {
          setSelectedProvider(tidbitData.default_ai_provider);
          console.log(`Setting default AI provider to: ${validProvider.name} for Tidbit #${tidbitData.day_number}`);
        }
      }
    }
  }, [tidbitData, messages.length, shouldShowStarterText]);

  // NEW: Smart starter text logic when provider changes
  useEffect(() => {
    // Only show starter text when:
    // 1. User hasn't used this provider before, OR
    // 2. Input is currently empty and we have starter text
    const hasUsedThisProvider = hasUsedProvider.has(selectedProvider);
    
    if (tidbitData?.tutor_prefill) {
      if (!hasUsedThisProvider && !input.trim()) {
        // First time using this provider - show starter text
        setInput(tidbitData.tutor_prefill);
        setShouldShowStarterText(true);
      } else if (hasUsedThisProvider && input === tidbitData.tutor_prefill) {
        // Used this provider before and input is still starter text - clear it
        setInput("");
        setShouldShowStarterText(false);
      }
    }
  }, [selectedProvider, tidbitData?.tutor_prefill, hasUsedProvider, input]);

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

  // Auto-clear messages
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Utility functions
  const handleError = (type: ErrorType, message: string, retryAction?: () => void) => {
    setError({ type, message, retryAction });
    setLoadingState('idle');
  };

  const clearError = () => setError(null);

  // Chat functionality
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
    
    // NEW: Track that user has used this provider
    setHasUsedProvider(prev => new Set([...prev, selectedProvider]));
    setShouldShowStarterText(false);
    
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

      if (onConversationUpdate) {
        onConversationUpdate(userMessage.content, data.assistant);
      }

      // UPDATED: Show share options after just 1 message exchange
      if (messages.length >= 0) { // This means after 1 user message + 1 AI response
        setShowShareOptions(true);
      }

      setSuccessMessage(`✨ ${currentProvider.name} responded successfully!`);

    } catch (err) {
      console.error("Chat error:", err);

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

  // Copy functionality
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

  // Share conversation functionality
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
        content: `Used AI to improve my writing with Daily Tidbit #${currentTidbitNumber}! "${currentTidbitTitle}"`,
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

  // Provider change handler
  const handleProviderChange = (providerId: string) => {
    setSelectedProvider(providerId);
    // The useEffect will handle starter text logic automatically
  };

  // NEW: Clear starter text handler
  const handleClearPrefill = () => {
    setInput("");
    setShouldShowStarterText(false);
  };

  const currentProvider = getCurrentProvider();

  return (
    <div className={embedded ? "w-full" : "max-w-xl mx-auto p-6 border border-gray-200 rounded-xl bg-white shadow-sm"}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#59B1E3] rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">#{currentTidbitNumber}</span>
          </div>
          <h2 className={`${embedded ? 'text-2xl' : 'text-xl'} font-bold text-gray-900`} 
              style={{ fontFamily: "'Playfair Display', serif" }}>
            Tidbit Tutor
          </h2>
        </div>

        {/* AI Provider Selector */}
        <AIProviderSelector
          selectedProvider={selectedProvider}
          onProviderChange={handleProviderChange}
          showMenu={showProviderMenu}
          onToggleMenu={setShowProviderMenu}
          disabled={loadingState === 'loading_tidbit'}
        />
      </div>

      {/* Tidbit Context Display */}
      {tidbitData && (
        <div className="mb-4">
          <div className="flex items-start gap-2">
            <Calendar className="w-4 h-4 text-[#60A875] mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 text-sm">{tidbitData.title}</h3>
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                {tidbitData.seo_description || tidbitData.walkthrough_intro}
              </p>
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

      {/* Error Display */}
      <TutorErrorDisplay error={error} onClearError={clearError} />

      {/* Success Display */}
      <TutorSuccessDisplay message={successMessage} onClear={() => setSuccessMessage(null)} />

      {/* Chat Area */}
      <TutorChatArea
        messages={messages}
        loadingState={loadingState}
        copiedMessageIndex={copiedMessageIndex}
        lastSharedIndex={lastSharedIndex}
        user={user}
        onCopyMessage={copyMessage}
        onShareConversation={shareSpecificConversation}
        currentProvider={currentProvider}
      />

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

      {/* Input Area */}
      <TutorInputArea
        input={input}
        onInputChange={setInput}
        onSend={sendMessage}
        placeholder={currentPlaceholder}
        loadingState={loadingState}
        currentProvider={currentProvider}
        hasPrefillText={tidbitData?.tutor_prefill === input && shouldShowStarterText}
        onClearPrefill={handleClearPrefill}
      />

      {/* UPDATED: Share to BitBoard Section - Show after 2 messages (1 exchange) */}
      <ShareToBitBoard
        show={showShareOptions && messages.length >= 2}
        messages={messages}
        user={user}
        tidbitNumber={currentTidbitNumber}
        tidbitTitle={currentTidbitTitle}
        tidbitData={tidbitData}
        loadingState={loadingState}
        onPost={() => {/* Handled internally by component */}}
        onSuccess={(message: string) => setSuccessMessage(message)}
        onError={handleError}
      />

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