'use client';

import { motion } from 'framer-motion';

interface PipelineProgressProps {
  currentStage: number;
  stages: string[];
}

export default function PipelineProgress({ currentStage, stages }: PipelineProgressProps) {
  return (
    <div className="w-full py-4 px-2 overflow-x-auto">
      <div className="flex items-center justify-between min-w-[600px]">
        {stages.map((stage, index) => {
          const isCompleted = index < currentStage;
          const isCurrent = index === currentStage;
          const isFuture = index > currentStage;

          return (
            <div key={index} className="flex items-center flex-1 last:flex-initial">
              {/* Dot + label */}
              <div className="flex flex-col items-center gap-1.5">
                <motion.div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all
                    ${isCompleted ? 'bg-bytetrust-cyan text-bytetrust-dark' : ''}
                    ${isCurrent ? 'bg-bytetrust-cyan text-bytetrust-dark pulse-dot' : ''}
                    ${isFuture ? 'bg-bytetrust-border/50 text-slate-600 border border-bytetrust-border' : ''}
                  `}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {isCompleted ? '✓' : index + 1}
                </motion.div>
                <span
                  className={`text-[10px] text-center max-w-[70px] leading-tight ${
                    isCurrent ? 'text-bytetrust-cyan font-semibold' : isCompleted ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  {stage}
                </span>
              </div>

              {/* Connecting line */}
              {index < stages.length - 1 && (
                <div className="flex-1 h-[2px] mx-1 rounded-full overflow-hidden bg-bytetrust-border/30">
                  <motion.div
                    className="h-full bg-bytetrust-cyan"
                    initial={{ width: 0 }}
                    animate={{ width: isCompleted ? '100%' : '0%' }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
