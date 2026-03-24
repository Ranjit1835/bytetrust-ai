'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ChevronDown, Loader2, Lock } from 'lucide-react';
import type { AnalysisOptions } from '@/lib/types';

interface PromptInputProps {
  onSubmit: (prompt: string, options: AnalysisOptions) => void;
  loading: boolean;
}

export default function PromptInput({ onSubmit, loading }: PromptInputProps) {
  const [prompt, setPrompt] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [options, setOptions] = useState<AnalysisOptions>({
    autoGenerateTests: true,
    includeExplanation: true,
    maxTestCases: 5,
  });

  const canSubmit = prompt.trim().length >= 10 && !loading;

  const handleSubmit = () => {
    if (canSubmit) {
      onSubmit(prompt.trim(), options);
    }
  };

  return (
    <div className="space-y-4">
      {/* Textarea */}
      <div className="relative">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe what you want the code to do... e.g. 'Write a Python function that finds all prime numbers up to N using the Sieve of Eratosthenes'"
          rows={6}
          className="w-full rounded-xl bg-bytetrust-surface border border-bytetrust-border p-4 text-sm text-slate-200 placeholder-slate-600 resize-none focus:outline-none focus:border-bytetrust-cyan/50 focus:ring-1 focus:ring-bytetrust-cyan/20 transition-all font-body"
          disabled={loading}
        />
        <div className="absolute bottom-3 right-3 text-xs text-slate-600">
          {prompt.length} chars
        </div>
      </div>

      {/* Language badge */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-bytetrust-surface border border-bytetrust-border text-xs text-slate-400">
          <Lock size={10} />
          Python
        </div>
      </div>

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={`w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
          canSubmit
            ? 'bg-gradient-to-r from-bytetrust-cyan to-cyan-600 text-bytetrust-dark hover:shadow-lg hover:shadow-bytetrust-cyan/20 active:scale-[0.98]'
            : 'bg-bytetrust-border text-slate-600 cursor-not-allowed'
        }`}
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Running Pipeline...
          </>
        ) : (
          <>
            <Send size={16} />
            Analyse & Verify
          </>
        )}
      </button>

      {/* Advanced options */}
      <div className="border border-bytetrust-border rounded-xl overflow-hidden">
        <button
          onClick={() => setShowOptions(!showOptions)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-slate-500 hover:text-slate-400 transition-colors"
        >
          <span>Advanced Options</span>
          <ChevronDown
            size={14}
            className={`transition-transform ${showOptions ? 'rotate-180' : ''}`}
          />
        </button>

        <AnimatePresence>
          {showOptions && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-3 border-t border-bytetrust-border/50">
                {/* Toggle: Auto-generate test cases */}
                <label className="flex items-center justify-between cursor-pointer pt-3">
                  <span className="text-xs text-slate-400">Auto-generate test cases</span>
                  <div
                    onClick={() =>
                      setOptions({ ...options, autoGenerateTests: !options.autoGenerateTests })
                    }
                    className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                      options.autoGenerateTests ? 'bg-bytetrust-cyan' : 'bg-bytetrust-border'
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-transform ${
                        options.autoGenerateTests ? 'translate-x-[18px]' : 'translate-x-[3px]'
                      }`}
                    />
                  </div>
                </label>

                {/* Toggle: Include explanation */}
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs text-slate-400">Include explanation</span>
                  <div
                    onClick={() =>
                      setOptions({ ...options, includeExplanation: !options.includeExplanation })
                    }
                    className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                      options.includeExplanation ? 'bg-bytetrust-cyan' : 'bg-bytetrust-border'
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-transform ${
                        options.includeExplanation ? 'translate-x-[18px]' : 'translate-x-[3px]'
                      }`}
                    />
                  </div>
                </label>

                {/* Number: Max test cases */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Max test cases</span>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={options.maxTestCases}
                    onChange={(e) =>
                      setOptions({ ...options, maxTestCases: parseInt(e.target.value) || 5 })
                    }
                    className="w-16 text-center bg-bytetrust-surface border border-bytetrust-border rounded-md px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-bytetrust-cyan/50"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
