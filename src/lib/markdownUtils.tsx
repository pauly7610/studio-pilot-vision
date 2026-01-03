/**
 * Markdown Utilities
 * 
 * Smart markdown rendering that detects whether content has markdown
 * formatting and renders it beautifully, or displays plain text cleanly.
 */

import React from "react";

/**
 * Detect if text contains markdown formatting
 * Returns true if any markdown patterns are found
 */
export const hasMarkdownFormatting = (text: string): boolean => {
  if (!text) return false;
  
  const markdownPatterns = [
    /\*\*[^*]+\*\*/,          // **bold**
    /(?<!\*)\*(?!\*)[^*]+\*(?!\*)/, // *italic*
    /^#{1,6}\s/m,              // # Headers
    /^\s*[-*+]\s/m,            // - Bullet lists
    /^\s*\d+\.\s/m,            // 1. Numbered lists
    /\[.+\]\(.+\)/,            // [links](url)
    /`[^`]+`/,                 // `code`
    /^>\s/m,                   // > Blockquotes
    /^\s*```/m,                // ``` Code blocks
    /\n\n/,                    // Double newlines (paragraphs)
  ];
  
  return markdownPatterns.some(pattern => pattern.test(text));
};

/**
 * Format inline markdown: **bold**, *italic*, and `code`
 */
export const formatInlineMarkdown = (text: string): JSX.Element => {
  const parts: JSX.Element[] = [];
  let remaining = text;
  let key = 0;
  
  while (remaining.length > 0) {
    // Match patterns in order of priority
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    const italicMatch = remaining.match(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/);
    const codeMatch = remaining.match(/`([^`]+)`/);
    
    // Find the first match
    const matches = [
      boldMatch && { match: boldMatch, type: 'bold' as const, index: boldMatch.index! },
      italicMatch && { match: italicMatch, type: 'italic' as const, index: italicMatch.index! },
      codeMatch && { match: codeMatch, type: 'code' as const, index: codeMatch.index! },
    ].filter(Boolean) as { match: RegExpMatchArray; type: 'bold' | 'italic' | 'code'; index: number }[];
    
    const firstMatch = matches.sort((a, b) => a.index - b.index)[0];
    
    if (firstMatch) {
      // Add text before the match
      if (firstMatch.index > 0) {
        parts.push(<span key={key++}>{remaining.slice(0, firstMatch.index)}</span>);
      }
      
      // Add the formatted text
      if (firstMatch.type === 'bold') {
        parts.push(
          <strong key={key++} className="font-semibold text-foreground">
            {firstMatch.match[1]}
          </strong>
        );
      } else if (firstMatch.type === 'italic') {
        parts.push(<em key={key++}>{firstMatch.match[1]}</em>);
      } else if (firstMatch.type === 'code') {
        parts.push(
          <code key={key++} className="px-1.5 py-0.5 bg-muted rounded text-sm font-mono">
            {firstMatch.match[1]}
          </code>
        );
      }
      
      remaining = remaining.slice(firstMatch.index + firstMatch.match[0].length);
    } else {
      // No more matches, add remaining text
      parts.push(<span key={key++}>{remaining}</span>);
      break;
    }
  }
  
  return <>{parts}</>;
};

/**
 * Parse markdown text into React elements
 * Handles: headers, **bold**, *italic*, `code`, numbered/bullet lists, and paragraphs
 */
export const parseMarkdown = (text: string): JSX.Element => {
  if (!text) return <span></span>;
  
  // Split by double newlines for paragraphs
  const paragraphs = text.split(/\n\n+/);
  
  return (
    <div className="space-y-3">
      {paragraphs.map((para, pIdx) => {
        const trimmedPara = para.trim();
        
        // Check for headers
        const headerMatch = trimmedPara.match(/^(#{1,6})\s+(.+)$/);
        if (headerMatch) {
          const level = headerMatch[1].length;
          const content = headerMatch[2];
          const className = level === 1 ? "text-lg font-bold" : 
                           level === 2 ? "text-base font-semibold" :
                           "text-sm font-medium";
          return (
            <div key={pIdx} className={className}>
              {formatInlineMarkdown(content)}
            </div>
          );
        }
        
        // Check for bullet list
        if (/^\s*[-*+]\s/.test(trimmedPara)) {
          const items = trimmedPara.split(/\n(?=\s*[-*+]\s)/);
          return (
            <ul key={pIdx} className="list-disc list-inside space-y-1.5 text-sm">
              {items.map((item, iIdx) => {
                const content = item.replace(/^\s*[-*+]\s*/, '');
                return (
                  <li key={iIdx}>
                    {formatInlineMarkdown(content)}
                  </li>
                );
              })}
            </ul>
          );
        }
        
        // Check for numbered list
        if (/^\s*\d+\.\s/.test(trimmedPara)) {
          const items = trimmedPara.split(/\n(?=\s*\d+\.)/);
          return (
            <ol key={pIdx} className="list-decimal list-inside space-y-1.5 text-sm">
              {items.map((item, iIdx) => {
                const content = item.replace(/^\s*\d+\.\s*/, '');
                return (
                  <li key={iIdx}>
                    {formatInlineMarkdown(content)}
                  </li>
                );
              })}
            </ol>
          );
        }
        
        // Check for blockquote
        if (/^>\s/.test(trimmedPara)) {
          const content = trimmedPara.replace(/^>\s*/gm, '');
          return (
            <blockquote key={pIdx} className="border-l-4 border-primary/30 pl-4 italic text-sm text-muted-foreground">
              {formatInlineMarkdown(content)}
            </blockquote>
          );
        }
        
        // Regular paragraph - handle single newlines as line breaks
        const lines = trimmedPara.split(/\n/);
        return (
          <p key={pIdx} className="text-sm leading-relaxed">
            {lines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                {lIdx > 0 && <br />}
                {formatInlineMarkdown(line)}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
};

/**
 * Smart Text Component
 * 
 * Automatically detects if content has markdown formatting and renders accordingly.
 * Plain text is displayed cleanly, markdown is rendered beautifully.
 */
interface SmartTextProps {
  content: string;
  className?: string;
  forceMarkdown?: boolean;
  forcePlain?: boolean;
}

export const SmartText: React.FC<SmartTextProps> = ({ 
  content, 
  className = "", 
  forceMarkdown = false,
  forcePlain = false 
}) => {
  if (!content) {
    return <span className={className}></span>;
  }
  
  // Determine rendering mode
  const shouldRenderMarkdown = forcePlain ? false : (forceMarkdown || hasMarkdownFormatting(content));
  
  if (shouldRenderMarkdown) {
    return (
      <div className={className}>
        {parseMarkdown(content)}
      </div>
    );
  }
  
  // Plain text - still handle line breaks gracefully
  const lines = content.split(/\n/);
  
  if (lines.length === 1) {
    return <span className={className}>{content}</span>;
  }
  
  return (
    <p className={`${className} leading-relaxed`}>
      {lines.map((line, idx) => (
        <React.Fragment key={idx}>
          {idx > 0 && <br />}
          {line}
        </React.Fragment>
      ))}
    </p>
  );
};

export default SmartText;

