'use client'

import React, { useState, useEffect } from 'react';
import { Sparkles, Users, Lock, Globe, X, RotateCcw, Edit3, Loader2, Eye, EyeOff } from 'lucide-react';
import { useSupabaseBrowser } from '../../lib/supabaseClient'; // ? CORRECT IMPORT
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
  // ? HYDRATION SAFE: Use the custom hook
  const { client: supabase, isReady: supabaseReady, mounted } = useSupabaseBrowser();
  
  const [showModal, setShowModal] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [userCommentary, setUserCommentary] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [generatingAISummary, setGeneratingAISummary] = useState(false);
  const [showOriginalConvo, setShowOriginalConvo] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [originalConversation, setOriginalConversation] = useState("");

  // Hydration-safe calculations
  const isAuthenticated = mounted ? !!user : false;
  const hasMessages = mounted ? messages.length >= 2 : false;
  const canShow = mounted ? show && hasMessages : false;

  // Format original conversation (hydration safe)
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

  // Auto-generate AI summary when modal opens (hydration safe)
  useEffect(() => {
    if (mounted && showModal && messages.length >= 2 && !postContent && !generatingAISummary) {
      generateAISummaryAuto();
      setOriginalConversation(formatOriginalConversation());
    }
  }, [mounted, showModal, messages.length, postContent, generatingAISummary]);

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

      // Count interactions (hydration safe)
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

**Closing:** End with takeaway: "?? Key learning: [WHAT_THEY_DISCOVERED]"

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

  // ? HYDRATION SAFE: Track progress when post is created
  const markPostCreated = async (tidbitNumber: number, postId: string) => {
    if (!mounted || !user || !supabase) return;

    try {
      console.log(`?? Tracking TidbitTutor post for Tidbit ${tidbitNumber}, Post ID: ${postId}`);
      
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
        console.error('? Error marking tutor post created:', error);
      } else {
        console.log(`? TidbitTutor posting tracked successfully for Tidbit ${tidbitNumber}!`);
      }
    } catch (error) {
      console.error('? Error updating tutor post progress:', error);
    }
  };

  // ? HYDRATION SAFE: Post to BitBoard
  const handlePostToBitBoard = async () => {
    if (!mounted || !supabase || !supabaseReady || loadingState === 'posting') return;

    if (!user) {
      onError('auth', 'Please sign in to post to BitBoard!');
      return;
    }

    if (!postContent.trim()) {
      onError('post', 'Please add some content to your post!');
      return;
    }

    try {
      // Combine post content with user commentary if provided
      let finalContent = postContent.trim();
      if (userCommentary.trim()) {
        finalContent += `\n\n---\n\n${userCommentary.trim()}`;
      }

      const postData = {
        user_id: user.id,
        content: finalContent,
        tidbit: tidbitNumber,
        type: 'text',
        is_private: isPrivate,
      };

      console.log('Posting to BitBoard with data:', postData);

      // ? HYDRATION SAFE: Use the mounted supabase client
      const { data: newPost, error: supabaseError } = await supabase
        .from('posts')
        .insert(postData)
        .select()
        .single();

      if (supabaseError) {
        console.error('Supabase error details:', supabaseError);
        throw new Error(`Failed to post: ${supabaseError.message}`);
      }

      console.log('?? TidbitTutor post created successfully:', newPost);

      // Track progress with the actual post ID
      await markPostCreated(tidbitNumber, newPost.id);

      // Success handling
      setShowModal(false);
      
      const successMessage = isPrivate 
        ? '?? Private post saved successfully!' 
        : '?? Posted to BitBoard successfully!';
      
      onSuccess(successMessage);

      // Only open new windows if mounted and user confirms
      if (mounted && typeof window !== 'undefined') {
        if (isPrivate) {
          const viewProfile = confirm(`${successMessage}\n\nWant to see it in your private collection?`);
          if (viewProfile) {
            window.open('/profile', '_blank');
          }
        } else {
          const viewBitBoard = confirm(`${successMessage}\n\nWant to see it on BitBoard?`);
          if (viewBitBoard) {
            window.open('/bitboard', '_blank');
          }
        }
      }

      // Reset form
      setPostContent("");
      setUserCommentary("");
      setIsEditing(false);
      setShowOriginalConvo(false);

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

  // Hydration safety guard - don't render anything until mounted
  if (!mounted) {
    return null;
  }

  if (!canShow) return null;

  if (!isAuthenticated) {
    return (
      <div className="mt-4 p-4 bg-gradient-to-r from-[brand-green]/10 to-[brand-blue]/10 rounded-lg border border-[brand-green]/20">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-[brand-green]" />
          <h3 className="font-semibold text-gray-900">Love your result?</h3>
        </div>
        <p className="text-sm text-gray-700 mb-3">
          Share your conversation with the community on BitBoard!
        </p>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Sign in to share your results!</span>
          <button className="text-sm text-[brand-blue] hover:text-blue-700 transition-colors flex items-center gap-1">
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Trigger Button */}
      <div className="mt-4 p-4 bg-gradient-to-r from-[brand-green]/10 to-[brand-blue]/10 rounded-lg border border-[brand-green]/20">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-[brand-green]" />
          <h3 className="font-semibold text-gray-900">Love your result?</h3>
        </div>
        <p className="text-sm text-gray-700 mb-3">
          Share your AI conversation story with the community!
        </p>
        
        <button
          onClick={() => setShowModal(true)}
          disabled={loadingState === 'posting' || !supabaseReady}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[brand-green] text-white rounded-lg hover:bg-brand-greenDark transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Users className="w-4 h-4" />
          <span className="flex items-center gap-1">
            Share Your <RotatingWord /> to BitBoard
          </span>
        </button>
      </div>

      {/* Modal - Only render when showModal is true */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[brand-green] to-[brand-blue] rounded-full flex items-center justify-center">
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
                        <Globe className="w-5 h-5 text-brand-greenDark" />
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

              {/* Show Supabase not ready warning */}
              {!supabaseReady && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    ?? Initializing database connection...
                  </p>
                </div>
              )}

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
                      ? Your AI Story
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="flex items-center gap-1 text-sm text-brand-blueDark hover:text-blue-700 transition-colors"
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
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[brand-green] focus:border-[brand-green] resize-none"
                      placeholder="Edit your AI story..."
                    />
                  ) : (
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                      <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{postContent}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-500">
                      {postContent.length}/1000 characters
                    </p>
                    <button
                      onClick={() => setShowOriginalConvo(!showOriginalConvo)}
                      className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      {showOriginalConvo ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {showOriginalConvo ? 'Hide' : 'Show'} original conversation
                    </button>
                  </div>

                  {/* Original Conversation (Collapsible) */}
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
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[brand-green] focus:border-[brand-green] resize-none"
                    placeholder="Share your thoughts about this conversation, what you learned, or how you plan to use it..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Your personal commentary will be added below the main content
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
                    disabled={loadingState === 'posting' || !postContent.trim() || !supabaseReady}
                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl transition-colors font-semibold disabled:opacity-50 text-white ${
                      isPrivate 
                        ? 'bg-orange-500 hover:bg-orange-600' 
                        : 'bg-[brand-green] hover:bg-brand-greenDark'
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
