'use client'

import React, { useState, useEffect } from 'react';
import { Sparkles, Wand2, RefreshCw, Loader2, Edit3, X, Check } from 'lucide-react';
import type { Message } from './TutorChatArea';

interface AIPostGeneratorProps {
  messages: Message[];
  tidbitNumber: number;
  tidbitTitle: string;
  onUsePost: (content: string, beforeText: string, afterText: string) => void;
  onCancel: () => void;
}

interface GeneratedPost {
  content: string;
  beforeText: string;
  afterText: string;
  style: 'casual' | 'professional' | 'excited' | 'detailed';
  reasoning: string;
}

export function AIPostGenerator({
  messages,
  tidbitNumber,
  tidbitTitle,
  onUsePost,
  onCancel
}: AIPostGeneratorProps) {
  // Essential hydration safety
  const [mounted, setMounted] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<'casual' | 'professional' | 'excited' | 'detailed'>('casual');
  const [customizing, setCustomizing] = useState(false);
  const [customContent, setCustomContent] = useState('');

  // Hydration safety - must be first useEffect
  useEffect(() => {
    setMounted(true);
  }, []);

  const styles = [
    { id: 'casual' as const, name: 'Casual', emoji: '😊', description: 'Friendly and conversational' },
    { id: 'professional' as const, name: 'Professional', emoji: '💼', description: 'Polished and business-like' },
    { id: 'excited' as const, name: 'Excited', emoji: '🎉', description: 'Enthusiastic and energetic' },
    { id: 'detailed' as const, name: 'Detailed', emoji: '📝', description: 'In-depth with specifics' }
  ];

  // Hydration-safe calculations
  const hasMessages = mounted ? messages.length > 0 : false;
  const messageCount = mounted ? messages.length : 0;

  const generatePosts = async () => {
    if (!mounted || !hasMessages) return;
    
    setGenerating(true);
    setGeneratedPosts([]);

    try {
      // Prepare conversation for AI analysis (hydration safe)
      const conversationText = messages
        .map((msg) => `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content}`)
        .join('\n\n');

      // Get the best before/after pairs from the conversation (hydration safe)
      const beforeAfterPairs = [];
      for (let i = 0; i < messages.length - 1; i++) {
        if (messages[i].role === 'user' && messages[i + 1].role === 'assistant') {
          beforeAfterPairs.push({
            before: messages[i].content,
            after: messages[i + 1].content
          });
        }
      }

      // Generate posts for each style
      const postPromises = styles.map(async (style) => {
        const prompt = `You are a social media expert helping someone create an engaging post about their AI writing improvement experience.

CONTEXT:
- They used Daily Tidbit #${tidbitNumber}: "${tidbitTitle}"
- They had a conversation with an AI writing assistant
- The conversation had ${messageCount} messages

CONVERSATION:
${conversationText}

TASK: Create a ${style.description} social media post that:

1. **Content** (main post): Write an engaging ${style.id} post (max 280 characters) that:
   - Captures the essence of their AI writing improvement journey
   - Mentions it&apos;s from Daily Tidbit #${tidbitNumber}
   - Shows personality and authenticity
   - Would inspire others to try AI writing tools
   - ${style.id === 'excited' ? 'Uses enthusiastic language and emojis' : ''}
   - ${style.id === 'professional' ? 'Maintains professional tone' : ''}
   - ${style.id === 'casual' ? 'Sounds like a friend sharing a cool discovery' : ''}
   - ${style.id === 'detailed' ? 'Includes specific details about the improvement' : ''}

2. **Before Text**: Choose the BEST user input from the conversation that shows their original writing (max 200 characters)

3. **After Text**: Choose the BEST AI response that shows the improvement (max 200 characters)

4. **Reasoning**: Explain in 1-2 sentences why you chose this before/after pair and this content style.

RESPOND ONLY with this JSON format:
{
  "content": "main post content here",
  "beforeText": "chosen user input here", 
  "afterText": "chosen AI response here",
  "reasoning": "why you chose this approach"
}`;

        // Call the chat API to generate the post
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: prompt }],
            provider: 'openai' // Use GPT-4 for creative post generation
          })
        });

        if (!response.ok) throw new Error(`Failed to generate ${style.id} post`);

        const data = await response.json();
        
        // Parse the JSON response
        let parsedResponse;
        try {
          // Clean up the response to extract JSON
          let cleanResponse = data.assistant.trim();
          
          // Remove markdown code blocks if present
          cleanResponse = cleanResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
          
          // Find JSON object
          const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            cleanResponse = jsonMatch[0];
          }
          
          parsedResponse = JSON.parse(cleanResponse);
        } catch (parseError) {
          console.error('Failed to parse JSON:', data.assistant);
          throw new Error(`Failed to parse ${style.id} post response`);
        }

        return {
          ...parsedResponse,
          style: style.id
        } as GeneratedPost;
      });

      const results = await Promise.allSettled(postPromises);
      const successfulPosts = results
        .filter((result): result is PromiseFulfilledResult<GeneratedPost> => result.status === 'fulfilled')
        .map(result => result.value);

      setGeneratedPosts(successfulPosts);

      if (successfulPosts.length === 0) {
        throw new Error('Failed to generate any posts. Please try again.');
      }

    } catch (error) {
      console.error('Error generating posts:', error);
      alert('Failed to generate posts. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const selectedPost = mounted ? generatedPosts.find(post => post.style === selectedStyle) : null;

  const handleUsePost = () => {
    if (!mounted) return;
    
    const post = customizing ? {
      content: customContent,
      beforeText: selectedPost?.beforeText || '',
      afterText: selectedPost?.afterText || ''
    } : selectedPost;

    if (post) {
      onUsePost(post.content, post.beforeText, post.afterText);
    }
  };

  // don&apos;t render anything until mounted
  if (!mounted) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Wand2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">AI Post Generator</h2>
                <p className="text-sm text-gray-600">Let AI create the perfect post from your conversation</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Conversation Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-purple-800">Conversation Summary</span>
            </div>
            <div className="text-sm text-purple-700">
              <span className="font-medium">{messageCount} messages</span> • 
              <span className="font-medium"> Daily Tidbit #{tidbitNumber}</span> • 
              <span>"{tidbitTitle}"</span>
            </div>
          </div>

          {!generating && generatedPosts.length === 0 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Wand2 className="w-10 h-10 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to create magic?</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Our AI will analyze your entire conversation and create engaging posts in different styles. 
                Pick your favorite or customize it further!
              </p>
              <button
                onClick={generatePosts}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-colors font-semibold"
              >
                <Wand2 className="w-5 h-5" />
                Generate Posts with AI
              </button>
            </div>
          )}

          {generating && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse">
                <Sparkles className="w-8 h-8 text-white animate-spin" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">AI is analyzing your conversation...</h3>
              <p className="text-gray-600">Creating multiple post variations in different styles</p>
              <div className="mt-4 flex justify-center gap-2">
                {styles.map((style, index) => (
                  <div 
                    key={style.id}
                    className={`w-3 h-3 rounded-full transition-colors duration-500 ${
                      generating ? 'bg-purple-500 animate-pulse' : 'bg-gray-300'
                    }`}
                    style={{ animationDelay: `${index * 0.2}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          {generatedPosts.length > 0 && (
            <div className="space-y-6">
              {/* Style Selector */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Choose Your Style</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {styles.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        selectedStyle === style.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="text-2xl mb-2">{style.emoji}</div>
                      <div className="font-semibold text-gray-900">{style.name}</div>
                      <div className="text-xs text-gray-600">{style.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Post Preview */}
              {selectedPost && (
                <div className="bg-white rounded-xl border-2 border-purple-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold">Generated Post Preview</h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCustomizing(!customizing)}
                          className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={generatePosts}
                          className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                          disabled={generating}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    {/* Main Post Content */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Post Content
                      </label>
                      {customizing ? (
                        <textarea
                          value={customContent}
                          onChange={(e) => setCustomContent(e.target.value)}
                          rows={3}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          placeholder="Customize your post content..."
                        />
                      ) : (
                        <div className="p-3 bg-gray-50 rounded-lg border">
                          <p className="text-gray-800 leading-relaxed">{selectedPost.content}</p>
                        </div>
                      )}
                    </div>

                    {/* Before & After */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-red-700 mb-2">
                          Before (Original)
                        </label>
                        <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                          <p className="text-red-800 text-sm">{selectedPost.beforeText}</p>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-green-700 mb-2">
                          After (AI Enhanced)
                        </label>
                        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                          <p className="text-green-800 text-sm">{selectedPost.afterText}</p>
                        </div>
                      </div>
                    </div>

                    {/* AI Reasoning */}
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-4 h-4 text-brand-blueDark" />
                        <span className="text-sm font-medium text-blue-800">AI's Reasoning</span>
                      </div>
                      <p className="text-blue-700 text-sm">{selectedPost.reasoning}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleUsePost}
                  disabled={!selectedPost}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-colors font-semibold disabled:opacity-50"
                >
                  <Check className="w-5 h-5" />
                  Use This Post
                </button>
                <button
                  onClick={onCancel}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
