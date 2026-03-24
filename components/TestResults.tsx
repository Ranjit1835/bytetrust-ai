'use client';

import { motion } from 'framer-motion';
import { CheckCircle, XCircle } from 'lucide-react';
import type { TestResult } from '@/lib/types';

interface TestResultsProps {
  testCases: TestResult[];
}

export default function TestResults({ testCases }: TestResultsProps) {
  const passed = testCases.filter((t) => t.passed).length;
  const total = testCases.length;
  const passRate = total > 0 ? (passed / total) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      {/* Summary bar */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-300">
          {passed} / {total} tests passed
        </span>
        <span className={`text-sm font-semibold ${passRate === 100 ? 'text-emerald-400' : passRate >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
          {Math.round(passRate)}%
        </span>
      </div>
      {/* Progress bar */}
      <div className="w-full h-2 bg-bytetrust-border rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: passRate === 100 ? '#10b981' : passRate >= 60 ? '#f59e0b' : '#ef4444',
          }}
          initial={{ width: 0 }}
          animate={{ width: `${passRate}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      {/* Test table */}
      <div className="border border-bytetrust-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-bytetrust-surface text-slate-500">
              <th className="text-left px-4 py-2.5 font-medium">Test Case</th>
              <th className="text-left px-4 py-2.5 font-medium">Input</th>
              <th className="text-left px-4 py-2.5 font-medium">Expected</th>
              <th className="text-left px-4 py-2.5 font-medium">Got</th>
              <th className="text-center px-4 py-2.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {testCases.map((tc, i) => (
              <tr
                key={i}
                className={`border-t border-bytetrust-border/50 ${i % 2 === 0 ? 'bg-bytetrust-card' : 'bg-bytetrust-surface/50'}`}
              >
                <td className="px-4 py-2.5 text-slate-400 font-mono text-xs">#{i + 1}</td>
                <td className="px-4 py-2.5 text-slate-300 font-mono text-xs max-w-[160px] truncate">
                  {tc.input}
                </td>
                <td className="px-4 py-2.5 text-slate-300 font-mono text-xs max-w-[120px] truncate">
                  {tc.expected}
                </td>
                <td className="px-4 py-2.5 font-mono text-xs max-w-[120px] truncate">
                  <span className={tc.passed ? 'text-emerald-400' : 'text-red-400'}>
                    {tc.error ? tc.error : tc.actual || '(empty)'}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-center">
                  {tc.passed ? (
                    <CheckCircle size={18} className="text-emerald-400 mx-auto" />
                  ) : (
                    <XCircle size={18} className="text-red-400 mx-auto" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
