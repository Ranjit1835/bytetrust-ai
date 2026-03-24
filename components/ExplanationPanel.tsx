'use client';

import { motion } from 'framer-motion';
import { Lightbulb, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { Explanation } from '@/lib/types';

interface ExplanationPanelProps {
  explanation: Explanation;
}

const sections = [
  {
    key: 'how_it_works' as const,
    title: 'How It Works',
    icon: Lightbulb,
    borderColor: 'border-l-cyan-400',
    iconColor: 'text-cyan-400',
    bgTint: 'bg-cyan-400/[0.03]',
  },
  {
    key: 'why_correct' as const,
    title: 'Why It\'s Correct',
    icon: CheckCircle2,
    borderColor: 'border-l-emerald-400',
    iconColor: 'text-emerald-400',
    bgTint: 'bg-emerald-400/[0.03]',
  },
  {
    key: 'where_it_fails' as const,
    title: 'Where It Might Fail',
    icon: AlertTriangle,
    borderColor: 'border-l-amber-400',
    iconColor: 'text-amber-400',
    bgTint: 'bg-amber-400/[0.03]',
  },
];

export default function ExplanationPanel({ explanation }: ExplanationPanelProps) {
  return (
    <div className="space-y-3">
      {sections.map((section, index) => {
        const Icon = section.icon;
        return (
          <motion.div
            key={section.key}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={`rounded-xl border border-bytetrust-border border-l-4 ${section.borderColor} ${section.bgTint} p-4`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon size={16} className={section.iconColor} />
              <h4 className="text-sm font-semibold text-slate-200">{section.title}</h4>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              {explanation[section.key]}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}
