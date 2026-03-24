'use client';

import { motion } from 'framer-motion';
import { Shield, AlertTriangle, AlertCircle } from 'lucide-react';
import type { ConfidenceBreakdown } from '@/lib/types';

interface ConfidenceGaugeProps {
  score: number;
  risk: 'Low' | 'Medium' | 'High';
  breakdown?: ConfidenceBreakdown;
}

export default function ConfidenceGauge({ score, risk, breakdown }: ConfidenceGaugeProps) {
  const radius = 80;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  const color = score > 80 ? '#10b981' : score > 50 ? '#f59e0b' : '#ef4444';
  const bgColor = score > 80 ? 'rgba(16,185,129,0.1)' : score > 50 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)';

  const RiskIcon = risk === 'Low' ? Shield : risk === 'Medium' ? AlertTriangle : AlertCircle;
  const riskColor = risk === 'Low' ? 'text-emerald-400 bg-emerald-400/10' : risk === 'Medium' ? 'text-yellow-400 bg-yellow-400/10' : 'text-red-400 bg-red-400/10';

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      {/* SVG Gauge */}
      <div className="relative">
        <svg width="200" height="200" viewBox="0 0 200 200">
          {/* Background circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="rgba(26,45,74,0.5)"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <motion.circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            transform="rotate(-90 100 100)"
            style={{ filter: `drop-shadow(0 0 8px ${color}40)` }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-4xl font-heading font-bold"
            style={{ color }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            {score}
          </motion.span>
          <span className="text-sm text-slate-500">/ 100</span>
        </div>
      </div>

      {/* Risk badge */}
      <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${riskColor}`}>
        <RiskIcon size={16} />
        <span className="text-sm font-semibold">{risk} Risk</span>
      </div>

      {/* Breakdown pills */}
      {breakdown && (
        <div className="flex gap-3 flex-wrap justify-center">
          <StatPill label="Test Pass Rate" value={`${breakdown.test_score}/60`} bg={bgColor} />
          <StatPill
            label="Complexity"
            value={breakdown.complexity_score >= 15 ? 'Low' : breakdown.complexity_score >= 10 ? 'Med' : 'High'}
            bg={bgColor}
          />
          <StatPill label="Coverage" value={`${breakdown.coverage_score}/25`} bg={bgColor} />
        </div>
      )}
    </div>
  );
}

function StatPill({ label, value, bg }: { label: string; value: string; bg: string }) {
  return (
    <div className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl border border-bytetrust-border" style={{ background: bg }}>
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-200">{value}</span>
    </div>
  );
}
