// ============================================================================
// 4. TutorSuccessDisplay.tsx - Extract success message UI
// ============================================================================

import React from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface TutorSuccessDisplayProps {
  message: string | null;
  onClear: () => void;
}

export function TutorSuccessDisplay({ message, onClear }: TutorSuccessDisplayProps) {
  if (!message) return null;

  return (
    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
      <div className="flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-brand-greenDark" />
        <p className="text-sm font-medium text-green-800">{message}</p>
        <button
          onClick={onClear}
          className="ml-auto text-green-400 hover:text-brand-greenDark transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
