'use client'

import React, { useState, useEffect } from 'react';
import { Sparkles, Users, Lock, Globe, X, RotateCcw, Edit3, Loader2, Eye, EyeOff, MessageCircle, Shield } from 'lucide-react';
import { getSupabaseBrowserClient } from '../../lib/supabaseClient';
import { useMounted } from '../../lib/clientUtils';
import { API_PROVIDERS } from './AIProviderSelector';
import type { Message } from './TutorChatArea';
import type { ErrorType } from './TutorErrorDisplay';
import RotatingWord from '../RotatingWord';

interface TidbitData {
  id: number;
  day_number: number;
  title: string;
  [key: string]: any;
}

interface ShareToBitBoardProps {
  show: boolean;
  messages: Message[];
  user: any;
  tidbitNumber: number;
  tidbitTitle: string;
  tidbitData: TidbitData | null;
  loadingState: 'idle' | 'sending' | 'posting' | 'copying' | 'loading_tidbit';
  onPost: () => void;
  onSuccess: (message: string) => void;
  onError: (type: ErrorType, message: string, retryAction?: () => void) => void;
}

export function ShareToBitBoard({
  show,
  messages,
  user,
  tidbitNumber,
  tidbitTitle,
  tidbitData,
  loadingState,
  onPost,
  onSuccess,
  onError
}: ShareToBitBoardProps) {
  // Single hydration safety check
  const mounted = useMounted();
  
  const [showModal, setShowModal] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [userCommentary, setUserCommentary] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [generatingAISummary, setGeneratingAISummary] = useState(false);
  const [showOriginalConvo, setShowOriginalConvo] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [originalConversation, setOriginalConversation] = useState("");
  
  // UPDATED: Simple toggle for including original conversation in posts
  const [includeOriginalConversation, setIncludeOriginalConversation] = useState(true);

  // Simplified derived states
  const isAuthenticated = mounted && !!user;
  const hasMessages = mounted && messages.length >= 2;
  const canShow = mounted && show && hasMessages;

  // Format original conversation
  const formatOriginalConversation = () => {
    if (!mounted || messages.length < 2) return "";
    
    return messages
      .map((msg) => {
        const aiProvider = API_PROVIDERS.find(p => p.id === msg.provider)?.name || 'AI';
        const role = msg.role === 'user' ? 'You' : aiProvider;
        return `**${role}:** ${msg.content}`;
      })
      .join('\n\n');
  };

  // Auto-generate AI summary when modal opens
  useEffect(() => {
    if (!mounted || !showModal || !hasMessages || postContent || generatingAISummary) return;
    
    generateAISummaryAuto();
    setOriginalConversation(formatOriginalConversation());
  }, [mounted, showModal, hasMessages]);

  // Auto-generate AI summary of entire conversation
  const generateAISummaryAuto = async () => {
    if (!mounted || messages.length < 2) return;

    setGeneratingAISummary(true);

    try {
      // Prepare conversation for AI analysis
      const conversationText = messages
        .map((msg) => {
          const provider = API_PROVIDERS.find(p => p.id === msg.provider)?.name || 'AI';
          const role = msg.role === 'user' ? 'User' : provider;
          return `${role}: ${msg.content}`;
        })
        .join('\n\n');

      // Count interactions
      const userMessages = messages.filter(m => m.role === 'user');
      const aiMessages = messages.filter(m => m.role === 'assistant');

      const prompt = `You are creating a detailed, valuable social media post about someone's AI conversation experience.

CONVERSATION ANALYSIS:
${conversationText}

CONTEXT:
- This was from Daily Tidbit #${tidbitNumber}: "${tidbitTitle}"
- They had ${userMessages.length} questions/requests and ${aiMessages.length} AI responses

TASK: Create a detailed social media post (500-800 characters) that follows this structure:

**Opening Hook:** "Just used AI to accomplish [SPECIFIC_GOAL] with Daily Tidbit #${tidbitNumber}! Here's what happened:"

**The Journey:** Show the conversation progression with specific details

**Include Valuable Content:** Include the actual valuable content from the conversation

**Closing:** End with takeaway: "Key learning: [WHAT_THEY_DISCOVERED]"

RESPOND ONLY with the social media post text - no quotes, no extra text, just the post content.`;

      // Call the chat API to generate the summary
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          provider: 'openai'
        })
      });

      if (!response.ok) throw new Error('Failed to generate AI summary');

      const data = await response.json();
      
      if (data.assistant) {
        const aiSummary = data.assistant.trim().replace(/^["']|["']$/g, '');
        setPostContent(aiSummary);
      }

    } catch (error) {
      console.error('Error generating AI summary:', error);
      setPostContent(formatOriginalConversation());
      onError('chat', 'Failed to generate AI summary. Showing original conversation instead.');
    } finally {
      setGeneratingAISummary(false);
    }
  };

  // Regenerate AI summary
  const regenerateAISummary = async () => {
    if (!mounted) return;
    setPostContent("");
    await generateAISummaryAuto();
  };

  // Track progress when post is created
  const markPostCreated = async (tidbitNumber: number, postId: string) => {
    if (!mounted || !user) return;

    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;

      console.log(`Tracking TidbitTutor post for Tidbit ${tidbitNumber}, Post ID: ${postId}`);
      
      const { error } = await supabase
        .from('user_tidbit_progress')
        .upsert({
          user_id: user.id,
          tidbit_number: tidbitNumber,
          posted_at: new Date().toISOString(),
          bitboard_post_id: postId
        }, {
          onConflict: 'user_id,tidbit_number'
        });

      if (error) {
        console.error('Error marking tutor post created:', error);
      } else {
        console.log(`TidbitTutor posting tracked successfully for Tidbit ${tidbitNumber}!`);
      }
    } catch (error) {
      console.error('Error updating tutor post progress:', error);
    }
  };

  // Post to BitBoard
  const handlePostToBitBoard = async () => {
    if (!mounted || loadingState === 'posting') return;

    if (!user) {
      onError('auth', 'Please sign in to post to BitBoard!');
      return;
    }

    if (!postContent.trim()) {
      onError('post', 'Please add some content to your post!');
      return;
    }

    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        onError('network', 'Database connection not available. Please try again.');
        return;
      }

      // Format original conversation for storage (only if enabled)
      const originalConversation = includeOriginalConversation ? messages
        .map((msg) => {
          const aiProvider = API_PROVIDERS.find(p => p.id === msg.provider)?.name || 'AI';
          const role = msg.role === 'user' ? 'You' : aiProvider;
          return `**${role}:** ${msg.content}`;
        })
        .join('\n\n') : null;

      // Create conversation metadata
      const userMessages = messages.filter(m => m.role === 'user');
      const aiMessages = messages.filter(m => m.role === 'assistant');
      const providersUsed = [...new Set(messages.map(m => m.provider).filter(Boolean))];

      const conversationMetadata = {
        message_count: messages.length,
        user_messages: userMessages.length,
        ai_messages: aiMessages.length,
        providers_used: providersUsed,
        tidbit_number: tidbitNumber,
        tidbit_title: tidbitTitle,
        includes_original_conversation: includeOriginalConversation
      };

      // Determine what the main content should be
      // Priority: User Commentary > AI Summary
      const hasUserCommentary = userCommentary.trim().length > 0;
      const mainContent = hasUserCommentary ? userCommentary.trim() : postContent.trim();

      const postData = {
        user_id: user.id,
        content: mainContent, // Main display content
        user_commentary: hasUserCommentary ? userCommentary.trim() : null,
        ai_summary: postContent.trim(), // Always store the AI summary
        original_conversation: originalConversation, // Only if enabled
        conversation_metadata: conversationMetadata,
        tidbit: tidbitNumber,
        type: 'tidbit_tutor_enhanced',
        is_private: isPrivate,
      };

      console.log('Posting enhanced content to BitBoard:', postData);

      const { data: newPost, error: supabaseError } = await supabase
        .from('posts')
        .insert(postData)
        .select()
        .single();

      if (supabaseError) {
        console.error('Supabase error details:', supabaseError);
        throw new Error(`Failed to post: ${supabaseError.message}`);
      }

      console.log('Enhanced TidbitTutor post created successfully:', newPost);

      // Track progress with the actual post ID
      await markPostCreated(tidbitNumber, newPost.id);

      // Success handling
      setShowModal(false);
      
      const successMessage = isPrivate 
        ? 'Private post saved successfully!' 
        : 'Posted to BitBoard successfully!';
      
      // Show custom success modal BEFORE calling onSuccess to prevent any alerts
      if (mounted && typeof window !== 'undefined') {
        // Create a custom success modal
        const showSuccessModal = () => {
          const modal = document.createElement('div');
          modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(4px);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
            animation: fadeIn 0.3s ease-out;
          `;
          
          const content = document.createElement('div');
          content.style.cssText = `
            background: white;
            border-radius: 1.5rem;
            padding: 2rem;
            max-width: 400px;
            width: 100%;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            animation: slideUp 0.4s ease-out;
            position: relative;
          `;
          
          const emoji = '🌴'; // Always use palm tree since both go to BitBoard
          const title = isPrivate ? 'Private Post Saved!' : 'Posted to BitBoard!';
          const subtitle = isPrivate 
            ? 'Your private AI creation is now on BitBoard (only you can see it)'
            : 'Your AI story is now live for the community to see!';
          const buttonText = 'View on BitBoard'; // Always goes to BitBoard
          const buttonColor = isPrivate ? '#f97316' : '#60A875';
          
          content.innerHTML = `
            <div style="font-size: 3rem; margin-bottom: 1rem; animation: bounce 0.6s ease-out;">${emoji}</div>
            <h3 style="font-size: 1.5rem; font-weight: bold; color: #111827; margin-bottom: 0.5rem; font-family: 'Playfair Display', serif;">${title}</h3>
            <p style="color: #6b7280; margin-bottom: 2rem; line-height: 1.5;">${subtitle}</p>
            <div style="display: flex; gap: 0.75rem; justify-content: center;">
              <button id="viewPost" style="
                background: ${buttonColor};
                color: white;
                border: none;
                padding: 0.75rem 1.5rem;
                border-radius: 0.75rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
                box-shadow: 0 4px 12px rgba(96, 168, 117, 0.3);
                font-size: 1rem;
              ">${buttonText}</button>
            </div>
          `;
          
          // Add animations
          const style = document.createElement('style');
          style.textContent = `
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes slideUp {
              from { transform: translateY(30px) scale(0.95); opacity: 0; }
              to { transform: translateY(0) scale(1); opacity: 1; }
            }
            @keyframes bounce {
              0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
              40% { transform: translateY(-10px); }
              60% { transform: translateY(-5px); }
            }
            #viewPost:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 20px rgba(96, 168, 117, 0.4) !important;
            }
          `;
          document.head.appendChild(style);
          
          modal.appendChild(content);
          document.body.appendChild(modal);
          
          // Add event listeners - always go to BitBoard in same window
          content.querySelector('#viewPost')?.addEventListener('click', () => {
            window.location.href = '/bitboard';
          });
          
          // Close on backdrop click
          modal.addEventListener('click', (e) => {
            if (e.target === modal) {
              document.body.removeChild(modal);
              document.head.removeChild(style);
            }
          });
          
          // Auto-close after 8 seconds if they don't interact
          setTimeout(() => {
            if (document.body.contains(modal)) {
              document.body.removeChild(modal);
              document.head.removeChild(style);
            }
          }, 8000);
        };
        
        showSuccessModal();
      }

      // Reset form
      setPostContent("");
      setUserCommentary("");
      setIsEditing(false);
      setShowOriginalConvo(false);
      setIncludeOriginalConversation(true); // Reset to default

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

      onError(errorType, errorMessage, () => handlePostToBitBoard());
    }
  };

  // Early return if not mounted
  if (!mounted) {
    return null;
  }

  if (!canShow) return null;

  if (!isAuthenticated) {
    return (
      <div className="mt-4 p-4 bg-gradient-to-r from-brand-green/10 to-brand-blue/10 rounded-lg border border-brand-green/20">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-brand-green" />
          <h3 className="font-semibold text-gray-900">Love your result?</h3>
        </div>
        <p className="text-sm text-gray-700 mb-3">
          Share your conversation with the community on BitBoard!
        </p>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Sign in to share your results!</span>
          <button className="text-sm text-brand-blue hover:text-blue-700 transition-colors flex items-center gap-1">
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Trigger Button */}
      <div className="mt-4 p-4 bg-gradient-to-r from-brand-green/10 to-brand-blue/10 rounded-lg border border-brand-green/20">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-brand-green" />
          <h3 className="font-semibold text-gray-900">Love your result?</h3>
        </div>
        <p className="text-sm text-gray-700 mb-3">
          Share your AI conversation story with the community!
        </p>
        
        <button
          onClick={() => setShowModal(true)}
          disabled={loadingState === 'posting'}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-green text-white rounded-lg hover:bg-brand-green-dark transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Users className="w-4 h-4" />
          <span className="flex items-center gap-1">
            Share Your <RotatingWord /> to BitBoard
          </span>
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-brand-green to-brand-blue rounded-full flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Share Your AI Story</h2>
                    <p className="text-sm text-gray-600">Daily Tidbit #{tidbitNumber}: "{tidbitTitle}"</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Privacy Toggle */}
              <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${isPrivate ? 'bg-orange-100' : 'bg-green-100'}`}>
                      {isPrivate ? (
                        <Lock className="w-5 h-5 text-orange-600" />
                      ) : (
                        <Globe className="w-5 h-5 text-brand-green-dark" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {isPrivate ? 'Private Post' : 'Public Post'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {isPrivate 
                          ? 'Only you can see this post' 
                          : 'Visible to everyone on BitBoard'
                        }
                      </div>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setIsPrivate(!isPrivate)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      isPrivate 
                        ? 'bg-orange-500 focus:ring-orange-500' 
                        : 'bg-brand-green focus:ring-brand-green'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isPrivate ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* AI Generated Summary Loading */}
              {generatingAISummary && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 text-center border border-purple-200">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse">
                    <Sparkles className="w-8 h-8 text-white animate-spin" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Creating your AI story...</h3>
                  <p className="text-gray-600">Analyzing your conversation to create the perfect post</p>
                </div>
              )}

              {/* Post Content */}
              {!generatingAISummary && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Your AI Story
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="flex items-center gap-1 text-sm text-brand-blue-dark hover:text-blue-700 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                        {isEditing ? 'Preview' : 'Edit'}
                      </button>
                      <button
                        onClick={regenerateAISummary}
                        className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 transition-colors"
                        disabled={generatingAISummary}
                      >
                        <RotateCcw className="w-4 h-4" />
                        Regenerate
                      </button>
                    </div>
                  </div>

                  {isEditing ? (
                    <textarea
                      value={postContent}
                      onChange={(e) => setPostContent(e.target.value)}
                      rows={6}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-brand-green resize-none"
                      placeholder="Edit your AI story..."
                    />
                  ) : (
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                      <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{postContent}</p>
                    </div>
                  )}

                  {/* UPDATED: Character count and simplified conversation toggle */}
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-500">
                      {postContent.length}/1000 characters
                    </p>
                    
                    {/* UPDATED: Simplified toggle with minimal styling */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIncludeOriginalConversation(!includeOriginalConversation)}
                        className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors focus:outline-none ${
                          includeOriginalConversation 
                            ? 'bg-brand-green' 
                            : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                            includeOriginalConversation ? 'translate-x-4' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                      <span className="text-gray-600 text-xs">
                        {includeOriginalConversation ? 'Include full convo in your post' : 'Only include the AI summary in your post'}
                      </span>
                    </div>
                  </div>

                  {/* Show conversation button - only show if conversation is included */}
                  {includeOriginalConversation && (
                    <div className="mt-2">
                      <button
                        onClick={() => setShowOriginalConvo(!showOriginalConvo)}
                        className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        {showOriginalConvo ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        {showOriginalConvo ? 'Hide' : 'Show'} original conversation
                      </button>
                    </div>
                  )}

                  {/* Original Conversation (Collapsible) - Show if user wants to see it */}
                  {showOriginalConvo && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Original Conversation:</h4>
                      <div className="text-xs text-gray-600 font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                        {originalConversation}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* User Commentary */}
              {!generatingAISummary && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add Your Thoughts (Optional)
                  </label>
                  <textarea
                    value={userCommentary}
                    onChange={(e) => setUserCommentary(e.target.value)}
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-brand-green resize-none"
                    placeholder="Share your thoughts about this conversation, what you learned, or how you plan to use it..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Your personal commentary will be shown prominently in the post
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              {!generatingAISummary && (
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePostToBitBoard}
                    disabled={loadingState === 'posting' || !postContent.trim()}
                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl transition-colors font-semibold disabled:opacity-50 text-white ${
                      isPrivate 
                        ? 'bg-orange-500 hover:bg-orange-600' 
                        : 'bg-brand-green hover:bg-brand-green-dark'
                    }`}
                  >
                    {loadingState === 'posting' ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      <>
                        {isPrivate ? <Lock className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
                        {isPrivate ? 'Save Privately' : 'Share to BitBoard'}
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}