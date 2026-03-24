'use client';

import { motion } from 'framer-motion';
import { Download, FileCode2, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import type { GeneratedFile } from '@/lib/app-generator';

interface BytecodeViewerProps {
  bytecodeFiles: string[];
  sourceFiles: GeneratedFile[];
}

export default function BytecodeViewer({ bytecodeFiles, sourceFiles }: BytecodeViewerProps) {
  const [showSource, setShowSource] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-bytetrust-border bg-bytetrust-card overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-bytetrust-border">
        <div className="flex items-center gap-2">
          <FileCode2 size={16} className="text-purple-400" />
          <span className="text-sm font-heading font-semibold text-white">
            {showSource ? 'Source Code' : 'Bytecode Output'}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
            {bytecodeFiles.length} .pyc files
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSource(!showSource)}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-bytetrust-border text-slate-400 hover:text-white hover:border-bytetrust-cyan/40 transition-colors"
          >
            {showSource ? <EyeOff size={12} /> : <Eye size={12} />}
            {showSource ? 'Hide Source' : 'View Source'}
          </button>
        </div>
      </div>

      {/* Bytecode files list */}
      {!showSource && (
        <div className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {bytecodeFiles.map((file, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bytetrust-surface border border-bytetrust-border"
              >
                <span className="text-lg">📦</span>
                <span className="text-xs text-slate-300 font-mono truncate">{file}</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-600 mt-3">
            Compiled Python bytecode (.pyc) — ready to execute without source code
          </p>
        </div>
      )}

      {/* Source code view (toggle) */}
      {showSource && (
        <div className="p-4 space-y-3">
          {/* File tabs */}
          <div className="flex gap-1 flex-wrap">
            {sourceFiles.map((file) => (
              <button
                key={file.path}
                onClick={() => setSelectedFile(selectedFile === file.path ? null : file.path)}
                className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                  selectedFile === file.path
                    ? 'bg-bytetrust-cyan/20 text-bytetrust-cyan border border-bytetrust-cyan/30'
                    : 'bg-bytetrust-surface border border-bytetrust-border text-slate-400 hover:text-white'
                }`}
              >
                {file.path}
              </button>
            ))}
          </div>

          {/* File content */}
          {selectedFile && (
            <pre className="text-[11px] text-slate-300 bg-bytetrust-surface rounded-lg p-4 max-h-[300px] overflow-auto font-mono border border-bytetrust-border whitespace-pre-wrap">
              {sourceFiles.find(f => f.path === selectedFile)?.content || ''}
            </pre>
          )}
        </div>
      )}
    </motion.div>
  );
}
