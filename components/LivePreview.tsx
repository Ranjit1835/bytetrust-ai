'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, RefreshCw, Square, Globe } from 'lucide-react';

interface LivePreviewProps {
  url: string | null;
  onStop: () => void;
  loading?: boolean;
}

export default function LivePreview({ url, onStop, loading }: LivePreviewProps) {
  const [iframeKey, setIframeKey] = useState(0);

  if (!url && !loading) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-bytetrust-border bg-bytetrust-card overflow-hidden"
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-bytetrust-border bg-bytetrust-surface/50">
        <div className="flex items-center gap-2">
          <Globe size={14} className="text-emerald-400" />
          <span className="text-xs font-heading font-semibold text-white">Live Preview</span>
          {url && (
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              {url}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIframeKey(k => k + 1)}
            className="p-1.5 rounded-md hover:bg-bytetrust-border/50 text-slate-400 hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw size={13} />
          </button>
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-md hover:bg-bytetrust-border/50 text-slate-400 hover:text-white transition-colors"
              title="Open in new tab"
            >
              <ExternalLink size={13} />
            </a>
          )}
          <button
            onClick={onStop}
            className="p-1.5 rounded-md hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
            title="Stop server"
          >
            <Square size={13} />
          </button>
        </div>
      </div>

      {/* Preview area */}
      <div className="relative bg-white" style={{ height: '400px' }}>
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-bytetrust-dark">
            <div className="w-8 h-8 border-2 border-bytetrust-cyan border-t-transparent rounded-full animate-spin mb-3" />
            <span className="text-sm text-slate-400">Starting server...</span>
          </div>
        ) : url ? (
          <iframe
            key={iframeKey}
            src={url}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            title="Live App Preview"
          />
        ) : null}
      </div>
    </motion.div>
  );
}
