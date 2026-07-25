'use client';

import { useRef, useState } from 'react';
import Markdown from '@/components/Markdown';

/**
 * A friendly Markdown editor: toolbar buttons insert correct syntax (so no
 * more "#Header" mistakes) and a live preview shows the rendered result. The
 * textarea carries `name`, so it submits with the surrounding form as usual.
 */
export default function MarkdownEditor({
  name,
  defaultValue = '',
  rows = 8,
  placeholder,
}: {
  name: string;
  defaultValue?: string;
  rows?: number;
  placeholder?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const ref = useRef<HTMLTextAreaElement>(null);

  function restore(pos: number) {
    requestAnimationFrame(() => {
      const ta = ref.current;
      if (!ta) return;
      ta.focus();
      ta.selectionStart = ta.selectionEnd = pos;
    });
  }

  /** Add a prefix to the start of the current line (headers, list items). */
  function prefixLine(prefix: string) {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const next = value.slice(0, lineStart) + prefix + value.slice(lineStart);
    setValue(next);
    restore(start + prefix.length);
  }

  /** Wrap the current selection (e.g. bold). */
  function wrap(token: string) {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const sel = value.slice(start, end) || 'ข้อความ';
    const next = value.slice(0, start) + token + sel + token + value.slice(end);
    setValue(next);
    restore(start + token.length + sel.length + token.length);
  }

  const btn =
    'rounded-lg border border-white/10 bg-brand-bg px-2.5 py-1 text-xs font-medium text-brand-cream transition hover:bg-white/10';

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-1.5">
        <button type="button" className={btn} onClick={() => prefixLine('# ')}>
          หัวข้อใหญ่
        </button>
        <button type="button" className={btn} onClick={() => prefixLine('## ')}>
          หัวข้อรอง
        </button>
        <button type="button" className={btn} onClick={() => wrap('**')}>
          ตัวหนา
        </button>
        <button type="button" className={btn} onClick={() => prefixLine('- ')}>
          รายการ
        </button>
      </div>

      <textarea
        ref={ref}
        name={name}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="input font-mono text-sm"
      />

      {value.trim() && (
        <div className="mt-3">
          <p className="mb-1 text-xs text-brand-muted">ตัวอย่างที่ลูกค้าจะเห็น:</p>
          <div className="rounded-card border border-white/5 bg-brand-bgSoft px-4 py-3">
            <Markdown>{value}</Markdown>
          </div>
        </div>
      )}
    </div>
  );
}
