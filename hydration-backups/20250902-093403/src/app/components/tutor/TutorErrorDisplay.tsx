// ============================================================================
// 3. TutorErrorDisplay.tsx - Extract error handling UI
// ============================================================================

import React from 'react';
import { AlertCircle, X } from 'lucide-react';

export type ErrorType = 'chat' | 'post' | 'auth' | 'network' | 'provider' | 'tidbit_load' | null;

export interface ErrorState {
  type: ErrorType;
  message: string;
  retryAction?: () => void;
}

interface TutorErrorDisplayProps {
  error: ErrorState | null;
  onClearError: () => void;
}

export function TutorErrorDisplay({ error, onClearError }: TutorErrorDisplayProps) {
  if (!error) return null;

  const getErrorTitle = (type: ErrorType) => {
    const titles = {
      auth: 'Authentication Error',
      network: 'Connection Error',
      chat: 'Chat Error',
      post: 'Posting Error',
      provider: 'Provider Error',
      tidbit_load: 'Loading Error'
    };
    return titles[type as keyof typeof titles] || 'Error';
  };

  return (
    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-red-800">
              {getErrorTitle(error.type)}
            </p>
            <button
              onClick={onClearError}
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
  );
}