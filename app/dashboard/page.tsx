'use client';

import { useState, useCallback } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Send, Loader2, Rocket, AlertCircle } from 'lucide-react';
import PipelineFlow, { type BlockData } from '@/components/PipelineFlow';
import BlockDetail from '@/components/BlockDetail';
import LivePreview from '@/components/LivePreview';
import BytecodeViewer from '@/components/BytecodeViewer';
import type { BlockId, BlockStatus, PipelineEvent } from '@/lib/orchestrator';
import type { GeneratedFile } from '@/lib/app-generator';

const INITIAL_BLOCKS: BlockData[] = [
  { id: 'stack', label: 'Stack', emoji: '🔧', status: 'idle', message: 'Select tech stack', iteration: 0 },
  { id: 'generate', label: 'Generate', emoji: '🤖', status: 'idle', message: 'Generate code', iteration: 0 },
  { id: 'test', label: 'Test', emoji: '🧪', status: 'idle', message: 'Run tests', iteration: 0 },
  { id: 'compile', label: 'Compile', emoji: '📦', status: 'idle', message: 'Compile bytecode', iteration: 0 },
  { id: 'run', label: 'Launch', emoji: '🚀', status: 'idle', message: 'Start app', iteration: 0 },
];

export default function DashboardPage() {
  const [prompt, setPrompt] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [blocks, setBlocks] = useState<BlockData[]>(INITIAL_BLOCKS);
  const [activeBlock, setActiveBlock] = useState<BlockId | null>(null);
  const [blockData, setBlockData] = useState<Record<string, Record<string, unknown>>>({});
  const [error, setError] = useState<string | null>(null);

  // Result state
  const [appUrl, setAppUrl] = useState<string | null>(null);
  const [appId, setAppId] = useState<string | null>(null);
  const [appLoading, setAppLoading] = useState(false);
  const [bytecodeFiles, setBytecodeFiles] = useState<string[]>([]);
  const [sourceFiles, setSourceFiles] = useState<GeneratedFile[]>([]);
  const [pipelineResult, setPipelineResult] = useState<Record<string, unknown> | null>(null);

  const updateBlock = useCallback((blockId: BlockId, status: BlockStatus, message: string, iteration?: number) => {
    setBlocks(prev => prev.map(b =>
      b.id === blockId
        ? { ...b, status, message, iteration: iteration ?? b.iteration }
        : b
    ));
  }, []);

  const resetPipeline = async () => {
    // Stop any previously running app
    if (appId) {
      try { await axios.delete('/api/run', { data: { appId } }); } catch { /* ignore */ }
    }
    setBlocks(INITIAL_BLOCKS);
    setActiveBlock(null);
    setBlockData({});
    setError(null);
    setAppUrl(null);
    setAppId(null);
    setAppLoading(false);
    setBytecodeFiles([]);
    setSourceFiles([]);
    setPipelineResult(null);
  };

  async function runPipeline() {
    if (!prompt.trim() || isRunning) return;

    await resetPipeline();
    setIsRunning(true);
    setError(null);

    try {
      const response = await fetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error(`Pipeline request failed: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event: PipelineEvent = JSON.parse(line.slice(6));
            handlePipelineEvent(event);
          } catch {
            // Skip malformed events
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Pipeline failed');
    } finally {
      setIsRunning(false);
    }
  }

  function handlePipelineEvent(event: PipelineEvent) {
    if (event.type === 'block_update' && event.block) {
      updateBlock(event.block, event.status || 'running', event.message || '', undefined);

      if (event.data) {
        setBlockData(prev => ({
          ...prev,
          [event.block!]: { ...prev[event.block!], ...event.data },
        }));
      }

      // Track iteration count for retrying blocks
      if (event.status === 'retrying') {
        setBlocks(prev => prev.map(b =>
          b.id === event.block ? { ...b, iteration: b.iteration + 1 } : b
        ));
      }
    }

    if (event.type === 'complete' && event.data) {
      setPipelineResult(event.data);
      setBytecodeFiles((event.data.bytecodeFiles as string[]) || []);

      // Extract source files from complete event
      if (Array.isArray(event.data.files)) {
        const files = event.data.files as Array<{ path: string; content?: string; size?: number }>;
        const withContent = files.filter(f => f.content);
        if (withContent.length > 0) {
          setSourceFiles(withContent as GeneratedFile[]);
        }
      }

      // Auto-launch the app
      if (event.data.projectDir && event.data.stack) {
        launchApp(event.data as Record<string, unknown>);
      }
    }

    if (event.type === 'error') {
      setError(event.message || 'Unknown error');
    }
  }

  async function launchApp(data: Record<string, unknown>) {
    setAppLoading(true);
    try {
      const stack = data.stack as { port: number };
      const res = await axios.post('/api/run', {
        projectDir: data.projectDir,
        entryPoint: 'app.py',
        port: stack.port,
      });
      setAppUrl(res.data.url);
      setAppId(res.data.appId);
      updateBlock('run', 'passed', `Running at ${res.data.url}`);
    } catch (err) {
      updateBlock('run', 'failed', 'Failed to start app');
      setError('Failed to start the generated application');
    } finally {
      setAppLoading(false);
    }
  }

  async function stopApp() {
    if (!appId) return;
    try {
      await axios.delete('/api/run', { data: { appId } });
      setAppUrl(null);
      setAppId(null);
      updateBlock('run', 'idle', 'Stopped');
    } catch {
      // ignore
    }
  }

  const isPipelineActive = isRunning || blocks.some(b => b.status !== 'idle');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-white mb-2">
          Build Your App
        </h1>
        <p className="text-sm text-slate-500 max-w-xl mx-auto">
          Describe your application → ByteTrust generates, tests, compiles to bytecode, and runs it.
        </p>
      </div>

      {/* Prompt Input */}
      <div className="max-w-3xl mx-auto mb-10">
        <div className="relative gradient-border rounded-2xl">
          <div className="flex items-center gap-3 bg-bytetrust-card rounded-2xl px-5 py-4">
            <Rocket size={20} className="text-bytetrust-cyan flex-shrink-0" />
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runPipeline()}
              placeholder="e.g. Build me a bookmark manager API with CRUD operations..."
              disabled={isRunning}
              className="flex-1 bg-transparent text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none disabled:opacity-50"
            />
            <button
              onClick={runPipeline}
              disabled={isRunning || !prompt.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-bytetrust-cyan to-cyan-600 text-bytetrust-dark font-semibold text-sm hover:shadow-lg hover:shadow-bytetrust-cyan/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {isRunning ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Building...
                </>
              ) : (
                <>
                  <Send size={14} />
                  Build App
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto mb-6 flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400"
        >
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold">Pipeline Error</p>
            <p className="text-xs mt-1 text-red-400/80">{error}</p>
          </div>
        </motion.div>
      )}

      {/* Pipeline Flow */}
      {isPipelineActive && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 rounded-2xl border border-bytetrust-border bg-bytetrust-card p-6"
        >
          <PipelineFlow
            blocks={blocks}
            activeBlock={activeBlock}
            onBlockClick={(id) => setActiveBlock(activeBlock === id ? null : id)}
          />
        </motion.div>
      )}

      {/* Block Detail */}
      {activeBlock && (
        <div className="mb-6">
          <BlockDetail
            block={blocks.find(b => b.id === activeBlock) || null}
            extraData={blockData[activeBlock]}
            onClose={() => setActiveBlock(null)}
          />
        </div>
      )}

      {/* Content grid: Live Preview + Bytecode */}
      {(appUrl || appLoading || bytecodeFiles.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Live Preview */}
          <LivePreview
            url={appUrl}
            onStop={stopApp}
            loading={appLoading}
          />

          {/* Bytecode Viewer */}
          {bytecodeFiles.length > 0 && (
            <BytecodeViewer
              bytecodeFiles={bytecodeFiles}
              sourceFiles={sourceFiles}
            />
          )}
        </div>
      )}

      {/* Idle state */}
      {!isPipelineActive && !appUrl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="w-20 h-20 rounded-2xl bg-bytetrust-card border border-bytetrust-border flex items-center justify-center mb-6">
            <span className="text-3xl">🏗️</span>
          </div>
          <h3 className="text-md font-heading font-semibold text-slate-400 mb-2">
            Ready to Build
          </h3>
          <p className="text-sm text-slate-600 max-w-md">
            Describe any application — ByteTrust will generate the code, auto-fix bugs,
            compile to bytecode, and run it. You get a working app at a localhost URL.
          </p>
        </motion.div>
      )}
    </div>
  );
}
