// ============================================================================
// 5. TutorChatArea.tsx - Extract chat message display logic
// ============================================================================

import React from 'react';
import { Copy, Share2, Check, Loader2 } from 'lucide-react';
import { FormattedMessage } from './FormattedMessage';
import { API_PROVIDERS } from './AIProviderSelector';

export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
  provider?: string;
}

interface TutorChatAreaProps {
  messages: Message[];
  loadingState: 'idle' | 'sending' | 'posting' | 'copying' | 'loading_tidbit';
  copiedMessageIndex: number | null;
  lastSharedIndex: number | null;
  user: any;
  onCopyMessage: (content: string, index: number) => void;
  onShareConversation: (userMsgIndex: number) => void;
  currentProvider: { name: string; color: string };
}

export function TutorChatArea({
  messages,
  loadingState,
  copiedMessageIndex,
  lastSharedIndex,
  user,
  onCopyMessage,
  onShareConversation,
  currentProvider
}: TutorChatAreaProps) {
  if (messages.length === 0 && loadingState !== 'sending') {
    return null;
  }

  return (
    <div className="space-y-3 max-h-[400px] overflow-y-auto mb-4 p-3 bg-gray-50 rounded-lg">
      {messages.map((msg, i) => {
        const msgProvider = API_PROVIDERS.find(p => p.id === msg.provider);
        return (
          <div key={i} className="group relative">
            <div
              className={`p-3 rounded-lg max-w-[85%] relative ${
                msg.role === "user"
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

              {/* Message content */}
              {msg.role === "assistant" ? (
                <FormattedMessage content={msg.content} className="text-sm" />
              ) : (
                <p className="text-sm leading-relaxed">{msg.content}</p>
              )}

              {/* Action buttons */}
              <div className="absolute -right-2 top-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                {/* Copy button */}
                <button
                  onClick={() => onCopyMessage(msg.content, i)}
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

                {/* Share conversation button */}
                {msg.role === "assistant" && i > 0 && user && (
                  <button
                    onClick={() => onShareConversation(i - 1)}
                    className={`p-1 rounded shadow-md transition-colors disabled:opacity-50 ${
                      lastSharedIndex === i
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

      {/* Loading indicator */}
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
  );
}
