"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { Users, Share2, Sparkles, Copy, Check, ExternalLink, MessageCircle } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
}

interface TidbitTutorProps {
  tidbitNumber?: number;
  tidbitTitle?: string;
  onConversationUpdate?: (userInput: string, aiOutput: string) => void;
}

export default function TidbitTutor({ tidbitNumber, tidbitTitle, onConversationUpdate }: TidbitTutorProps) {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: "assistant", 
      content: "Hi! Ready to rewrite something? Just type it below!",
      timestamp: new Date()
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [postingToBitBoard, setPostingToBitBoard] = useState(false);
  const [lastSharedIndex, setLastSharedIndex] = useState<number | null>(null);
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);
  const [showQuickPost, setShowQuickPost] = useState(false);
  const [customPostContent, setCustomPostContent] = useState("");

  // Check for user auth - fixed hook usage
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);

  // Auto-generate custom post content when tidbit info changes
  useEffect(() => {
    if (tidbitNumber && tidbitTitle) {
      setCustomPostContent(`Just used AI to transform my writing with Daily Tidbit #${tidbitNumber}! "${tidbitTitle}"`);
    }
  }, [tidbitNumber, tidbitTitle]);

  async function sendMessage() {
    if (!input.trim()) return;
    
    const userMessage: Message = { 
      role: "user", 
      content: input.trim(),
      timestamp: new Date()
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      const data = await response.json();
      if (data?.assistant) {
        const assistantMessage: Message = {
          role: "assistant", 
          content: data.assistant,
          timestamp: new Date()
        };
        setMessages((prev) => [...prev, assistantMessage]);
        
        // Notify parent component about the new conversation
        if (onConversationUpdate) {
          onConversationUpdate(userMessage.content, data.assistant);
        }
        
        // Show share options after getting a good response
        if (messages.length >= 2) { // At least one back-and-forth
          setShowShareOptions(true);
        }
      }
    } catch (err) {
      console.error("Error:", err);
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  }

  // Copy message to clipboard
  const copyMessage = async (content: string, index: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageIndex(index);
      setTimeout(() => setCopiedMessageIndex(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Format conversation for BitBoard post
  const formatConversationForPost = () => {
    // Get the most recent user input and AI response
    const recentMessages = messages.slice(-2);
    const userInput = recentMessages.find(m => m.role === "user")?.content;
    const aiOutput = recentMessages.find(m => m.role === "assistant")?.content;

    if (!userInput || !aiOutput) {
      return null;
    }

    return {
      beforeText: userInput,
      afterText: aiOutput,
      content: customPostContent || `Used AI to improve my writing with Daily Tidbit #${tidbitNumber}! ${tidbitTitle ? `"${tidbitTitle}"` : ''}`
    };
  };

  // Enhanced post to BitBoard with better UX
  const postToBitBoard = async (useCustomContent: boolean = false) => {
    if (!user) {
      alert("Please sign in to post to BitBoard!");
      return;
    }

    const formattedPost = formatConversationForPost();
    if (!formattedPost) {
      alert("Need at least one conversation to share!");
      return;
    }

    setPostingToBitBoard(true);

    try {
      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        content: useCustomContent ? customPostContent : formattedPost.content,
        before_text: formattedPost.beforeText,
        after_text: formattedPost.afterText,
        tidbit: tidbitNumber || 1,
        type: 'tidbit_tutor_conversation',
        description: `AI writing improvement from Tidbit Tutor - Day ${tidbitNumber}`
      });

      if (error) throw error;

      // Enhanced success feedback
      setLastSharedIndex(messages.length - 1);
      setShowQuickPost(false);
      setTimeout(() => setLastSharedIndex(null), 3000);
      
      // Better success experience
      const viewPost = confirm("🎉 Posted successfully! Want to see it on BitBoard?");
      if (viewPost) {
        window.open('/bitboard', '_blank');
      }

    } catch (error) {
      console.error("Error posting to BitBoard:", error);
      alert("Failed to post. Please try again.");
    } finally {
      setPostingToBitBoard(false);
    }
  };

  // Share specific message pair with better UX
  const shareSpecificConversation = async (userMsgIndex: number) => {
    if (!user) {
      alert("Please sign in to post to BitBoard!");
      return;
    }

    const userMsg = messages[userMsgIndex];
    const assistantMsg = messages[userMsgIndex + 1];

    if (!userMsg || !assistantMsg || userMsg.role !== "user" || assistantMsg.role !== "assistant") {
      alert("Invalid conversation pair selected.");
      return;
    }

    setPostingToBitBoard(true);

    try {
      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        content: customPostContent || `Used AI to improve my writing with Daily Tidbit #${tidbitNumber}! ${tidbitTitle ? `"${tidbitTitle}"` : ''}`,
        before_text: userMsg.content,
        after_text: assistantMsg.content,
        tidbit: tidbitNumber || 1,
        type: 'tidbit_tutor_conversation',
        description: `AI writing improvement from Tidbit Tutor - Day ${tidbitNumber}`
      });

      if (error) throw error;

      setLastSharedIndex(userMsgIndex + 1);
      setTimeout(() => setLastSharedIndex(null), 3000);

      const viewPost = confirm("🎉 Posted successfully! Want to see it on BitBoard?");
      if (viewPost) {
        window.open('/bitboard', '_blank');
      }

    } catch (error) {
      console.error("Error posting to BitBoard:", error);
      alert("Failed to post. Please try again.");
    } finally {
      setPostingToBitBoard(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 border border-gray-200 rounded-xl bg-white shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-gradient-to-br from-[#60A875] to-[#59B1E3] rounded-lg flex items-center justify-center">
          <span className="text-white text-lg">🧠</span>
        </div>
        <h2 className="text-xl font-semibold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
          Tidbit Tutor
        </h2>
        {tidbitNumber && (
          <span className="text-sm bg-[#59B1E3] text-white px-2 py-1 rounded-full">
            #{tidbitNumber}
          </span>
        )}
      </div>
      
      {/* Enhanced chat area with better styling */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto mb-4 p-3 bg-gray-50 rounded-lg">
        {messages.map((msg, i) => (
          <div key={i} className="group relative">
            <div
              className={`p-3 rounded-lg max-w-[85%] relative ${
                msg.role === "user" 
                  ? "bg-[#60A875] text-white ml-auto" 
                  : "bg-white text-gray-800 border border-gray-200"
              }`}
            >
              <p className="text-sm leading-relaxed">{msg.content}</p>
              
              {/* Enhanced action buttons */}
              <div className="absolute -right-2 top-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                {/* Copy button with better feedback */}
                <button
                  onClick={() => copyMessage(msg.content, i)}
                  className="p-1 bg-white rounded shadow-md hover:bg-gray-50 transition-colors"
                  title="Copy message"
                >
                  {copiedMessageIndex === i ? (
                    <Check className="w-3 h-3 text-green-600" />
                  ) : (
                    <Copy className="w-3 h-3 text-gray-600" />
                  )}
                </button>
                
                {/* Enhanced share conversation button */}
                {msg.role === "assistant" && i > 0 && user && (
                  <button
                    onClick={() => shareSpecificConversation(i - 1)}
                    className={`p-1 rounded shadow-md transition-colors ${
                      lastSharedIndex === i 
                        ? 'bg-green-500 hover:bg-green-600' 
                        : 'bg-[#59B1E3] hover:bg-blue-600'
                    }`}
                    title="Share this conversation to BitBoard"
                    disabled={postingToBitBoard}
                  >
                    {lastSharedIndex === i ? (
                      <Check className="w-3 h-3 text-white" />
                    ) : postingToBitBoard ? (
                      <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Share2 className="w-3 h-3 text-white" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="bg-white text-gray-800 border border-gray-200 p-3 rounded-lg max-w-[85%]">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#59B1E3] rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-[#59B1E3] rounded-full animate-bounce delay-100"></div>
              <div className="w-2 h-2 bg-[#59B1E3] rounded-full animate-bounce delay-200"></div>
            </div>
          </div>
        )}
      </div>
      
      {/* Enhanced input area */}
      <div className="flex items-center gap-2 mb-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#59B1E3]/20 focus:border-[#59B1E3] transition-colors"
          placeholder="Type your message..."
          disabled={loading}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="bg-[#59B1E3] text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "..." : "Send"}
        </button>
      </div>

      {/* Enhanced Share to BitBoard section */}
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
                  disabled={postingToBitBoard}
                  className="flex items-center gap-2 bg-[#60A875] text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {postingToBitBoard ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
                  className="flex items-center gap-2 border border-[#60A875] text-[#60A875] px-4 py-2 rounded-lg hover:bg-[#60A875] hover:text-white transition-colors font-medium"
                >
                  <MessageCircle className="w-4 h-4" />
                  Customize
                </button>
              </div>

              {/* Custom post content editor */}
              {showQuickPost && (
                <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customize your post message:
                  </label>
                  <textarea
                    value={customPostContent}
                    onChange={(e) => setCustomPostContent(e.target.value)}
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#60A875] focus:border-[#60A875] resize-none text-sm"
                    placeholder="Share what you learned..."
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => postToBitBoard(true)}
                      disabled={postingToBitBoard || !customPostContent.trim()}
                      className="flex-1 bg-[#60A875] text-white px-3 py-2 rounded-lg hover:bg-green-600 transition-colors font-medium disabled:opacity-50 text-sm"
                    >
                      Post Custom Message
                    </button>
                    <button
                      onClick={() => setShowQuickPost(false)}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Preview of what will be shared */}
              {formatConversationForPost() && (
                <div className="mt-3 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                  <p className="font-medium mb-1">Preview:</p>
                  <div className="space-y-1">
                    <p><span className="text-red-700">Before:</span> {formatConversationForPost()?.beforeText.slice(0, 50)}...</p>
                    <p><span className="text-green-700">After:</span> {formatConversationForPost()?.afterText.slice(0, 50)}...</p>
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

      {/* Enhanced success message */}
      {lastSharedIndex !== null && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-800">
            <Check className="w-5 h-5" />
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
    </div>
  );
}