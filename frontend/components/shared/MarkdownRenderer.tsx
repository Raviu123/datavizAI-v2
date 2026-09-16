'use client';

import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null;

  const flushList = () => {
    if (!currentList) return;
    const ListTag = currentList.type;
    const key = `list-${elements.length}`;
    elements.push(
      <ListTag
        key={key}
        className={
          currentList.type === 'ul'
            ? 'list-disc list-inside space-y-1 my-2 text-slate-200'
            : 'list-decimal list-inside space-y-1 my-2 text-slate-200'
        }
      >
        {currentList.items.map((item, idx) => (
          <li key={idx} className="leading-relaxed">
            {renderInlineMarkdown(item)}
          </li>
        ))}
      </ListTag>
    );
    currentList = null;
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Headers
    if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(
        <h3 key={index} className="text-xs font-bold text-indigo-300 mt-2.5 mb-1 uppercase tracking-wider">
          {renderInlineMarkdown(trimmed.replace(/^###\s+/, ''))}
        </h3>
      );
      return;
    }
    if (trimmed.startsWith('## ')) {
      flushList();
      elements.push(
        <h2 key={index} className="text-xs font-bold text-indigo-200 mt-3 mb-1 border-b border-slate-800 pb-1">
          {renderInlineMarkdown(trimmed.replace(/^##\s+/, ''))}
        </h2>
      );
      return;
    }
    if (trimmed.startsWith('# ')) {
      flushList();
      elements.push(
        <h1 key={index} className="text-sm font-extrabold text-slate-100 mt-3 mb-1.5">
          {renderInlineMarkdown(trimmed.replace(/^#\s+/, ''))}
        </h1>
      );
      return;
    }

    // Bullet list items
    if (/^(?:[-*•]|\d+\.)\s+/.test(trimmed)) {
      const isNumbered = /^\d+\.\s+/.test(trimmed);
      const listType = isNumbered ? 'ol' : 'ul';
      const itemText = trimmed.replace(/^(?:[-*•]|\d+\.)\s+/, '');

      if (!currentList || currentList.type !== listType) {
        flushList();
        currentList = { type: listType, items: [itemText] };
      } else {
        currentList.items.push(itemText);
      }
      return;
    }

    // Empty lines
    if (!trimmed) {
      flushList();
      elements.push(<div key={index} className="h-1.5" />);
      return;
    }

    // Regular paragraphs
    flushList();
    elements.push(
      <p key={index} className="leading-relaxed my-0.5 text-slate-200">
        {renderInlineMarkdown(line)}
      </p>
    );
  });

  flushList();

  return <div className={`text-xs space-y-0.5 ${className}`}>{elements}</div>;
};

function renderInlineMarkdown(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|_[^_]+_|\*[^*]+\*)/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(text.substring(lastIdx, match.index));
    }
    const token = match[0];
    if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code
          key={match.index}
          className="bg-slate-950 px-1.5 py-0.5 rounded text-[10px] font-mono text-indigo-300 border border-slate-800"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={match.index} className="font-semibold text-slate-100">
          {token.slice(2, -2)}
        </strong>
      );
    } else if ((token.startsWith('*') && token.endsWith('*')) || (token.startsWith('_') && token.endsWith('_'))) {
      parts.push(
        <em key={match.index} className="italic text-slate-300">
          {token.slice(1, -1)}
        </em>
      );
    }
    lastIdx = regex.lastIndex;
  }

  if (lastIdx < text.length) {
    parts.push(text.substring(lastIdx));
  }

  return parts.length > 0 ? parts : text;
}
