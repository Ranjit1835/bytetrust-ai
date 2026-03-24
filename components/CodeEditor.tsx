'use client';

import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, Code2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface CodeEditorProps {
  code: string;
  language?: string;
}

export default function CodeEditor({ code, language = 'python' }: CodeEditorProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-xl border border-bytetrust-border bg-bytetrust-card overflow-hidden"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-bytetrust-surface border-b border-bytetrust-border">
        <div className="flex items-center gap-2">
          <Code2 size={14} className="text-bytetrust-cyan" />
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            {language}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-all"
        >
          {copied ? (
            <>
              <Check size={13} className="text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={13} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code block */}
      <div className="overflow-x-auto">
        <SyntaxHighlighter
          language={language}
          style={atomDark}
          showLineNumbers
          customStyle={{
            margin: 0,
            padding: '16px',
            background: 'transparent',
            fontSize: '13px',
            lineHeight: '1.6',
          }}
          lineNumberStyle={{
            color: '#334155',
            fontSize: '12px',
            minWidth: '2.5em',
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </motion.div>
  );
}
