'use client';

import { motion } from 'framer-motion';
import type { ExecutionStep } from '@/lib/types';

interface ExecutionPlanProps {
  steps: ExecutionStep[];
}

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  INIT: { bg: 'bg-blue-500/15', text: 'text-blue-400' },
  LOOP: { bg: 'bg-purple-500/15', text: 'text-purple-400' },
  CONDITION: { bg: 'bg-yellow-500/15', text: 'text-yellow-400' },
  COMPUTE: { bg: 'bg-cyan-500/15', text: 'text-cyan-400' },
  RETURN: { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
};

export default function ExecutionPlan({ steps }: ExecutionPlanProps) {
  return (
    <div className="space-y-2">
      {steps.map((step, index) => {
        const colors = TYPE_COLORS[step.type] || TYPE_COLORS.COMPUTE;
        return (
          <motion.div
            key={step.step}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.08 }}
            className="flex items-start gap-3 p-3 rounded-lg bg-bytetrust-surface border border-bytetrust-border/50 hover:border-bytetrust-border transition-colors"
          >
            {/* Step number */}
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-bytetrust-cyan/10 flex items-center justify-center">
              <span className="text-xs font-bold text-bytetrust-cyan">{step.step}</span>
            </div>

            {/* Type badge */}
            <div className={`flex-shrink-0 px-2.5 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wider ${colors.bg} ${colors.text}`}>
              {step.type}
            </div>

            {/* Description */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-200 font-medium">{step.description}</p>
              <p className="text-xs text-slate-500 mt-0.5">{step.detail}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
