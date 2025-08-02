// ============================================================================
// 6. TutorInputArea.tsx - Extract input and send functionality
// ============================================================================

import React from 'react';
import { ArrowRight, Loader2, X } from 'lucide-react';

interface TutorInputAreaProps {
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  placeholder: string;
  loadingState: 'idle' | 'sending' | 'posting' | 'copying' | 'loading_tidbit';
  currentProvider: { name: string; color: string; free?: boolean };
  hasPrefillText?: boolean;
  onClearPrefill?: () => void;
}

export function TutorInputArea({
  input,
  onInputChange,
  onSend,
  placeholder,
  loadingState,
  currentProvider,
  hasPrefillText = false,
  onClearPrefill
}: TutorInputAreaProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.shiftKey) {
      onSend();
    }
  };

  return (
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
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={6}
          className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#59B1E3]/30 focus:border-[#59B1E3] transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed resize-none text-base leading-relaxed"
          placeholder={placeholder}
          disabled={loadingState === 'sending' || loadingState === 'loading_tidbit'}
        />
        {/* Clear button for pre-filled text */}
        {hasPrefillText && onClearPrefill && (
          <button
            onClick={onClearPrefill}
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
          onClick={onSend}
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
  );
}