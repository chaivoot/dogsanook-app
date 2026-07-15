'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

/** Renders a game guide. Handles both real markdown and plain pasted text
 *  (single newlines become line breaks via remark-breaks). */
export default function Markdown({ children }: { children: string }) {
  return (
    <div className="markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
