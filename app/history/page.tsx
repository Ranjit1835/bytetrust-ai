'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Clock, Shield, AlertTriangle, AlertCircle, ArrowRight, Inbox, RefreshCw } from 'lucide-react';

interface AnalysisRecord {
  id: string;
  prompt: string;
  confidence_score: number;
  risk_level: 'Low' | 'Medium' | 'High';
  created_at: string;
  code?: string;
  execution_plan?: unknown;
  test_results?: unknown;
  explanation?: string;
}

export default function HistoryPage() {
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/history');
      setAnalyses(res.data || []);
    } catch (err) {
      console.error('Failed to fetch history:', err);
      setError('Failed to load history. Make sure the database is set up.');
      setAnalyses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const riskConfig = {
    Low: { color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30', icon: Shield },
    Medium: { color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/30', icon: AlertTriangle },
    High: { color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/30', icon: AlertCircle },
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-heading font-bold text-white">History</h1>
          <p className="text-sm text-slate-500 mt-1">Your past code analyses</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchHistory}
            disabled={loading}
            className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg border border-bytetrust-border text-slate-400 hover:text-white hover:border-bytetrust-cyan/40 transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-bytetrust-cyan/10 text-bytetrust-cyan hover:bg-bytetrust-cyan/20 transition-colors font-medium"
          >
            New Analysis
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 mb-6"
        >
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold">Error</p>
            <p className="text-xs mt-1 text-red-400/80">{error}</p>
          </div>
        </motion.div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-bytetrust-border bg-bytetrust-card p-5 animate-pulse"
            >
              <div className="h-4 bg-bytetrust-border rounded w-3/4 mb-3" />
              <div className="h-3 bg-bytetrust-border/60 rounded w-1/2 mb-4" />
              <div className="flex gap-2">
                <div className="h-6 bg-bytetrust-border/40 rounded-full w-16" />
                <div className="h-6 bg-bytetrust-border/40 rounded-full w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : analyses.length === 0 && !error ? (
        /* Empty state */
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          <div className="w-20 h-20 rounded-2xl bg-bytetrust-card border border-bytetrust-border flex items-center justify-center mb-6">
            <Inbox size={36} className="text-slate-600" />
          </div>
          <h3 className="text-lg font-heading font-semibold text-slate-300 mb-2">
            No analyses yet
          </h3>
          <p className="text-sm text-slate-500 max-w-sm mb-6">
            Run your first analysis to see results here. Each analysis is saved
            automatically.
          </p>
          <Link
            href="/dashboard"
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-bytetrust-cyan to-cyan-600 text-bytetrust-dark font-semibold text-sm hover:shadow-lg hover:shadow-bytetrust-cyan/20 transition-all"
          >
            Run First Analysis
          </Link>
        </motion.div>
      ) : (
        /* Card grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analyses.map((analysis, index) => {
            const rc = riskConfig[analysis.risk_level] || riskConfig.Medium;
            const RiskIcon = rc.icon;
            return (
              <motion.div
                key={analysis.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`rounded-xl border ${rc.border} bg-bytetrust-card p-5 card-hover`}
              >
                <p className="text-sm text-slate-200 font-medium line-clamp-2 mb-3">
                  {analysis.prompt}
                </p>
                <div className="flex items-center gap-3 text-xs">
                  {/* Score badge */}
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-bytetrust-surface border border-bytetrust-border">
                    <span className="font-bold text-white">{analysis.confidence_score}</span>
                    <span className="text-slate-500">/100</span>
                  </div>
                  {/* Risk pill */}
                  <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full ${rc.bg}`}>
                    <RiskIcon size={12} className={rc.color} />
                    <span className={`font-semibold ${rc.color}`}>{analysis.risk_level}</span>
                  </div>
                  {/* Date */}
                  <div className="flex items-center gap-1 text-slate-600 ml-auto">
                    <Clock size={12} />
                    {new Date(analysis.created_at).toLocaleDateString()}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
