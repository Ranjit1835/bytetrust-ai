'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, FileCode, AlertCircle, RefreshCw } from 'lucide-react';
import type { BlockData } from './PipelineFlow';

interface BlockDetailProps {
  block: BlockData | null;
  extraData?: Record<string, unknown>;
  onClose: () => void;
  onFix?: (instruction: string) => void;
}

export default function BlockDetail({ block, extraData, onClose, onFix }: BlockDetailProps) {
  const [fixInstruction, setFixInstruction] = useState('');

  if (!block) return null;

  const handleFix = () => {
    if (fixInstruction.trim() && onFix) {
      onFix(fixInstruction);
      setFixInstruction('');
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="rounded-xl border border-bytetrust-border bg-bytetrust-card overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-bytetrust-border">
          <div className="flex items-center gap-2">
            <FileCode size={16} className="text-bytetrust-cyan" />
            <span className="text-sm font-heading font-semibold text-white">{block.label}</span>
            {block.iteration > 1 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-medium">
                {block.iteration} iterations
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Status & Message */}
        <div className="px-4 py-3 space-y-3">
          <div className={`flex items-center gap-2 text-sm ${
            block.status === 'passed' ? 'text-emerald-400' :
            block.status === 'failed' ? 'text-red-400' :
            block.status === 'retrying' ? 'text-amber-400' :
            'text-blue-400'
          }`}>
            {block.status === 'failed' && <AlertCircle size={14} />}
            {block.status === 'retrying' && <RefreshCw size={14} className="animate-spin" />}
            <span className="font-medium">{block.message}</span>
          </div>

          {/* Extra data: files list, test output, etc. */}
          {extraData && (
            <div className="space-y-2">
              {/* Files list */}
              {Array.isArray(extraData.files) && (
                <div>
                  <span className="text-xs text-slate-500 font-medium">Files:</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {(extraData.files as Array<{ path: string; size?: number }>).map((f, i) => (
                      <span key={i} className="text-[11px] px-2 py-0.5 rounded-md bg-bytetrust-surface border border-bytetrust-border text-slate-300">
                        {f.path}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Test output */}
              {typeof extraData.output === 'string' && (
                <div>
                  <span className="text-xs text-slate-500 font-medium">Output:</span>
                  <pre className="mt-1 text-[11px] text-slate-400 bg-bytetrust-surface rounded-lg p-3 max-h-[200px] overflow-auto whitespace-pre-wrap font-mono border border-bytetrust-border">
                    {extraData.output as string}
                  </pre>
                </div>
              )}

              {/* Stack info */}
              {extraData.stack && (
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(extraData.stack as Record<string, unknown>).map(([key, val]) => (
                    <span key={key} className="text-[11px] px-2 py-0.5 rounded-md bg-bytetrust-cyan/10 text-bytetrust-cyan border border-bytetrust-cyan/20">
                      {key}: {String(val)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Fix prompt (only on failed blocks) */}
          {block.status === 'failed' && onFix && (
            <div className="flex gap-2 mt-3">
              <input
                type="text"
                value={fixInstruction}
                onChange={(e) => setFixInstruction(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFix()}
                placeholder="Describe how to fix this..."
                className="flex-1 text-sm bg-bytetrust-surface border border-bytetrust-border rounded-lg px-3 py-2 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-bytetrust-cyan/50"
              />
              <button
                onClick={handleFix}
                className="px-3 py-2 rounded-lg bg-bytetrust-cyan/20 text-bytetrust-cyan hover:bg-bytetrust-cyan/30 transition-colors"
              >
                <Send size={14} />
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
