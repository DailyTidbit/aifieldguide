"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "../lib/supabaseClient";
import { safeWindow } from "../lib/clientUtils";
import { Calendar, Loader2, Lock } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

// Import our modular components
import { FormattedMessage } from "./tutor/FormattedMessage";
import { AIProviderSelector, API_PROVIDERS } from "./tutor/AIProviderSelector";
import { TutorErrorDisplay, type ErrorState, type ErrorType } from "./tutor/TutorErrorDisplay";
import { TutorSuccessDisplay } from "./tutor/TutorSuccessDisplay";
import { TutorChatArea, type Message } from "./tutor/TutorChatArea";
import { TutorInputArea } from "./tutor/TutorInputArea";
import { ShareToBitBoard } from "./tutor/ShareToBitBoard";
import AuthModal from "./AuthModal";

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

type LoadingState = "idle" | "sending" | "posting" | "copying" | "loading_tidbit";

// Skeleton component for loading state
function TidbitTutorSkeleton({ embedded = false }: { embedded?: boolean }) {
  return (
    <div className={embedded ? "w-full relative" : "relative max-w-xl mx-auto p-6 border border-gray-200 rounded-xl bg-white shadow-sm"}>
      <div className="animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
            <div className="h-6 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="w-20 h-8 bg-gray-200 rounded"></div>
        </div>
        <div className="h-20 bg-gray-200 rounded-lg mb-4"></div>
        <div className="h-12 bg-gray-200 rounded-lg"></div>
      </div>
    </div>
  );
}

export default function TidbitTutor({
  tidbitNumber,
  tidbitTitle,
  onConversationUpdate,
  autoLoadFromSupabase = true,
  dayNumber,
  embedded = false,
}: TidbitTutorProps) {
  // PRIMARY HYDRATION SAFETY - Critical first state
  const [mounted, setMounted] = useState(false);

  // Core state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const [error, setError] = useState<ErrorState | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>("openai");
  const [showProviderMenu, setShowProviderMenu] = useState(false);

  // UI state
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);
  const [lastSharedIndex, setLastSharedIndex] = useState<number | null>(null);
  const [showShareOptions, setShowShareOptions] = useState(false);

  // Supabase integration state
  const [tidbitData, setTidbitData] = useState<TidbitData | null>(null);

  // Smart starter text state
  const [hasUsedProvider, setHasUsedProvider] = useState<Set<string>>(new Set());
  const [shouldShowStarterText, setShouldShowStarterText] = useState(true);

  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Use safe auth hook
  const { user, loading: authLoading, mounted: authMounted } = useAuth();

  // Mount detection - Critical for hydration safety
  useEffect(() => {
    setMounted(true);
  }, []);

  // OAuth redirect target - HYDRATION SAFE: Only after mounted
  const redirectTo = useMemo(() => {
    if (!mounted || typeof window === 'undefined') return null;
    return window.location.href;
  }, [mounted]);

  // Derived values
  const getCurrentProvider = () =>
    API_PROVIDERS.find((p) => p.id === selectedProvider) || API_PROVIDERS[0];

  const currentTidbitNumber = tidbitData?.day_number || tidbitNumber || 1;
  const currentTidbitTitle = tidbitData?.title || tidbitTitle || "Unknown Tidbit";
  const currentPlaceholder =
    tidbitData?.tutor_placeholder ||
    (loadingState === "sending"
      ? `${getCurrentProvider().name} is processing...`
      : "Type your message...");

  // Load tidbit from Supabase - HYDRATION SAFE: Only after mounted
  useEffect(() => {
    const loadTidbitData = async () => {
      if (!autoLoadFromSupabase || !mounted) return;

      setLoadingState("loading_tidbit");

      try {
        const supabase = getSupabaseBrowserClient();
        
        // CRITICAL FIX: Handle null supabase client
        if (!supabase) {
          throw new Error('Supabase client not available');
        }
        
        let query = supabase.from("tidbits").select("*").eq("status", "published");

        if (dayNumber) {
          query = query.eq("day_number", dayNumber);
        } else if (tidbitNumber) {
          query = query.eq("day_number", tidbitNumber);
        } else {
          query = query.order("day_number", { ascending: false }).limit(1);
        }

        const { data, error } = await query.single();

        if (error) {
          // If "No rows" for specific, try latest published
          if ((error as any).code === "PGRST116") {
            const { data: latestData, error: latestError } = await supabase
              .from("tidbits")
              .select("*")
              .eq("status", "published")
              .order("day_number", { ascending: false })
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
      } catch (err: any) {
        console.error("Failed to load tidbit:", err);
        setError({
          type: "tidbit_load",
          message: "Failed to load tidbit information. Using default settings.",
          retryAction: loadTidbitData,
        });
      } finally {
        setLoadingState("idle");
      }
    };

    loadTidbitData();
  }, [autoLoadFromSupabase, dayNumber, tidbitNumber, mounted]);

  // Set initial prefill/provider from tidbit - HYDRATION SAFE: Only after both mounted
  useEffect(() => {
    if (!mounted || !authMounted) return;
    
    if (tidbitData && messages.length === 0) {
      if (tidbitData.tutor_prefill && shouldShowStarterText) {
        setInput(tidbitData.tutor_prefill);
      }
      if (tidbitData.default_ai_provider) {
        const valid = API_PROVIDERS.find((p) => p.id === tidbitData.default_ai_provider);
        if (valid) setSelectedProvider(valid.id);
      }
    }
  }, [tidbitData, messages.length, shouldShowStarterText, mounted, authMounted]);

  // Starter text behavior on provider change - HYDRATION SAFE: Only after mounted
  useEffect(() => {
    if (!mounted) return;
    
    const hasUsedThisProvider = hasUsedProvider.has(selectedProvider);
    if (tidbitData?.tutor_prefill) {
      if (!hasUsedThisProvider && !input.trim()) {
        setInput(tidbitData.tutor_prefill);
        setShouldShowStarterText(true);
      } else if (hasUsedThisProvider && input === tidbitData.tutor_prefill) {
        setInput("");
        setShouldShowStarterText(false);
      }
    }
  }, [selectedProvider, tidbitData?.tutor_prefill, hasUsedProvider, input, mounted]);

  // Auto-clear error/success
  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(t);
    }
  }, [error]);

  useEffect(() => {
    if (successMessage) {
      const t = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(t);
    }
  }, [successMessage]);

  // Utility
  const handleError = (type: ErrorType, message: string, retryAction?: () => void) => {
    setError({ type, message, retryAction });
    setLoadingState("idle");
  };
  const clearError = () => setError(null);

  // Auth modal handlers
  const handleAuthSuccess = () => {
    if (!mounted) return;
    setSuccessMessage("Welcome! You can now use Tidbit Tutor.");
    setShowAuthModal(false);
  };

  // Chat - HYDRATION SAFE: Only after both mounted
  async function sendMessage() {
    if (!mounted || !authMounted) return;
    
    // Block send when not logged in - show modal instead
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (!input.trim() || loadingState === "sending") return;

    const currentProvider = getCurrentProvider();
    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
      provider: currentProvider.id,
    };

    setMessages((prev) => [...prev, userMessage]);

    setHasUsedProvider((prev) => new Set([...prev, selectedProvider]));
    setShouldShowStarterText(false);

    setInput("");
    setLoadingState("sending");
    clearError();

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          provider: selectedProvider,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          (errorData as any).error || `Server error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      if (!data?.assistant) {
        throw new Error("Invalid response from AI service");
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: data.assistant,
        timestamp: new Date(),
        provider: currentProvider.id,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      onConversationUpdate?.(userMessage.content, data.assistant);

      // Show share options after the first exchange
      if (messages.length >= 0) setShowShareOptions(true);

      setSuccessMessage(`${currentProvider.name} responded successfully!`);
    } catch (err) {
      console.error("Chat error:", err);

      let errorMessage = "Failed to send message. Please try again.";
      let errorType: ErrorType = "chat";

      if (err instanceof Error) {
        if (err.message.match(/fetch|network/i)) {
          errorType = "network";
          errorMessage = "Network error. Check your connection and try again.";
        } else if (err.message.includes("Server error: 5")) {
          errorMessage = "Server is temporarily unavailable. Please try again shortly.";
        } else if (err.message.match(/provider|API/i)) {
          errorType = "provider";
          errorMessage = `${getCurrentProvider().name} is currently unavailable. Try switching providers.`;
        } else {
          errorMessage = err.message;
        }
      }

      handleError(errorType, errorMessage, () => sendMessage());

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Sorry, I encountered an error with ${getCurrentProvider().name}. Please try again or switch providers.`,
          timestamp: new Date(),
          provider: getCurrentProvider().id,
        },
      ]);
    } finally {
      setLoadingState("idle");
    }
  }

  // Copy - HYDRATION SAFE: Fixed navigator.clipboard access
  const copyMessage = async (content: string, index: number) => {
    if (!mounted || loadingState === "copying") return;

    setLoadingState("copying");
    clearError();

    try {
      // HYDRATION FIX: Safe clipboard access
      if (!window.navigator?.clipboard) {
        throw new Error("Clipboard not supported in this browser");
      }

      await window.navigator.clipboard.writeText(content);
      setCopiedMessageIndex(index);
      setSuccessMessage("Message copied to clipboard!");
      setTimeout(() => setCopiedMessageIndex(null), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
      handleError(
        "network",
        "Failed to copy to clipboard. You can manually select and copy the text."
      );

      // HYDRATION SAFE: Fallback copy method
      try {
        if (typeof document !== 'undefined') {
          const textArea = document.createElement("textarea");
          textArea.value = content;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand("copy");
          document.body.removeChild(textArea);
          setSuccessMessage("Message copied to clipboard!");
        }
      } catch (fallbackErr) {
        console.error("Fallback copy failed:", fallbackErr);
      }
    } finally {
      setLoadingState("idle");
    }
  };

  // Share a specific exchange - HYDRATION SAFE: Only after both mounted
  const shareSpecificConversation = async (userMsgIndex: number) => {
    if (!mounted || !authMounted || loadingState === "posting") return;

    if (!user) {
      setShowAuthModal(true);
      return;
    }

    const userMsg = messages[userMsgIndex];
    const assistantMsg = messages[userMsgIndex + 1];

    if (!userMsg || !assistantMsg || userMsg.role !== "user" || assistantMsg.role !== "assistant") {
      handleError("post", "Invalid conversation pair selected.");
      return;
    }

    setLoadingState("posting");
    clearError();

    try {
      const supabase = getSupabaseBrowserClient();
      
      // CRITICAL FIX: Handle null supabase client  
      if (!supabase) {
        throw new Error('Supabase client not available');
      }
      
      const { error: supabaseError } = await supabase.from("posts").insert({
        user_id: user.id,
        content: `Used AI with Daily Tidbit #${currentTidbitNumber}! "${currentTidbitTitle}"`,
        before_text: userMsg.content,
        after_text: assistantMsg.content,
        tidbit: currentTidbitNumber,
        type: "tidbit_tutor_conversation",
        description: `AI result from Tidbit Tutor - Day ${currentTidbitNumber}`,
        ...(tidbitData && { tidbit_id: tidbitData.id }),
      });

      if (supabaseError) {
        console.error('Supabase error:', supabaseError);
        throw supabaseError;
      }

      setLastSharedIndex(userMsgIndex + 1);
      setSuccessMessage("Conversation posted successfully!");

      setTimeout(() => setLastSharedIndex(null), 3000);

      // HYDRATION SAFE: Window access
      if (mounted && typeof window !== 'undefined') {
        setTimeout(() => {
          const viewPost = window.confirm("View your post on BitBoard?");
          if (viewPost) window.open("/bitboard", "_blank");
        }, 1000);
      }
    } catch (error: any) {
      console.error("Share error:", error);
      handleError("post", "Failed to share conversation. Please try again.", () =>
        shareSpecificConversation(userMsgIndex)
      );
    } finally {
      setLoadingState("idle");
    }
  };

  // Provider change - HYDRATION SAFE: Only after mounted
  const handleProviderChange = (providerId: string) => {
    if (!mounted) return;
    setSelectedProvider(providerId);
  };

  // Clear starter text - HYDRATION SAFE: Only after mounted
  const handleClearPrefill = () => {
    if (!mounted) return;
    setInput("");
    setShouldShowStarterText(false);
  };

  // Input area click handler - HYDRATION SAFE: Only after both mounted
  const handleInputAreaClick = () => {
    if (!mounted || !authMounted) return;
    if (!user) {
      setShowAuthModal(true);
    }
  };

  // HYDRATION SAFETY: Show skeleton during any loading state
  if (!mounted || !authMounted) {
    return <TidbitTutorSkeleton embedded={embedded} />;
  }

  const currentProvider = getCurrentProvider();
  const gated = !user;

  return (
    <>
      <div className={embedded ? "w-full relative" : "relative max-w-xl mx-auto p-6 border border-gray-200 rounded-xl bg-white shadow-sm"}>
        {/* Header with BRAND COLORS */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-blue rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">#{currentTidbitNumber}</span>
            </div>
            <h2
              className={`${embedded ? "text-2xl" : "text-xl"} font-bold text-gray-900`}
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Tidbit Tutor
            </h2>
          </div>

          <AIProviderSelector
            selectedProvider={selectedProvider}
            onProviderChange={handleProviderChange}
            showMenu={showProviderMenu}
            onToggleMenu={setShowProviderMenu}
            disabled={loadingState === "loading_tidbit" || gated}
          />
        </div>

        {/* Login soft-gate banner with BRAND COLORS */}
        {gated && <LoginCtaBanner onClick={() => setShowAuthModal(true)} />}

        {/* Tidbit context with BRAND COLORS */}
        {tidbitData && (
          <div className="mb-4">
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-brand-green mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 text-sm">{tidbitData.title}</h3>
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                  {tidbitData.seo_description || tidbitData.walkthrough_intro}
                </p>
                {tidbitData.tags && typeof tidbitData.tags === "string" && tidbitData.tags.trim() && (
                  <div className="flex gap-1 mt-2">
                    {tidbitData.tags
                      .split(",")
                      .slice(0, 3)
                      .map((tag, i) => (
                        <span
                          key={i}
                          className="text-xs bg-brand-green/10 text-brand-green px-2 py-0.5 rounded"
                        >
                          {tag.trim()}
                        </span>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Loading state for tidbit with BRAND COLORS */}
        {loadingState === "loading_tidbit" && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-brand-blue animate-spin" />
              <span className="text-sm text-gray-600">Loading tidbit information...</span>
            </div>
          </div>
        )}

        {/* Errors / Success */}
        <TutorErrorDisplay error={error} onClearError={clearError} />
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

        {/* Thinking hint when first sending with BRAND COLORS */}
        {messages.length === 0 && loadingState === "sending" && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="bg-white text-gray-800 border border-gray-200 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${currentProvider.color}`}></div>
                <Loader2 className="w-4 h-4 text-brand-blue animate-spin" />
                <span className="text-sm text-gray-600">{currentProvider.name} is thinking...</span>
              </div>
            </div>
          </div>
        )}

        {/* Input Area with soft mask to block clicks */}
        <div className="relative" onClick={gated ? handleInputAreaClick : undefined}>
          <TutorInputArea
            input={input}
            onInputChange={setInput}
            onSend={sendMessage}
            placeholder={
              gated
                ? "Run today's tip with Tidbit Tutor. Create a free account or log in to use it."
                : currentPlaceholder
            }
            loadingState={loadingState}
            currentProvider={currentProvider}
            hasPrefillText={tidbitData?.tutor_prefill === input && shouldShowStarterText}
            onClearPrefill={handleClearPrefill}
          />

          {gated && (
            <div
              aria-hidden="true"
              className="absolute inset-0 rounded-lg bg-white/60 backdrop-blur-[1px] cursor-pointer"
            />
          )}
        </div>

        {/* Share to BitBoard */}
        <ShareToBitBoard
          show={showShareOptions && messages.length >= 2}
          messages={messages}
          user={user}
          tidbitNumber={currentTidbitNumber}
          tidbitTitle={currentTidbitTitle}
          tidbitData={tidbitData}
          loadingState={loadingState}
          onPost={() => { }}
          onSuccess={(message: string) => setSuccessMessage(message)}
          onError={handleError}
        />

        {/* Close provider menu when clicking outside */}
        {showProviderMenu && (
          <div className="fixed inset-0 z-5" onClick={() => setShowProviderMenu(false)} />
        )}

        {/* Full-window overlay (big CTA) with BRAND COLORS */}
        {gated && (
          <FullScreenGate
            onPrimary={() => setShowAuthModal(true)}
            onSecondary={() => setShowAuthModal(true)}
          />
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
        title="Unlock Tidbit Tutor"
        subtitle="Sign in to chat with AI and explore today's tip"
        redirectTo={redirectTo}
      />
    </>
  );
}

// Login CTA Banner with BRAND COLORS
function LoginCtaBanner({ onClick }: { onClick?: () => void }) {
  return (
    <div
      className="mb-4 border border-amber-200 bg-amber-50 text-amber-900 rounded-lg p-4 cursor-pointer hover:bg-amber-100 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          <Lock className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">
            Run today's tip with Tidbit Tutor. Create a free account or log in to use it.
          </p>
          <p className="text-xs text-amber-700 mt-1">Click here to sign in or create an account</p>
        </div>
      </div>
    </div>
  );
}

// Full Screen Gate with BRAND COLORS
function FullScreenGate({
  onPrimary,
  onSecondary,
}: {
  onPrimary: () => void;
  onSecondary: () => void;
}) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm p-6 text-center rounded-xl border border-gray-100">
      <div className="max-w-md w-full">
        <div className="mx-auto mb-4 w-12 h-12 rounded-xl bg-brand-green text-white flex items-center justify-center shadow-sm">
          <span className="text-lg font-bold">🔒</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
          Run today's tip with Tidbit Tutor
        </h2>
        <p className="text-gray-700 mb-6">
          Create a free account or log in to use it.
        </p>

        <div className="grid grid-cols-1 gap-2">
          <button
            onClick={onPrimary}
            className="px-5 py-3 rounded-lg bg-brand-green text-white font-semibold hover:bg-brand-greenDark transition"
          >
            Sign in or Create Account
          </button>
          <button
            onClick={onSecondary}
            className="text-sm text-brand-blue hover:underline"
          >
            Already have an account? Log In
          </button>
        </div>

        <ul className="mt-5 text-sm text-left text-gray-600 space-y-1 mx-auto max-w-sm">
          <li>✅ Try today's Tidbit inside our own Assistant</li>
          <li>✅ Test drive several leading AI models</li>
          <li>✅ Post your creations to the BitBoard</li>
          <li>✅ Create a profile and track your activity</li>
          <li>✅ Like posts, leave comments, and connect with others</li>
          <li>✅ Get special promos and perks from our AI partners</li>
          <li>✅ Did we mention our entire site is free!</li>
        </ul>
      </div>
    </div>
  );
}