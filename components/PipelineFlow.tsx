'use client';

import { motion } from 'framer-motion';
import type { BlockId, BlockStatus } from '@/lib/orchestrator';

export interface BlockData {
  id: BlockId;
  label: string;
  emoji: string;
  status: BlockStatus;
  message: string;
  iteration: number;
}

interface PipelineFlowProps {
  blocks: BlockData[];
  activeBlock: BlockId | null;
  onBlockClick: (blockId: BlockId) => void;
}

const statusColors: Record<BlockStatus, { bg: string; border: string; text: string; glow: string }> = {
  idle: { bg: 'bg-[#111318]', border: 'border-[#1e2028]', text: 'text-slate-600', glow: '' },
  running: { bg: 'bg-blue-500/10', border: 'border-blue-500/50', text: 'text-blue-400', glow: 'shadow-[0_0_24px_rgba(59,130,246,0.35)]' },
  passed: { bg: 'bg-emerald-500/8', border: 'border-emerald-500/40', text: 'text-emerald-400', glow: 'shadow-[0_0_16px_rgba(16,185,129,0.15)]' },
  failed: { bg: 'bg-red-500/10', border: 'border-red-500/50', text: 'text-red-400', glow: 'shadow-[0_0_24px_rgba(239,68,68,0.35)]' },
  retrying: { bg: 'bg-amber-500/10', border: 'border-amber-500/50', text: 'text-amber-400', glow: 'shadow-[0_0_24px_rgba(245,158,11,0.35)]' },
};

export default function PipelineFlow({ blocks, activeBlock, onBlockClick }: PipelineFlowProps) {
  // Determine if there's a self-heal happening (generate is retrying)
  const generateBlock = blocks.find(b => b.id === 'generate');
  const testBlock = blocks.find(b => b.id === 'test');
  const isSelfHealing = generateBlock?.status === 'retrying' || testBlock?.status === 'retrying';

  return (
    <div className="w-full py-2">
      <div className="flex items-center justify-between gap-1 sm:gap-2 overflow-x-auto pb-2 px-1">
        {blocks.map((block, index) => {
          const colors = statusColors[block.status];
          const isActive = activeBlock === block.id;

          // Is the spark traveling backwards to this block?
          const isBackTarget = isSelfHealing && block.id === 'generate';
          // Is the spark traveling from this block (test failed)?
          const isBackSource = isSelfHealing && block.id === 'test';

          return (
            <div key={block.id} className="flex items-center flex-shrink-0">
              <motion.button
                onClick={() => onBlockClick(block.id)}
                animate={{
                  scale: block.status === 'running' ? [1, 1.03, 1] : 1,
                }}
                transition={{
                  duration: 1.5,
                  repeat: block.status === 'running' ? Infinity : 0,
                  ease: 'easeInOut',
                }}
                className={`relative flex flex-col items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-3 sm:py-4 rounded-2xl border-2 min-w-[90px] sm:min-w-[120px] transition-all duration-300
                  ${colors.bg} ${colors.border} ${colors.glow}
                  ${isActive ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-[#0a0a0f]' : ''}
                  hover:border-cyan-500/40 cursor-pointer`}
              >
                {/* Retry badge */}
                {block.iteration > 1 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-[10px] font-bold text-black flex items-center justify-center shadow-lg shadow-amber-500/30"
                  >
                    {block.iteration}×
                  </motion.span>
                )}

                {/* Animated status icon */}
                <div className="text-2xl relative">
                  {block.status === 'idle' && <span className="opacity-40">{block.emoji}</span>}
                  {block.status === 'running' && (
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    >
                      ⚙️
                    </motion.span>
                  )}
                  {block.status === 'passed' && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.3, 1] }}
                      transition={{ duration: 0.4 }}
                    >
                      ✅
                    </motion.span>
                  )}
                  {block.status === 'failed' && (
                    <motion.span
                      animate={{ x: [-2, 2, -2, 2, 0] }}
                      transition={{ duration: 0.4 }}
                    >
                      ❌
                    </motion.span>
                  )}
                  {block.status === 'retrying' && (
                    <motion.span
                      animate={{ rotate: [0, -360] }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      🔄
                    </motion.span>
                  )}

                  {/* Pulse ring for running */}
                  {block.status === 'running' && (
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-blue-400"
                      animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                </div>

                {/* Label */}
                <span className={`text-xs font-semibold ${colors.text}`}>
                  {block.label}
                </span>

                {/* Status message */}
                <span className={`text-[9px] sm:text-[10px] ${colors.text} opacity-70 text-center leading-tight max-w-[100px] line-clamp-2`}>
                  {block.message || block.status}
                </span>
              </motion.button>

              {/* Connector between blocks */}
              {index < blocks.length - 1 && (
                <div className="mx-1 sm:mx-2 flex-shrink-0 relative" style={{ width: 36, height: 20 }}>
                  {/* Base connector line */}
                  <svg width="36" height="20" viewBox="0 0 36 20" className="absolute inset-0">
                    <path
                      d="M2 10 L28 10 M24 5 L30 10 L24 15"
                      stroke={block.status === 'passed' ? '#10b981' : '#1e2028'}
                      strokeWidth="2"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </svg>

                  {/* Forward spark — appears when current block passes */}
                  {block.status === 'passed' && blocks[index + 1]?.status === 'running' && (
                    <motion.div
                      className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-emerald-400"
                      style={{ filter: 'blur(1px)', boxShadow: '0 0 8px #10b981' }}
                      initial={{ left: 0 }}
                      animate={{ left: [0, 36] }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                    />
                  )}

                  {/* REVERSE spark — travels back during self-heal! */}
                  {isBackSource && index > 0 && (
                    <motion.div
                      className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-amber-400"
                      style={{ filter: 'blur(1px)', boxShadow: '0 0 12px #f59e0b' }}
                      initial={{ left: 36 }}
                      animate={{ left: [36, 0] }}
                      transition={{ duration: 0.5, ease: 'easeIn' }}
                    />
                  )}

                  {/* Reverse arc indicator (backward arrow) during self-heal */}
                  {isSelfHealing && block.id === 'generate' && (
                    <svg width="36" height="20" viewBox="0 0 36 20" className="absolute inset-0">
                      <motion.path
                        d="M30 10 L8 10 M12 5 L6 10 L12 15"
                        stroke="#f59e0b"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                      />
                    </svg>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Self-heal status bar */}
      {isSelfHealing && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-amber-500/10 border border-amber-500/20"
        >
          <motion.span
            animate={{ rotate: [0, -360] }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="text-sm"
          >
            🔄
          </motion.span>
          <span className="text-xs text-amber-400 font-medium">
            Self-healing: AI is fixing code and re-testing...
          </span>
          <motion.div
            className="flex gap-0.5"
          >
            {[0, 1, 2].map(i => (
              <motion.span
                key={i}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-amber-400"
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
