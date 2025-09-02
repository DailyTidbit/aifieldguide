// ============================================================================
// 1. FormattedMessage.tsx - Extract message formatting logic
// ============================================================================

import React from 'react';

interface FormattedTextProps {
  content: string;
  className?: string;
}

export function FormattedMessage({ content, className = "" }: FormattedTextProps) {
  // Split content into paragraphs and format
  const formatContent = (text: string) => {
    // Clean up the text
    const cleanText = text.trim();
    
    // Split by double line breaks for paragraphs
    const paragraphs = cleanText.split(/\n\s*\n/);
    
    return paragraphs.map((paragraph, pIndex) => {
      // Handle different types of content blocks
      
      // Check for numbered lists (1. 2. 3.)
      if (/^\d+\.\s/.test(paragraph.trim())) {
        const listItems = paragraph.split(/(?=\d+\.\s)/).filter(item => item.trim());
        return (
          <ol key={`list-${pIndex}`} className="list-none space-y-3 my-4">
            {listItems.map((item, i) => {
              const cleanItem = item.replace(/^\d+\.\s*/, '').trim();
              const number = item.match(/^(\d+)\./)?.[1] || (i + 1).toString();
              return (
                <li key={`item-${i}`} className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 bg-[brand-green] text-white rounded-full text-sm font-bold flex-shrink-0 mt-0.5">
                    {number}
                  </span>
                  <span className="text-gray-700 leading-relaxed">
                    {formatInlineText(cleanItem)}
                  </span>
                </li>
              );
            })}
          </ol>
        );
      }
      
      // Check for bullet points (- or •)
      if (/^[-•]\s/.test(paragraph.trim())) {
        const listItems = paragraph.split(/(?=^[-•]\s)/m).filter(item => item.trim());
        return (
          <ul key={`bullets-${pIndex}`} className="space-y-2 my-4">
            {listItems.map((item, i) => {
              const cleanItem = item.replace(/^[-•]\s*/, '').trim();
              return (
                <li key={`bullet-${i}`} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-[brand-blue] rounded-full flex-shrink-0 mt-2"></div>
                  <span className="text-gray-700 leading-relaxed">
                    {formatInlineText(cleanItem)}
                  </span>
                </li>
              );
            })}
          </ul>
        );
      }
      
      // Check for headers (lines ending with :)
      if (paragraph.trim().endsWith(':') && paragraph.length < 100) {
        return (
          <h4 key={`header-${pIndex}`} className="text-lg font-semibold text-gray-900 mt-6 mb-3" 
              style={{fontFamily: "'Playfair Display', serif"}}>
            {formatInlineText(paragraph.replace(':', ''))}
          </h4>
        );
      }
      
      // Regular paragraphs
      return (
        <p key={`para-${pIndex}`} className="text-gray-700 leading-relaxed mb-4 last:mb-0">
          {formatInlineText(paragraph)}
        </p>
      );
    });
  };

  // Format inline text (bold, italic, etc.)
  const formatInlineText = (text: string) => {
    // Split by formatting markers
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|"[^"]+"|'[^']+')/).filter(Boolean);
    
    return parts.map((part, i) => {
      // Bold text **text**
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-gray-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      
      // Italic text *text*
      if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
        return <em key={i} className="italic">{part.slice(1, -1)}</em>;
      }
      
      // Code `text`
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono">
            {part.slice(1, -1)}
          </code>
        );
      }
      
      // Quoted text "text" or 'text'
      if ((part.startsWith('"') && part.endsWith('"')) || 
          (part.startsWith("'") && part.endsWith("'"))) {
        return (
          <span key={i} className="bg-blue-50 text-blue-800 px-1 py-0.5 rounded italic">
            {part}
          </span>
        );
      }
      
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      {formatContent(content)}
    </div>
  );
}
